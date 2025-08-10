import cron from 'node-cron';
import { DataCollector } from './dataCollector';
import { personalizedNotificationService } from './personalizedNotificationService';
import { mobileNotificationService } from './mobileNotificationService';

export class ScheduledDataCollection {
  private dataCollector: DataCollector;
  private isRunning = false;

  constructor() {
    this.dataCollector = new DataCollector();
  }

  public startScheduledCollection(): void {
    if (this.isRunning) {
      console.log('Scheduled data collection already running');
      return;
    }

    console.log('Starting scheduled data collection (4x daily from official sources)...');
    
    // Collect data every 6 hours (4 times daily): 6 AM, 12 PM, 6 PM, 12 AM
    cron.schedule('0 6,12,18,0 * * *', async () => {
      await this.performScheduledCollection();
    });

    // Send weekly mini-games on Sundays at 10 AM
    cron.schedule('0 10 * * 0', async () => {
      await this.sendWeeklyMiniGames();
    });

    // Send vulnerability-based reminders daily at 2 PM
    cron.schedule('0 14 * * *', async () => {
      await personalizedNotificationService.sendVulnerabilityReminders();
    });

    this.isRunning = true;
    console.log('✅ Scheduled collection initialized:');
    console.log('  📊 Data collection: Every 6 hours from official .gov/.us sources');
    console.log('  🎯 Weekly mini-games: Sundays at 10 AM');
    console.log('  🔔 Daily reminders: 2 PM (vulnerability-based)');
  }

  private async performScheduledCollection(): Promise<void> {
    const startTime = Date.now();
    console.log(`🔄 Starting scheduled data collection at ${new Date().toISOString()}`);

    try {
      // Collect from official government sources
      await this.dataCollector.collectAllData();
      
      // Send notifications to subscribed users based on new alerts
      await this.processNewAlertsForNotifications();
      
      const duration = Date.now() - startTime;
      console.log(`✅ Scheduled collection completed in ${duration}ms`);
      
    } catch (error) {
      console.error('❌ Error during scheduled data collection:', error);
    }
  }

  private async processNewAlertsForNotifications(): Promise<void> {
    try {
      // Get recent trends/news from the last 6 hours
      const recentCutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);
      
      // This would get new trends and send personalized notifications
      // For now, simulating the process
      console.log('📱 Processing new alerts for personalized mobile notifications...');
      
      // Example: If new SSA scam alert, notify users vulnerable to social security scams
      // This will be implemented when we have real data flowing
      
    } catch (error) {
      console.error('Error processing new alerts for notifications:', error);
    }
  }

  private async sendWeeklyMiniGames(): Promise<void> {
    try {
      console.log('🎮 Sending weekly mini-games to subscribed users...');
      
      // Get all users who opted in for weekly mini-games
      // This would query users with active vulnerability assessments
      const activeUserIds = ['mock-user-1', 'mock-user-2']; // Placeholder
      
      for (const userId of activeUserIds) {
        await personalizedNotificationService.sendWeeklyMiniGame(userId);
      }
      
      console.log(`📤 Sent weekly mini-games to ${activeUserIds.length} users`);
      
    } catch (error) {
      console.error('Error sending weekly mini-games:', error);
    }
  }

  public stopScheduledCollection(): void {
    // Note: node-cron doesn't provide direct stop method for individual tasks
    // In production, you'd track task references to stop them
    this.isRunning = false;
    console.log('⏹️ Scheduled data collection stopped');
  }

  public getScheduleStatus(): {
    isRunning: boolean;
    nextCollectionTime: string;
    nextMiniGameTime: string;
  } {
    // Calculate next execution times based on cron schedules
    const now = new Date();
    const nextCollection = this.getNextCronExecution(now, '0 6,12,18,0 * * *');
    const nextMiniGame = this.getNextCronExecution(now, '0 10 * * 0');

    return {
      isRunning: this.isRunning,
      nextCollectionTime: nextCollection.toISOString(),
      nextMiniGameTime: nextMiniGame.toISOString()
    };
  }

  private getNextCronExecution(from: Date, cronExpression: string): Date {
    // Simplified calculation - in production use a proper cron parser
    const next = new Date(from);
    
    if (cronExpression === '0 6,12,18,0 * * *') {
      // Next 6-hour interval
      const hours = [0, 6, 12, 18];
      const currentHour = next.getHours();
      
      let nextHour = hours.find(h => h > currentHour);
      if (!nextHour) {
        nextHour = hours[0];
        next.setDate(next.getDate() + 1);
      }
      
      next.setHours(nextHour, 0, 0, 0);
    } else if (cronExpression === '0 10 * * 0') {
      // Next Sunday at 10 AM
      const daysUntilSunday = (7 - next.getDay()) % 7;
      if (daysUntilSunday === 0 && next.getHours() >= 10) {
        // If it's Sunday and past 10 AM, next Sunday
        next.setDate(next.getDate() + 7);
      } else {
        next.setDate(next.getDate() + daysUntilSunday);
      }
      next.setHours(10, 0, 0, 0);
    }
    
    return next;
  }
}

export const scheduledDataCollection = new ScheduledDataCollection();