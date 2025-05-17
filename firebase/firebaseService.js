// Main Firebase service file that combines all Firebase-related functionality
import * as AuthService from '../firebase/auth';
import * as DatabaseService from '../firebase/db-service';
import { 
  app, 
  auth, 
  database, 
  realtimeDb
} from '../firebase/config';

// Re-export all services
export { 
  // Firebase instances
  app,
  auth,
  database,
  realtimeDb,
  
  // Auth services
  AuthService,
  
  // Database services
  DatabaseService
};

// Export base URL for direct API calls
export const BASE_URL = DatabaseService.BASE_URL;

// Re-export all auth methods
export const {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  subscribeToAuthChanges
} = AuthService;

// Re-export all database methods
export const {
  // Products
  getAllProducts,
  getProducts,
  subscribeToProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  
  // Categories
  getAllCategories,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  
  // Orders
  getAllOrders,
  getOrders,
  subscribeToOrders,
  addOrder,
  addOrderWithValidation,
  validateOrderData,
  updateOrder,
  getOrderById,
  getOrdersByUserId,
  updateOrderStatus,
  
  // Users
  addUser
} = DatabaseService; 