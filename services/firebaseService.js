// firebaseService.js - Firebase operations for Food Fusion app
import { database } from '../firebase/config';
import { ref, get, set, push, update, remove } from 'firebase/database';
import axios from 'axios';

// Firebase database URL
const BASE_URL = 'https://fruit-acf8e-default-rtdb.firebaseio.com/';

// Get all products from Firebase
export const getProducts = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/products.json`);
    
    if (!response.data) return [];
    
    const products = [];
    for (let key in response.data) {
      products.push({
        id: key,
        ...response.data[key]
      });
    }
    
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// Add a new product to Firebase
export const addProduct = async (product) => {
  try {
    const response = await axios.post(`${BASE_URL}/products.json`, product);
    return { success: true, id: response.data.name };
  } catch (error) {
    console.error('Error adding product:', error);
    return { success: false, error: error.message };
  }
};

// Update a product in Firebase
export const updateProduct = async (productId, productData) => {
  try {
    await axios.put(`${BASE_URL}/products/${productId}.json`, productData);
    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: error.message };
  }
};

// Delete a product from Firebase
export const deleteProduct = async (productId) => {
  try {
    await axios.delete(`${BASE_URL}/products/${productId}.json`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: error.message };
  }
};

// Get all orders from Firebase
export const getOrders = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/orders.json`);
    
    if (!response.data) return [];
    
    const orders = [];
    for (let key in response.data) {
      orders.push({
        id: key,
        ...response.data[key]
      });
    }
    
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

// Add a new order to Firebase
export const addOrder = async (order) => {
  try {
    const response = await axios.post(`${BASE_URL}/orders.json`, order);
    return { success: true, id: response.data.name };
  } catch (error) {
    console.error('Error adding order:', error);
    return { success: false, error: error.message };
  }
};

// Update an order in Firebase
export const updateOrder = async (orderId, orderData) => {
  try {
    await axios.put(`${BASE_URL}/orders/${orderId}.json`, orderData);
    return { success: true };
  } catch (error) {
    console.error('Error updating order:', error);
    return { success: false, error: error.message };
  }
};

// Get all categories from Firebase
export const getCategories = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/categories.json`);
    
    if (!response.data) return [];
    
    const categories = [];
    for (let key in response.data) {
      if (typeof response.data[key] === 'string') {
        categories.push(response.data[key]);
      } else {
        categories.push({
          id: key,
          ...response.data[key]
        });
      }
    }
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Add a new category to Firebase
export const addCategory = async (category) => {
  try {
    // Handle both string and object formats
    const categoryData = typeof category === 'string' ? { name: category } : category;
    const response = await axios.post(`${BASE_URL}/categories.json`, categoryData);
    return { success: true, id: response.data.name };
  } catch (error) {
    console.error('Error adding category:', error);
    return { success: false, error: error.message };
  }
};

// Delete a category from Firebase
export const deleteCategory = async (categoryId) => {
  try {
    await axios.delete(`${BASE_URL}/categories/${categoryId}.json`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: error.message };
  }
};

// Get all users from Firebase
export const getUsers = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/users.json`);
    
    if (!response.data) return [];
    
    const users = [];
    for (let key in response.data) {
      users.push({
        id: key,
        ...response.data[key]
      });
    }
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Add a new user to Firebase
export const addUser = async (user) => {
  try {
    const response = await axios.post(`${BASE_URL}/users.json`, user);
    return { success: true, id: response.data.name };
  } catch (error) {
    console.error('Error adding user:', error);
    return { success: false, error: error.message };
  }
};

// Update a user in Firebase
export const updateUser = async (userId, userData) => {
  try {
    await axios.put(`${BASE_URL}/users/${userId}.json`, userData);
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
};

// Get user by ID from Firebase
export const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/users/${userId}.json`);
    if (!response.data) return null;
    return { id: userId, ...response.data };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};
