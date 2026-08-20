import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

// Default Database Schema
export const initialData = {
  users: [],
  departments: [],
  doctors: [],
  patients: [],
  tokens: [],
  appointments: [],
  prescriptions: [],
  labOrders: [],
  labTestCatalog: [],
  medicines: [],
  pharmacyInvoices: [],
  events: [], // Serverless real-time event log
  hospitalInfo: {
    name: "Al-Shafay Hospital Fatehpur",
    tagline: "Care, Compassion & Quality Healthcare",
    address: "Hospital Road, Fatehpur, District Layyah, Punjab, Pakistan",
    phone: "+92 300 1234567 / (0606) 812345",
    emergency: "+92 301 7654321",
    email: "info@alshafayhospital.com",
    timings: "24/7 Emergency & Outpatient Services",
    licenseNo: "PHC-LYH-2024-9981"
  }
};

let dbData = { ...initialData };
let pgPool = null;
let isPostgresConnected = false;

// Initialize PostgreSQL Pool if DATABASE_URL or POSTGRES_URL is provided
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

if (connectionString) {
  try {
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    pgPool = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pgPool.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]:', err.message);
    });
  } catch (err) {
    console.warn('[PostgreSQL Init Warning]: Falling back to local file storage.', err.message);
  }
}

/**
 * Initialize and load database from PostgreSQL or local file
 */
export async function loadDatabase() {
  if (pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        // Ensure storage table exists
        await client.query(`
          CREATE TABLE IF NOT EXISTS hospital_store (
            key VARCHAR(50) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS hospital_events (
            id SERIAL PRIMARY KEY,
            type VARCHAR(100) NOT NULL,
            payload JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Load persisted state
        const res = await client.query(`SELECT data FROM hospital_store WHERE key = 'main_state'`);
        if (res.rows.length > 0 && res.rows[0].data) {
          dbData = res.rows[0].data;
          isPostgresConnected = true;
          console.log('[PostgreSQL] Loaded persistent state from cloud database.');
          return dbData;
        } else {
          // If empty, initialize with file or initial data
          let fallback = { ...initialData };
          if (fs.existsSync(DATA_FILE)) {
            try {
              fallback = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
            } catch (e) {}
          }
          await client.query(
            `INSERT INTO hospital_store (key, data, updated_at) VALUES ('main_state', $1, NOW()) ON CONFLICT (key) DO UPDATE SET data = $1, updated_at = NOW()`,
            [JSON.stringify(fallback)]
          );
          dbData = fallback;
          isPostgresConnected = true;
          console.log('[PostgreSQL] Initialized cloud database state.');
          return dbData;
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[PostgreSQL Connection Error]: Cloud DB unavailable, using local JSON storage:', err.message);
    }
  }

  // Fallback to local filesystem / memory
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      dbData = JSON.parse(raw);
    } else {
      saveDatabase(initialData);
    }
  } catch (err) {
    console.error("Error loading local database:", err);
    dbData = { ...initialData };
  }
  return dbData;
}

let syncTimeout = null;

/**
 * Save database to PostgreSQL and local file
 */
export function saveDatabase(data) {
  if (data) dbData = data;

  // Local file backup
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    // In serverless / read-only filesystems, this may fail harmlessly
  }

  // Cloud PostgreSQL asynchronous flush
  if (pgPool && isPostgresConnected) {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      try {
        await pgPool.query(
          `INSERT INTO hospital_store (key, data, updated_at) VALUES ('main_state', $1, NOW()) ON CONFLICT (key) DO UPDATE SET data = $1, updated_at = NOW()`,
          [JSON.stringify(dbData)]
        );
      } catch (err) {
        console.error('[PostgreSQL Save Error]:', err.message);
      }
    }, 100);
  }
}

export function getDb() {
  return dbData;
}

export function updateDb(updater) {
  updater(dbData);
  saveDatabase(dbData);
  return dbData;
}

/**
 * Record a real-time event for serverless polling synchronization
 */
export function recordRealtimeEvent(event) {
  if (!dbData.events) dbData.events = [];
  const eventRecord = {
    id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    ...event
  };

  dbData.events.push(eventRecord);
  // Keep last 150 events in memory
  if (dbData.events.length > 150) {
    dbData.events = dbData.events.slice(-150);
  }

  if (pgPool && isPostgresConnected) {
    pgPool.query(
      `INSERT INTO hospital_events (type, payload) VALUES ($1, $2)`,
      [event.type || 'GENERIC', JSON.stringify(eventRecord)]
    ).catch(e => console.error('[PostgreSQL Event Insert Error]:', e.message));
  }

  return eventRecord;
}
