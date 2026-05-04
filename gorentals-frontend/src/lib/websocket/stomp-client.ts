'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { TOKEN_KEY } from '../axios';

export function useStomp() {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    // Determine the base WS URL
    // If NEXT_PUBLIC_API_URL is "http://localhost:8080/api", WS URL should be "http://localhost:8080/ws"
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const wsBaseUrl = apiBase.replace('/api', '/ws');
    
    // Retrieve token for authentication
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsBaseUrl),
      connectHeaders: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      debug: () => {
        if (process.env.NODE_ENV !== 'production') {
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
    };

    client.onStompError = (frame) => {
      console.error('[STOMP] Broker reported error: ' + frame.headers['message']);
      console.error('[STOMP] Additional details: ' + frame.body);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, []);

  const subscribe = useCallback((destination: string, callback: (message: IMessage) => void): () => void => {
    if (!clientRef.current || !clientRef.current.connected) {
      // If not connected yet, we might want to wait or throw. 
      // A robust implementation would queue subscriptions or retry.
      console.warn('[STOMP] Client not connected yet, subscription may fail');
    }

    const client = clientRef.current;
    let subscription: StompSubscription | null = null;

    if (client && client.connected) {
        subscription = client.subscribe(destination, callback);
    } else if (client) {
        // Wait for connect event if not connected yet
        const originalOnConnect = client.onConnect;
        client.onConnect = (frame) => {
            if (originalOnConnect) originalOnConnect(frame);
            subscription = client.subscribe(destination, callback);
        };
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return { subscribe };
}
