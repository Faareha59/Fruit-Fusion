import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../config/firebaseConfig';

export const subscribeToOrdersInRealtimeDb = (callback, userId = null, errorCallback = null) => {
  try {
    let ordersRef;
    
    if (userId) {
      console.log(`Subscribing to orders for user: ${userId}`);
      ordersRef = query(ref(database, 'orders'), orderByChild('userId'), equalTo(userId));
    } else {
      console.log('Subscribing to all orders (admin view)');
      ordersRef = ref(database, 'orders');
    }

    return onValue(
      ordersRef,
      (snapshot) => {
        const orders = [];
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const order = {
              id: childSnapshot.key,
              ...childSnapshot.val()
            };
     
            if (!userId || order.userId === userId) {
              orders.push(order);
            }
          });
        }
        
        console.log(`Received ${orders.length} orders from Realtime DB`);
        callback(orders);
      },
      (error) => {
        console.error('Error subscribing to orders:', error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );
  } catch (error) {
    console.error('Error setting up orders subscription:', error);
    if (errorCallback) {
      errorCallback(error);
    }
    return () => {}; 
  }
};

export const subscribeToOrderById = (orderId, callback, errorCallback = null) => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    
    return onValue(
      orderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const order = {
            id: snapshot.key,
            ...snapshot.val()
          };
          callback(order);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error(`Error subscribing to order ${orderId}:`, error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );
  } catch (error) {
    console.error(`Error setting up subscription for order ${orderId}:`, error);
    if (errorCallback) {
      errorCallback(error);
    }
    return () => {}; 
  }
}; 