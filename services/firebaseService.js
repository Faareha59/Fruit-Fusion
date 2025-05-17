import * as AuthService from '../firebase/auth';
import * as DatabaseService from '../firebase/db-service';
import { 
  app, 
  auth, 
  database, 
  realtimeDb
} from '../firebase/config';

export { 
  app,
  auth,
  database,
  realtimeDb,

  AuthService,

  DatabaseService
};

export const BASE_URL = DatabaseService.BASE_URL;

export const {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  subscribeToAuthChanges
} = AuthService;

export const {
  getAllProducts,
  getProducts,
  subscribeToProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  
  getAllCategories,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  
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
  
  addUser
} = DatabaseService; 