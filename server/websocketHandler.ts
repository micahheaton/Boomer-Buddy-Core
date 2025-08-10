import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { db } from './db';
import { scamTrends, newsItems } from '../shared/schema';
import { desc, eq } from 'drizzle-orm';

interface WebSocketClient {
  ws: WebSocket;
  subscriptions: string[];
  lastPing: number;
}

export class WebSocketHandler {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, WebSocketClient> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      clientTracking: true
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('WebSocket client connected from:', req.socket.remoteAddress);
      
      const client: WebSocketClient = {
        ws,
        subscriptions: ['heatmap', 'alerts'], // Default subscriptions
        lastPing: Date.now()
      };
      
      this.clients.set(ws, client);

      // Send initial data
      this.sendInitialData(ws);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('pong', () => {
        const client = this.clients.get(ws);
        if (client) {
          client.lastPing = Date.now();
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send ping to keep connection alive
      ws.ping();
    });

    // Start ping interval
    this.startPingInterval();

    console.log('WebSocket server initialized on path /ws');
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.clients.forEach((client, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
          client.lastPing = Date.now();
        } else {
          this.clients.delete(ws);
        }
      });
    }, 30000); // Ping every 30 seconds
  }

  private async sendInitialData(ws: WebSocket) {
    try {
      // Send current trends
      const trends = await db.select()
        .from(scamTrends)
        .where(eq(scamTrends.isActive, true))
        .orderBy(desc(scamTrends.lastReported))
        .limit(20);

      const news = await db.select()
        .from(newsItems)
        .where(eq(newsItems.isVerified, true))
        .orderBy(desc(newsItems.publishDate))
        .limit(10);

      this.sendToClient(ws, {
        type: 'initial_data',
        data: {
          trends: trends.map(trend => ({
            id: trend.id,
            title: trend.title,
            description: trend.description,
            severity: trend.severity,
            category: trend.category,
            affectedRegions: trend.affectedRegions || [],
            reportCount: trend.reportCount,
            firstReported: trend.firstReported,
            lastReported: trend.lastReported,
            sourceAgency: trend.sourceAgency
          })),
          news: news.map(item => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            category: item.category,
            sourceAgency: item.sourceAgency,
            publishDate: item.publishDate
          })),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  private handleMessage(ws: WebSocket, message: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (message.type) {
      case 'subscribe':
        if (message.topics && Array.isArray(message.topics)) {
          client.subscriptions = [...new Set([...client.subscriptions, ...message.topics])];
          this.sendToClient(ws, { type: 'subscribed', topics: client.subscriptions });
        }
        break;

      case 'unsubscribe':
        if (message.topics && Array.isArray(message.topics)) {
          client.subscriptions = client.subscriptions.filter(sub => !message.topics.includes(sub));
          this.sendToClient(ws, { type: 'unsubscribed', topics: message.topics });
        }
        break;

      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
        break;

      case 'request_data':
        // Send fresh data when requested
        this.sendInitialData(ws);
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  private sendToClient(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Broadcast new alerts to all connected clients
  broadcastNewAlert(alert: {
    id: string;
    title: string;
    description: string;
    severity: string;
    category: string;
    affectedRegions: string[];
    reportCount: number;
    sourceAgency: string;
    timestamp: string;
  }) {
    const message = {
      type: 'new_alert',
      data: alert,
      timestamp: new Date().toISOString()
    };

    this.clients.forEach((client, ws) => {
      if (client.subscriptions.includes('alerts') || client.subscriptions.includes('heatmap')) {
        this.sendToClient(ws, message);
      }
    });

    console.log(`Broadcasted new alert to ${this.clients.size} clients:`, alert.title);
  }

  // Broadcast trend updates
  broadcastTrendUpdate(trend: {
    id: string;
    title: string;
    reportCount: number;
    affectedRegions: string[];
    severity: string;
    lastReported: string;
  }) {
    const message = {
      type: 'trend_update',
      data: trend,
      timestamp: new Date().toISOString()
    };

    this.clients.forEach((client, ws) => {
      if (client.subscriptions.includes('heatmap')) {
        this.sendToClient(ws, message);
      }
    });

    console.log(`Broadcasted trend update to ${this.clients.size} clients:`, trend.title);
  }

  // Broadcast critical news
  broadcastCriticalNews(news: {
    id: string;
    title: string;
    summary: string;
    category: string;
    sourceAgency: string;
    publishDate: string;
  }) {
    const message = {
      type: 'critical_news',
      data: news,
      timestamp: new Date().toISOString()
    };

    this.clients.forEach((client, ws) => {
      if (client.subscriptions.includes('alerts') || client.subscriptions.includes('news')) {
        this.sendToClient(ws, message);
      }
    });

    console.log(`Broadcasted critical news to ${this.clients.size} clients:`, news.title);
  }

  // Get connection statistics
  getStats() {
    return {
      connectedClients: this.clients.size,
      activeConnections: Array.from(this.clients.values()).filter(client => 
        client.ws.readyState === WebSocket.OPEN
      ).length
    };
  }

  // Cleanup
  cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    if (this.wss) {
      this.wss.close();
    }
    
    this.clients.clear();
  }
}

export const webSocketHandler = new WebSocketHandler();