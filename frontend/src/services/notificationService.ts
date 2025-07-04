import { Notification, mockNotifications } from '../mock-data/strapiBlocks';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class NotificationService {
  private notifications: Notification[] = [...mockNotifications];

  async getNotifications(userId: string): Promise<Notification[]> {
    await delay(400);
    return this.notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    await delay(200);
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    await delay(300);
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    return true;
  }

  async getUnreadCount(userId: string): Promise<number> {
    await delay(100);
    return this.notifications.filter(n => !n.read).length;
  }

  async addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): Promise<Notification> {
    await delay(200);
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    
    this.notifications.unshift(newNotification);
    return newNotification;
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    await delay(200);
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      return true;
    }
    return false;
  }

  // Simulate real-time notifications
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void): () => void {
    const interval = setInterval(async () => {
      // Randomly generate new notifications (10% chance every 30 seconds)
      if (Math.random() < 0.1) {
        const types: Notification['type'][] = ['like', 'comment', 'follow'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        const newNotification = await this.addNotification({
          type: randomType,
          title: 'New Activity',
          message: `You have a new ${randomType}!`,
          read: false
        });
        
        callback(newNotification);
      }
    }, 30000);

    return () => clearInterval(interval);
  }

  // Development helper
  resetNotifications(): void {
    this.notifications = [...mockNotifications];
  }
}

export const notificationService = new NotificationService();