import { database } from '../config/firebaseConfig';
import { ref, get, child } from 'firebase/database';

/**
 * Fetch and display details for all orders or a specific order
 * 
 * @param {string} orderId - Optional order ID to fetch a specific order
 * @returns {Promise<Object>} - Promise that resolves with order data
 */
export const viewOrderDetails = async (orderId = null) => {
  try {
    const dbRef = ref(database);
    
    if (orderId) {
      // Fetch a specific order by ID
      console.log(`Fetching details for order: ${orderId}`);
      const snapshot = await get(child(dbRef, `orders/${orderId}`));
      
      if (snapshot.exists()) {
        const order = {
          id: snapshot.key,
          ...snapshot.val()
        };
        
        console.log('=== ORDER DETAILS ===');
        console.log(`Order ID: ${order.id}`);
        console.log(`Customer: ${order.customerName}`);
        console.log(`Phone: ${order.customerPhone || order.phoneNumber || order.phone || 'Not provided'}`);
        console.log(`Address: ${order.deliveryAddress || order.address || 'Not provided'}`);
        console.log(`Status: ${order.status || 'Pending'}`);
        console.log(`Created: ${new Date(order.createdAt).toLocaleString()}`);
        console.log(`Total Amount: Rs ${order.totalAmount || order.totalPrice || 0}`);
        
        console.log('\n=== ORDER ITEMS ===');
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item, index) => {
            console.log(`Item #${index + 1}: ${item.name}`);
            console.log(`  - Price: Rs ${item.price}`);
            console.log(`  - Quantity: ${item.quantity}`);
            console.log(`  - Subtotal: Rs ${item.price * item.quantity}`);
          });
        } else {
          console.log('No items found in this order');
        }
        
        return order;
      } else {
        console.log(`Order with ID ${orderId} not found`);
        return null;
      }
    } else {
      // Fetch all orders
      console.log('Fetching all orders');
      const snapshot = await get(child(dbRef, 'orders'));
      
      if (snapshot.exists()) {
        const orders = [];
        snapshot.forEach((childSnapshot) => {
          const order = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
          orders.push(order);
        });
        
        console.log(`=== FOUND ${orders.length} ORDERS ===`);
        orders.forEach((order, index) => {
          console.log(`\nOrder #${index + 1} - ID: ${order.id}`);
          console.log(`Customer: ${order.customerName}`);
          console.log(`Phone: ${order.customerPhone || order.phoneNumber || order.phone || 'Not provided'}`);
          console.log(`Status: ${order.status || 'Pending'}`);
          console.log(`Total Amount: Rs ${order.totalAmount || order.totalPrice || 0}`);
          console.log(`Items: ${order.items?.length || 0}`);
        });
        
        return orders;
      } else {
        console.log('No orders found in database');
        return [];
      }
    }
  } catch (error) {
    console.error('Error fetching order details:', error);
    return null;
  }
};

/**
 * Utility function to display order items with actual prices and quantities
 * 
 * @param {Array} items - Array of order items
 * @returns {void} 
 */
export const viewOrderItems = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    console.log('No items to display');
    return;
  }
  
  console.log('\n=== DETAILED ITEM BREAKDOWN ===');
  items.forEach((item, index) => {
    console.log(`\nItem #${index + 1}: ${item.name}`);
    console.log('Raw price value:', item.price, '(type:', typeof item.price, ')');
    console.log('Raw quantity value:', item.quantity, '(type:', typeof item.quantity, ')');
    
    // Calculate proper numeric values
    const price = typeof item.price === 'number' ? item.price : Number(item.price);
    const quantity = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity);
    
    console.log(`Price after conversion: Rs ${price} (${isNaN(price) ? 'NaN' : 'Valid number'})`);
    console.log(`Quantity after conversion: ${quantity} (${isNaN(quantity) ? 'NaN' : 'Valid number'})`);
    console.log(`Subtotal: Rs ${price * quantity}`);
  });
}; 