import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { loadDatabase, getDb, recordRealtimeEvent } from './database/db.js';
import { seedDatabase } from './database/seed.js';

import authRoutes, { setAuthBroadcastFn } from './routes/auth.js';
import departmentRoutes, { setDeptBroadcastFn } from './routes/departments.js';
import patientRoutes from './routes/patients.js';
import queueRoutes, { setBroadcastFn as setQueueBroadcast } from './routes/queue.js';
import appointmentRoutes, { setAppointmentBroadcastFn } from './routes/appointments.js';
import prescriptionRoutes, { setPrescriptionBroadcastFn } from './routes/prescriptions.js';
import labRoutes, { setLabBroadcastFn } from './routes/lab.js';
import pharmacyRoutes, { setPharmacyBroadcastFn } from './routes/pharmacy.js';
import analyticsRoutes from './routes/analytics.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'scans');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {
    // In serverless read-only environments
  }
}

// Initialize Database & Seed
await loadDatabase();
await seedDatabase();

const app = express();
const server = http.createServer(app);

// Initialize WebSocket only if not in standard serverless execution
let wss = null;
const clients = new Set();

try {
  wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`[WebSocket] Client connected. Total active clients: ${clients.size}`);

    ws.send(JSON.stringify({
      type: 'CONNECTION_ESTABLISHED',
      message: 'Connected to Al-Shafay Hospital Real-Time Engine'
    }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
        }
      } catch (e) {
        console.error('[WebSocket] Failed to parse message', e);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WebSocket] Client disconnected. Active clients: ${clients.size}`);
    });
  });
} catch (e) {
  console.log('[WebSocket] Serverless environment detected. Using Event Polling mode.');
}

// CORS & Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Universal Broadcast Helper (WebSockets + Persistent Serverless Event Stream)
export function broadcast(eventData) {
  // 1. Record event into persistent stream for serverless clients
  recordRealtimeEvent(eventData);

  // 2. Deliver via WebSocket if active clients are connected
  const payload = JSON.stringify(eventData);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Inject broadcast to all route handlers
setAuthBroadcastFn(broadcast);
setDeptBroadcastFn(broadcast);
setQueueBroadcast(broadcast);
setPrescriptionBroadcastFn(broadcast);
setLabBroadcastFn(broadcast);
setPharmacyBroadcastFn(broadcast);
setAppointmentBroadcastFn(broadcast);


// Register REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/meta', departmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serverless Real-Time Event Sync API (For Vercel / Polling Mode)
app.get('/api/events', (req, res) => {
  const since = Number(req.query.since) || 0;
  const db = getDb();
  const events = (db.events || []).filter(ev => ev.timestamp > since);
  res.json({
    success: true,
    serverTime: Date.now(),
    events
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    hospital: 'Al-Shafay Hospital Fatehpur',
    clientsConnected: clients.size,
    timestamp: new Date().toISOString()
  });
});

// Static client hosting in production standalone mode
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexHtml = path.join(clientDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.send(`<h2>Al-Shafay Hospital API Server is Running.</h2><p>Client is served separately in development or Vercel static hosting.</p>`);
    }
  });
});

// Start standalone HTTP server when executed directly
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  Al-Shafay Hospital Fatehpur - HMS Backend`);
    console.log(`  HTTP Server: http://localhost:${PORT}`);
    console.log(`  WebSocket Server: ws://localhost:${PORT}/ws`);
    console.log(`=======================================================`);
  });
}

export default app;
