import { WebSocketServer, WebSocket } from 'ws';
import { db } from './db';
import { scamTrends, newsItems } from '../shared/schema';
import { desc } from 'drizzle-orm';

interface NotificationClient {
  socket: WebSocket;
  userId?: string;
  deviceType: 'mobile' | 'web';
  registeredAt: Date;
}

interface PushNotification {
  id: string;
  type: 'scam_alert' | 'news_update' | 'trend_warning';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: Record<string, any>;
  createdAt: Date;
}

export class MobileNotificationService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, NotificationClient> = new Map();

  initialize(httpServer: any): void {
    this.wss = new WebSocketServer({ 
      server: httpServer, 
      path: '/mobile-notifications' 
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      const client: NotificationClient = {
        socket: ws,
        deviceType: 'mobile', // Default to mobile for this service
        registeredAt: new Date()
      };

      this.clients.set(clientId, client);
      console.log(`Mobile client connected: ${clientId}`);

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'register') {
            client.userId = data.userId;
            client.deviceType = data.deviceType || 'mobile';
            console.log(`Client ${clientId} registered as ${data.deviceType} for user ${data.userId}`);
            
            // Send welcome message
            this.sendToClient(clientId, {
              id: this.generateNotificationId(),
              type: 'news_update',
              title: 'Boomer Buddy Connected',
              message: 'You will now receive real-time scam alerts and safety updates.',
              priority: 'low',
              createdAt: new Date()
            });
          }
        } catch (error) {
          console.error('Error processing client message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Mobile client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });
  }

  // Send notifications about new high-severity scam trends
  async notifyNewCriticalTrend(trend: any): Promise<void> {
    if (trend.severity !== 'critical' && trend.severity !== 'high') {
      return;
    }

    const notification: PushNotification = {
      id: this.generateNotificationId(),
      type: 'scam_alert',
      title: '🚨 New Scam Alert',
      message: `${trend.title} - ${trend.reportCount} reports from ${trend.sourceAgency}`,
      priority: trend.severity === 'critical' ? 'critical' : 'high',
      data: {
        trendId: trend.id,
        sourceUrl: trend.sourceUrl,
        category: trend.category,
        tags: trend.tags
      },
      createdAt: new Date()
    };

    await this.broadcast(notification);
    console.log(`Broadcast critical scam alert: ${trend.title}`);
  }

  // Send notifications about verified news updates
  async notifyVerifiedNews(newsItem: any): Promise<void> {
    const notification: PushNotification = {
      id: this.generateNotificationId(),
      type: 'news_update',
      title: '📰 Verified Safety Update',
      message: `New from ${newsItem.sourceAgency}: ${newsItem.title}`,
      priority: 'medium',
      data: {
        newsId: newsItem.id,
        sourceUrl: newsItem.sourceUrl,
        reliability: newsItem.reliability,
        category: newsItem.category
      },
      createdAt: new Date()
    };

    await this.broadcast(notification);
    console.log(`Broadcast verified news: ${newsItem.title}`);
  }

  // Send live trend warnings based on user activity
  async sendTrendWarning(userId: string, message: string, trendData: any): Promise<void> {
    const notification: PushNotification = {
      id: this.generateNotificationId(),
      type: 'trend_warning',
      title: '⚠️ Active Scam Detected',
      message: `Warning: ${message}`,
      priority: 'high',
      data: trendData,
      createdAt: new Date()
    };

    await this.sendToUser(userId, notification);
  }

  // Daily safety summary for mobile users
  async sendDailySafetySummary(): Promise<void> {
    try {
      // Get today's most significant trends
      const recentTrends = await db.select()
        .from(scamTrends)
        .orderBy(desc(scamTrends.lastReported))
        .limit(5);

      const recentNews = await db.select()
        .from(newsItems)
        .orderBy(desc(newsItems.publishDate))
        .limit(3);

      const totalTrends = recentTrends.length;
      const criticalTrends = recentTrends.filter(t => t.severity === 'critical').length;

      const notification: PushNotification = {
        id: this.generateNotificationId(),
        type: 'news_update',
        title: '📊 Daily Safety Summary',
        message: `Today: ${totalTrends} active scam alerts${criticalTrends > 0 ? `, ${criticalTrends} critical` : ''}, ${recentNews.length} verified updates`,
        priority: 'low',
        data: {
          trends: recentTrends,
          news: recentNews,
          summary: {
            totalTrends,
            criticalTrends,
            newsUpdates: recentNews.length
          }
        },
        createdAt: new Date()
      };

      await this.broadcast(notification);
      console.log('Sent daily safety summary to all mobile clients');
    } catch (error) {
      console.error('Error sending daily summary:', error);
    }
  }

  private async broadcast(notification: PushNotification): Promise<void> {
    const activeClients = Array.from(this.clients.entries()).filter(
      ([_, client]) => client.socket.readyState === WebSocket.OPEN
    );

    console.log(`Broadcasting to ${activeClients.length} mobile clients`);

    for (const [clientId, client] of activeClients) {
      try {
        client.socket.send(JSON.stringify(notification));
      } catch (error) {
        console.error(`Failed to send to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    }
  }

  private async sendToUser(userId: string, notification: PushNotification): Promise<void> {
    const userClients = Array.from(this.clients.entries()).filter(
      ([_, client]) => client.userId === userId && client.socket.readyState === WebSocket.OPEN
    );

    for (const [clientId, client] of userClients) {
      try {
        client.socket.send(JSON.stringify(notification));
      } catch (error) {
        console.error(`Failed to send to user ${userId}, client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    }
  }

  private async sendToClient(clientId: string, notification: PushNotification): Promise<void> {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.send(JSON.stringify(notification));
      } catch (error) {
        console.error(`Failed to send to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    }
  }

  getConnectionStats(): { totalClients: number; mobileClients: number; webClients: number } {
    const active = Array.from(this.clients.values()).filter(
      client => client.socket.readyState === WebSocket.OPEN
    );

    return {
      totalClients: active.length,
      mobileClients: active.filter(c => c.deviceType === 'mobile').length,
      webClients: active.filter(c => c.deviceType === 'web').length
    };
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const mobileNotificationService = new MobileNotificationService();

// Schedule daily summaries
setInterval(() => {
  mobileNotificationService.sendDailySafetySummary();
}, 24 * 60 * 60 * 1000); // Every 24 hours