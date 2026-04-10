import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || localStorage.getItem('gr_token');
  }
  return null;
};

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.onMessageReceived = null;
    this.onConversationUpdate = null;
  }

  connect(onConnectSuccess) {
    const token = getToken();
    if (!token) return;

    const socket = new SockJS('http://localhost:8080/ws/chat');
    this.client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log('WS Debug:', str);
      },
      onConnect: () => {
        console.log('WS Connected');
        if (onConnectSuccess) onConnectSuccess();
      },
      onStompError: (frame) => {
        console.error('WS Stomp Error:', frame.headers['message']);
        console.error('WS Details:', frame.body);
      },
      onWebSocketClose: () => {
        console.log('WS Closed');
      },
    });

    this.client.activate();
  }

  subscribeToConversation(conversationId, callback) {
    if (!this.client || !this.client.connected) return;

    const topic = `/topic/conversation.${conversationId}`;
    const sub = this.client.subscribe(topic, (message) => {
      const payload = JSON.parse(message.body);
      callback(payload);
    });
    this.subscriptions.set(conversationId, sub);
  }

  subscribeToPrivateMessages(userEmail, callback) {
    if (!this.client || !this.client.connected) return;

    const topic = `/user/queue/messages`;
    return this.client.subscribe(topic, (message) => {
      const payload = JSON.parse(message.body);
      callback(payload);
    });
  }

  unsubscribeFromConversation(conversationId) {
    const sub = this.subscriptions.get(conversationId);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(conversationId);
    }
  }

  sendMessage(conversationId, messageText, tempId = null) {
    if (!this.client || !this.client.connected) return;

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        conversationId,
        messageText,
        tempId,
        messageType: 'TEXT',
      }),
    });
  }

  markAsRead(conversationId) {
    if (!this.client || !this.client.connected) return;

    this.client.publish({
      destination: '/app/chat.read',
      body: JSON.stringify({ conversationId }),
    });
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
