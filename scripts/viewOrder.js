const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, child } = require('firebase/database');
const { firebaseConfig } = require('../config/firebaseConfig');

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function main() {
  const args = process.argv.slice(2);
  let orderId = null;
  let userId = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-u' || args[i] === '--user') {
      if (i + 1 < args.length) {
        userId = args[i + 1];
        i++; 
      }
    } else {
      orderId = args[i];
    }
  }
  
  try {
    const dbRef = ref(database);
    
    if (orderId) {
      console.log(`\nFetching order: ${orderId}`);
      
      const snapshot = await get(child(dbRef, `orders/${orderId}`));
      if (snapshot.exists()) {
        const order = {
          id: snapshot.key,
          ...snapshot.val()
        };
        
        displayOrderDetails(order);
      } else {
        console.log(`Order not found: ${orderId}`);
      }
    } else if (userId) {
      console.log(`\nFetching orders for user: ${userId}`);
      
      const snapshot = await get(child(dbRef, 'orders'));
      if (snapshot.exists()) {
        const orders = [];
        snapshot.forEach((childSnapshot) => {
          const order = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
          
          if (order.userId === userId) {
            orders.push(order);
          }
        });
        
        console.log(`Found ${orders.length} orders for user ${userId}`);
        
        if (orders.length > 0) {
          orders.forEach((order, index) => {
            console.log(`\n--- Order #${index + 1} ---`);
            displayOrderSummary(order);
          });
          
          console.log('\nUse "node viewOrder.js ORDER_ID" to see details for a specific order');
        }
      } else {
        console.log('No orders found in the database');
      }
    } else {
      console.log('\nFetching all orders');
      
      const snapshot = await get(child(dbRef, 'orders'));
      if (snapshot.exists()) {
        const orders = [];
        snapshot.forEach((childSnapshot) => {
          orders.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        
        console.log(`Found ${orders.length} orders`);
        
        if (orders.length > 0) {
          orders.forEach((order, index) => {
            console.log(`\n--- Order #${index + 1} ---`);
            displayOrderSummary(order);
          });
          
          console.log('\nUse "node viewOrder.js ORDER_ID" to see details for a specific order');
        }
      } else {
        console.log('No orders found in the database');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

function displayOrderDetails(order) {
  console.log('\n===========================================');
  console.log(`             ORDER DETAILS                `);
  console.log('===========================================');
  console.log(`ID:        ${order.id}`);
  console.log(`Customer:  ${order.customerName || 'N/A'}`);
  console.log(`Phone:     ${order.customerPhone || order.phoneNumber || order.phone || 'N/A'}`);
  console.log(`Address:   ${order.deliveryAddress || order.address || 'N/A'}`);
  console.log(`Status:    ${order.status || 'Pending'}`);
  console.log(`Date:      ${new Date(order.createdAt).toLocaleString()}`);
  console.log(`Payment:   ${order.paymentMethod || 'N/A'}`);
  console.log('-------------------------------------------');
  
  if (order.items && Array.isArray(order.items) && order.items.length > 0) {
    console.log('\nITEMS:');
    console.log('-------------------------------------------');
    console.log('  Name                 Price    Qty   Total');
    console.log('-------------------------------------------');
    
    let totalAmount = 0;
    order.items.forEach(item => {
      const rawPrice = item.price;
      const rawQty = item.quantity;
    
      const price = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice);
      const quantity = typeof rawQty === 'number' ? rawQty : Number(rawQty);

      const subtotal = price * quantity;
      totalAmount += subtotal;
 
      const name = (item.name || 'Unknown').slice(0, 18).padEnd(18);
      console.log(`  ${name} ${price.toString().padStart(8)} × ${quantity.toString().padStart(2)}   ${subtotal.toString().padStart(6)}`);
    });
    
    console.log('-------------------------------------------');
    console.log(`Subtotal:                          ${totalAmount.toString().padStart(6)}`);
    
    if (order.deliveryFee) {
      console.log(`Delivery Fee:                      ${order.deliveryFee.toString().padStart(6)}`);
      totalAmount += order.deliveryFee;
    }
    
    console.log(`TOTAL:                             ${(order.totalAmount || order.totalPrice || totalAmount).toString().padStart(6)}`);
    console.log('===========================================\n');
 
    console.log('\nDATA TYPE ANALYSIS:');
    console.log('-------------------------------------------');
    order.items.forEach((item, index) => {
      console.log(`\nItem #${index + 1}: ${item.name || 'Unknown'}`);
      console.log(`  Price: ${item.price} (Type: ${typeof item.price})`);
      console.log(`  Quantity: ${item.quantity} (Type: ${typeof item.quantity})`);
    });
  } else {
    console.log('\nNo items found in this order');
  }
  
  console.log('\n===========================================\n');
}

function displayOrderSummary(order) {
  console.log(`Order ID:    ${order.id}`);
  console.log(`Customer:    ${order.customerName || 'N/A'}`);
  console.log(`Phone:       ${order.customerPhone || order.phoneNumber || order.phone || 'N/A'}`);
  console.log(`Status:      ${order.status || 'Pending'}`);
  console.log(`Date:        ${new Date(order.createdAt).toLocaleString()}`);
  console.log(`Total:       ${order.totalAmount || order.totalPrice || 'N/A'}`);
  console.log(`Items:       ${order.items?.length || 0}`);
}

main(); 