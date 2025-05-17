import { ref, set, get, remove, update, child, push, onValue } from "firebase/database";
import { database } from '../config/firebaseConfig';

export const BASE_URL = "https://fruit-acf8e-default-rtdb.firebaseio.com";

export const getAllProducts = async () => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    
    if (snapshot.exists()) {
      const products = [];
      snapshot.forEach((childSnapshot) => {
        products.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return { success: true, data: products };
    } else {
      return { success: true, data: [] };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const subscribeToProducts = (callback) => {
  const productsRef = ref(database, 'products');
  return onValue(productsRef, (snapshot) => {
    const products = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        products.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }
    callback(products);
  });
};

export const addProduct = async (productData) => {
  try {
    const productsRef = ref(database, 'products');
    const newProductRef = push(productsRef);
    await set(newProductRef, productData);
    return { 
      success: true, 
      id: newProductRef.key, 
      data: { id: newProductRef.key, ...productData } 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    const productRef = ref(database, `products/${productId}`);
    await update(productRef, productData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteProduct = async (productId) => {
  try {
    const productRef = ref(database, `products/${productId}`);
    await remove(productRef);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getProductById = async (productId) => {
  try {
    const productRef = ref(database, `products/${productId}`);
    const snapshot = await get(productRef);
    
    if (snapshot.exists()) {
      return { 
        success: true, 
        data: { id: productId, ...snapshot.val() } 
      };
    } else {
      return { success: false, error: 'Product not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllCategories = async () => {
  try {
    const categoriesRef = ref(database, 'categories');
    const snapshot = await get(categoriesRef);
    
    if (snapshot.exists()) {
      const categories = [];
      snapshot.forEach((childSnapshot) => {
        categories.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return { success: true, data: categories };
    } else {
      return { success: true, data: [] };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addCategory = async (categoryData) => {
  try {
    const categoriesRef = ref(database, 'categories');
    const newCategoryRef = push(categoriesRef);
    await set(newCategoryRef, categoryData);
    return { 
      success: true, 
      id: newCategoryRef.key, 
      data: { id: newCategoryRef.key, ...categoryData } 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateCategory = async (categoryId, categoryData) => {
  try {
    const categoryRef = ref(database, `categories/${categoryId}`);
    await update(categoryRef, categoryData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    const categoryRef = ref(database, `categories/${categoryId}`);
    await remove(categoryRef);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllOrders = async () => {
  try {
    const ordersRef = ref(database, 'orders');
    const snapshot = await get(ordersRef);
    
    if (snapshot.exists()) {
      const orders = [];
      snapshot.forEach((childSnapshot) => {
        orders.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return { success: true, data: orders };
    } else {
      return { success: true, data: [] };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const subscribeToOrders = (callback) => {
  const ordersRef = ref(database, 'orders');
  return onValue(ordersRef, (snapshot) => {
    const orders = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        orders.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }
    callback(orders);
  });
};

export const addOrder = async (orderData) => {
  try {
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);
    await set(newOrderRef, orderData);
    return { 
      success: true, 
      id: newOrderRef.key, 
      data: { id: newOrderRef.key, ...orderData } 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const validateOrderData = (orderData) => {
  const validatedOrder = { ...orderData };

  if (validatedOrder.items && Array.isArray(validatedOrder.items)) {
    validatedOrder.items = validatedOrder.items.map(item => {
      let price = Number(item.price);
      if (isNaN(price)) price = 0;
 
      let quantity = Number(item.quantity);
      if (isNaN(quantity)) quantity = 0;

      return {
        ...item,
        price: price,
        quantity: quantity
      };
    });
  }
 
  const calculatedTotal = (validatedOrder.items || []).reduce(
    (sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0
  );

  let totalAmount = Number(validatedOrder.totalAmount);
  if (isNaN(totalAmount) || totalAmount <= 0) {
    let alternateTotal = Number(validatedOrder.totalPrice);
    if (isNaN(alternateTotal) || alternateTotal <= 0) {
      totalAmount = calculatedTotal;
    } else {
      totalAmount = alternateTotal;
    }
  }

  validatedOrder.totalAmount = totalAmount;
  
  return validatedOrder;
};

export const addOrderWithValidation = async (orderData) => {
  try {
    const validatedOrder = validateOrderData(orderData);
    
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);
    await set(newOrderRef, validatedOrder);
    return { 
      success: true, 
      id: newOrderRef.key, 
      data: { id: newOrderRef.key, ...validatedOrder } 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateOrder = async (orderId, orderData) => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    await update(orderRef, orderData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getOrderById = async (orderId) => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    const snapshot = await get(orderRef);
    
    if (snapshot.exists()) {
      return { 
        success: true, 
        data: { id: orderId, ...snapshot.val() } 
      };
    } else {
      return { success: false, error: 'Order not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getOrdersByUserId = async (userId) => {
  try {
    const ordersRef = ref(database, 'orders');
    const snapshot = await get(ordersRef);
    
    if (snapshot.exists()) {
      const userOrders = [];
      snapshot.forEach((childSnapshot) => {
        const order = childSnapshot.val();
        if (order.userId === userId) {
          userOrders.push({
            id: childSnapshot.key,
            ...order
          });
        }
      });
      return { success: true, data: userOrders };
    } else {
      return { success: true, data: [] };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    await update(orderRef, { status });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addUser = async (userData) => {
  try {
    const usersRef = ref(database, 'users');
    const newUserRef = push(usersRef);
    await set(newUserRef, userData);
    return { 
      success: true, 
      id: newUserRef.key, 
      data: { id: newUserRef.key, ...userData } 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getProducts = getAllProducts;

export const getCategories = getAllCategories;

export const getOrders = getAllOrders; 