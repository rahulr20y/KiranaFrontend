import { addToast } from '../components/Toast';

/**
 * Mock Messaging Service for WhatsApp / SMS Order Confirmations (Phase IV)
 */
export const MessagingService = {
  sendOrderConfirmation: async (order) => {
    console.log(`[Phase IV] Sending WhatsApp Confirmation for Order #${order.order_number}`);
    
    // Simulating API Latency
    const success = true;
    
    if (success) {
      // Mock Data
      const message = `👋 Namaste! Your Kirana Order #${order.order_number} has been confirmed. Total: ₹${order.total_amount}. You can track it in your dashboard.`;
      
      console.log(`[MESSAGING] TO: ${order.shopkeeper_email || 'Shopkeeper'} | MSG: ${message}`);
      
      // In a real app, we'd use Twilio / Gupshup / WhatsApp Business API
      return { success: true, provider: 'WhatsApp Business API (Mock)' };
    }
  },
  
  sendRestockReminder: async (productName, shopkeeperName) => {
    console.log(`[Phase IV] Sending Restock Reminder to ${shopkeeperName} for ${productName}`);
    
    const message = `📢 Reminder: You are running low on ${productName}. Restock now with one click from your Kirana Dashboard!`;
    
    console.log(`[MESSAGING] MSG: ${message}`);
    return { success: true };
  }
};
