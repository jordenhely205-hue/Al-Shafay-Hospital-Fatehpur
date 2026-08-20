import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { announceTokenCall } from '../utils/speech';
import { playNotificationBeep } from '../utils/soundEffects';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [connected, setConnected] = useState(true);
  const [lastEvent, setLastEvent] = useState(null);
  const [enableAudio, setEnableAudio] = useState(true);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Set());
  const lastEventTimestampRef = useRef(Date.now() - 5000);
  const processedEventIdsRef = useRef(new Set());

  // Universal Event Dispatcher
  const dispatchEvent = (data) => {
    if (!data) return;

    // Deduplication check for event IDs
    if (data.id) {
      if (processedEventIdsRef.current.has(data.id)) return;
      processedEventIdsRef.current.add(data.id);
      if (processedEventIdsRef.current.size > 200) {
        processedEventIdsRef.current.clear();
      }
    }

    setLastEvent(data);

    // Notify all component subscribers
    listenersRef.current.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error("Socket listener error:", err);
      }
    });

    // Voice & Audio Announcements
    if (data.type === 'TOKEN_CALLED' && enableAudio) {
      const { tokenNumber, patientName, doctorName, roomNumber } = data.announcement || data.token || {};
      announceTokenCall(tokenNumber, patientName, doctorName, roomNumber);
    } else if (data.type === 'REFERRED_PATIENT_CALLED' && enableAudio) {
      const { tokenNumber, patientName, doctorName, roomNumber } = data.announcement || data.token || {};
      announceTokenCall(tokenNumber, patientName, doctorName, roomNumber, { isReferral: true });
    } else if (['QUEUE_UPDATED', 'LAB_ORDERS_CREATED', 'PRESCRIPTION_CREATED', 'DOCTORS_UPDATED', 'STAFF_UPDATED'].includes(data.type)) {
      playNotificationBeep();
    }
  };

  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;
    let pollingInterval = null;
    let wsFailed = false;

    // 1. Attempt WebSocket Connection (For local / VPS / Docker / Standalone node deployments)
    const connectWs = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;

        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log("[WebSocket] Live streaming connected.");
          setConnected(true);
          wsFailed = false;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            dispatchEvent(data);
          } catch (e) {
            console.warn("[WebSocket] Failed to parse message:", e);
          }
        };

        ws.onclose = () => {
          wsFailed = true;
          setConnected(true); // Retain active status via serverless polling fallback
          reconnectTimeout = setTimeout(connectWs, 8000);
        };

        ws.onerror = () => {
          wsFailed = true;
          try { ws.close(); } catch (e) {}
        };
      } catch (err) {
        wsFailed = true;
        reconnectTimeout = setTimeout(connectWs, 8000);
      }
    };

    // 2. High-Frequency Serverless Polling Fallback (Guaranteed to work on Vercel / Netlify / Cloudflare)
    const pollEvents = async () => {
      try {
        const since = lastEventTimestampRef.current;
        const res = await fetch(`/api/events?since=${since}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.events && json.events.length > 0) {
            json.events.forEach((ev) => {
              dispatchEvent(ev);
              if (ev.timestamp && ev.timestamp > lastEventTimestampRef.current) {
                lastEventTimestampRef.current = ev.timestamp;
              }
            });
          }
          if (json.serverTime) {
            lastEventTimestampRef.current = Math.max(lastEventTimestampRef.current, json.serverTime - 500);
          }
          setConnected(true);
        }
      } catch (err) {
        // Silent catch for intermittent network blips
      }
    };

    connectWs();
    pollingInterval = setInterval(pollEvents, 2000);

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pollingInterval) clearInterval(pollingInterval);
      if (ws) ws.close();
    };
  }, [enableAudio]);

  const subscribe = (callback) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  };

  const send = (data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  };

  return (
    <SocketContext.Provider value={{ connected, lastEvent, subscribe, send, enableAudio, setEnableAudio }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
