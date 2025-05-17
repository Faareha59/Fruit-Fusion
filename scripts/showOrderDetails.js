import { viewOrderDetails, viewOrderItems } from '../utils/viewOrderDetails';

async function showOrderDetails() {
  try {
    const args = process.argv.slice(2);
    const orderId = args[0];
    
    if (orderId) {
      console.log(`\nFetching details for order ID: ${orderId}`);
      const order = await viewOrderDetails(orderId);
      
      if (order && order.items) {
        viewOrderItems(order.items);
      }
    } else {
      console.log('\nFetching list of all orders...');
      const orders = await viewOrderDetails();
      
      if (orders && orders.length > 0) {
        console.log('\nTo view details of a specific order, run this script with the order ID:');
        console.log('Example: node scripts/showOrderDetails.js ORDER_ID_HERE');
      }
    }
  } catch (error) {
    console.error('Error showing order details:', error);
  }
}
showOrderDetails(); 