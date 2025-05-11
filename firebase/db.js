import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc
} from "firebase/firestore";
import app from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const db = getFirestore(app);

// Category-related functions
export const addCategory = async (categoryData) => {
  try {
    const docRef = await addDoc(collection(db, "categories"), {
      ...categoryData,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding category:", error);
    throw new Error(error.message);
  }
};

export const getCategories = async () => {
  try {
    const categoriesSnapshot = await getDocs(collection(db, "categories"));
    const categories = [];
    categoriesSnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    return categories;
  } catch (error) {
    console.error("Error getting categories:", error);
    throw new Error(error.message);
  }
};

export const subscribeToCategories = (callback) => {
  return onSnapshot(collection(db, "categories"), (snapshot) => {
    const categories = [];
    snapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    callback(categories);
  });
};

export const deleteCategory = async (categoryId) => {
  try {
    await deleteDoc(doc(db, "categories", categoryId));
    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error(error.message);
  }
};

// User-related functions
export const createUserProfile = async (userId, userData) => {
  try {
    await setDoc(doc(db, "users", userId), {
      ...userData,
      createdAt: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw new Error(error.message);
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw new Error(error.message);
  }
};

// Fruit salad related functions
export const getFruitSalads = async () => {
  try {
    const saladsSnapshot = await getDocs(collection(db, "fruitSalads"));
    const salads = [];
    saladsSnapshot.forEach((doc) => {
      salads.push({ id: doc.id, ...doc.data() });
    });
    return salads;
  } catch (error) {
    console.error("Error getting fruit salads:", error);
    throw new Error(error.message);
  }
};

// Product-related functions
export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, "products"), {
      ...productData,
      createdAt: new Date()
    });
    
    // Also store in AsyncStorage as backup
    try {
      const storedProducts = await AsyncStorage.getItem("fruitSalads");
      let products = storedProducts ? JSON.parse(storedProducts) : [];
      
      // Add the new product with Firebase ID
      const newProduct = { ...productData, id: docRef.id };
      products.push(newProduct);
      
      // Save back to storage
      await AsyncStorage.setItem("fruitSalads", JSON.stringify(products));
    } catch (storageError) {
      console.error("Failed to save product to AsyncStorage:", storageError);
      // Continue since we already saved to Firebase
    }
    
    return docRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw new Error(error.message);
  }
};

export const deleteProduct = async (productId) => {
  try {
    // Delete from Firebase
    await deleteDoc(doc(db, "products", productId));
    
    // Also delete from AsyncStorage
    try {
      const storedProducts = await AsyncStorage.getItem("fruitSalads");
      if (storedProducts) {
        const products = JSON.parse(storedProducts);
        const updatedProducts = products.filter(product => product.id !== productId);
        await AsyncStorage.setItem("fruitSalads", JSON.stringify(updatedProducts));
      }
    } catch (storageError) {
      console.error("Failed to delete product from AsyncStorage:", storageError);
      // Continue since we already deleted from Firebase
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error(error.message);
  }
};

export const getProducts = async () => {
  try {
    const productsSnapshot = await getDocs(collection(db, "products"));
    const products = [];
    productsSnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return products;
  } catch (error) {
    console.error("Error getting products:", error);
    throw new Error(error.message);
  }
};

export const subscribeToProducts = (callback, errorCallback) => {
  try {
    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
    );
    
    return onSnapshot(q, (snapshot) => {
      const products = [];
      snapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
      callback(products);
    }, error => {
      console.error("Firebase product subscription error:", error);
      if (errorCallback) {
        errorCallback(error);
      }
    });
  } catch (error) {
    console.error("Failed to create product subscription:", error);
    if (errorCallback) {
      errorCallback(error);
    }
    // Return a no-op unsubscribe function
    return () => {};
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    // Update in Firebase
    await updateDoc(doc(db, "products", productId), {
      ...productData,
      updatedAt: new Date()
    });
    
    // Also update in AsyncStorage as backup
    try {
      const storedProducts = await AsyncStorage.getItem("fruitSalads");
      if (storedProducts) {
        let products = JSON.parse(storedProducts);
        products = products.map(product => 
          product.id === productId ? { ...productData, id: productId } : product
        );
        await AsyncStorage.setItem("fruitSalads", JSON.stringify(products));
      }
    } catch (storageError) {
      console.error("Failed to update product in AsyncStorage:", storageError);
      // Continue since we already updated in Firebase
    }
    
    return true;
  } catch (error) {
    console.error("Error updating product:", error);
    throw new Error(error.message);
  }
};

// Order-related functions
export const createOrder = async (orderData) => {
  try {
    const ordersRef = collection(db, "orders");
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      createdAt: new Date(),
      status: "Order Taken"
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error(error.message);
  }
};

export const getOrders = async (userId) => {
  try {
    const q = query(
      collection(db, "orders"), 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const ordersSnapshot = await getDocs(q);
    const orders = [];
    ordersSnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    return orders;
  } catch (error) {
    console.error("Error getting orders:", error);
    throw new Error(error.message);
  }
};

export const subscribeToOrders = (userId, callback) => {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const orders = [];
    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    callback(orders);
  });
};

export const subscribeToAllOrders = (callback, errorCallback) => {
  try {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );
    
    return onSnapshot(q, (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      callback(orders);
    }, error => {
      console.error("Firebase subscription error:", error);
      if (errorCallback) {
        errorCallback(error);
      }
    });
  } catch (error) {
    console.error("Failed to create Firebase subscription:", error);
    if (errorCallback) {
      errorCallback(error);
    }
    // Return a no-op unsubscribe function
    return () => {};
  }
};

export const getOrderById = async (orderId) => {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    if (orderDoc.exists()) {
      return { id: orderDoc.id, ...orderDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting order:", error);
    throw new Error(error.message);
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error(error.message);
  }
};

export default db;
