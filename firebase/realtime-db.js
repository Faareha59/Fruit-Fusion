import { 
  ref, 
  set, 
  push, 
  get, 
  update, 
  remove, 
  onValue, 
  off, 
  query, 
  orderByChild, 
  equalTo 
} from "firebase/database";
import { database as realtimeDb } from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";

// Global flag to track whether we're in offline mode
let isOfflineMode = false;

// Function to check if Realtime DB is available
const isRealtimeDbAvailable = async (forceCheck = false) => {
  // If we've already determined we're in offline mode and not forcing a check, return false
  if (isOfflineMode && !forceCheck) {
    return false;
  }

  if (!realtimeDb) {
    console.warn("Realtime Database not available, using local storage");
    isOfflineMode = true;
    return false;
  }
  
  // If we're forcing a check, try to connect to Firebase
  if (forceCheck) {
    try {
      // Try a test read to see if we can connect
      const rootRef = ref(realtimeDb, '/');
      
      // Set a timeout for the test
      const testPromise = get(rootRef);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Connection timeout")), 5000)
      );
      
      // Race the test against the timeout
      await Promise.race([testPromise, timeoutPromise]);
      
      // If we get here, we're online again
      console.log("Firebase connection re-established");
      isOfflineMode = false;
      return true;
    } catch (error) {
      console.warn("Firebase still unavailable:", error.message);
      isOfflineMode = true;
      return false;
    }
  }
  
  // Not forcing a check, so just return true if we have a realtimeDb reference
  return true;
};

// Function to synchronize local changes with Firebase when connection is restored
export const synchronizeOfflineChanges = async () => {
  // First check if we can connect to Firebase now
  const isAvailable = await isRealtimeDbAvailable(true);
  
  if (!isAvailable) {
    console.log("Firebase still unavailable, cannot sync offline changes");
    return false;
  }
  
  console.log("Connection restored, synchronizing offline changes");
  
  // Here you would implement logic to sync any local changes made while offline
  // For example, pushing locally stored new products, updates, or deletions
  
  try {
    // Get locally stored products
    const storedProductsString = await AsyncStorage.getItem("fruitSalads");
    if (storedProductsString) {
      const storedProducts = JSON.parse(storedProductsString);
      
      // Get pending operations
      const pendingOpsString = await AsyncStorage.getItem("pendingOperations");
      if (pendingOpsString) {
        const pendingOps = JSON.parse(pendingOpsString);
        
        // Process each pending operation type
        if (pendingOps.deletions && pendingOps.deletions.length > 0) {
          console.log(`Processing ${pendingOps.deletions.length} pending deletions`);
          for (const id of pendingOps.deletions) {
            try {
              await executeWithTimeoutAndRetry(
                async () => {
                  const productRef = ref(realtimeDb, `products/${id}`);
                  await remove(productRef);
                  return true;
                },
                `sync delete product ${id}`,
                2, // fewer retries for batch operations
                5000
              );
              console.log(`Synced deletion for product ${id}`);
            } catch (error) {
              console.error(`Failed to sync deletion for product ${id}:`, error);
            }
          }
        }
        
        // Clear pending operations after processing
        await AsyncStorage.setItem("pendingOperations", JSON.stringify({
          deletions: [],
          updates: [],
          additions: []
        }));
        
        console.log("Cleared pending operations after sync");
      } else {
        console.log("No pending operations to sync");
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error synchronizing offline changes:", error);
    return false;
  }
};

// Add a new function to perform operations with timeout and retry
export const executeWithTimeoutAndRetry = async (operation, operationName, maxRetries = 3, timeoutMs = 5000) => {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting ${operationName} (attempt ${attempt}/${maxRetries})`);
      
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        return () => clearTimeout(id);
      });
      
      // Race the operation against the timeout
      const result = await Promise.race([
        operation(),
        timeoutPromise
      ]);
      
      console.log(`${operationName} completed successfully on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`Error during ${operationName} (attempt ${attempt}/${maxRetries}):`, error);
      
      // If we've reached max retries, throw the last error
      if (attempt === maxRetries) {
        console.error(`${operationName} failed after ${maxRetries} attempts`);
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      const delayMs = Math.min(1000 * Math.pow(1.5, attempt - 1), 5000);
      console.log(`Retrying ${operationName} in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError || new Error(`${operationName} failed with unknown error`);
};

// Product-related functions
export const addProductToRealtimeDb = async (productData) => {
  try {
    if (!isRealtimeDbAvailable()) {
      throw new Error("Realtime Database not available");
    }
    
    // Handle image data - ensure we're storing the URI as a string
    const productWithFormattedImage = {
      ...productData,
      // Ensure image is always a string
      image: typeof productData.image === 'string' 
        ? productData.image 
        : productData.image?.uri || null,
      // Normalize category to match user-side expected categories
      category: normalizeCategory(productData.category),
      // Ensure categoryColor is present
      categoryColor: productData.categoryColor || getCategoryColor(productData.category),
      // Set visibility flag to ensure users can see it
      isVisible: true,
      // Ensure description is properly formatted
      description: productData.description || "",
      // Ensure consistent data format for price
      price: typeof productData.price === 'number' ? productData.price : 
             parseFloat(String(productData.price).replace(/,/g, "")) || 0
    };
    
    console.log("Preparing to save product to Realtime DB:", {
      name: productWithFormattedImage.name,
      category: productWithFormattedImage.category,
      price: productWithFormattedImage.price,
      description: productWithFormattedImage.description,
      hasImage: !!productWithFormattedImage.image,
      isVisible: productWithFormattedImage.isVisible
    });
    
    // Generate a key for a new product in the products node
    const productsRef = ref(realtimeDb, 'products');
    const newProductRef = push(productsRef);
    const productId = newProductRef.key;
    
    if (!productId) {
      throw new Error("Failed to generate product ID");
    }
    
    console.log(`Generated product ID: ${productId}`);
    
    // Create the product object to save
    const productToSave = {
      ...productWithFormattedImage,
      id: productId,
      createdAt: new Date().toISOString()
    };
    
    // Save the product to the database
    await set(newProductRef, productToSave);
    console.log(`Product saved to path: products/${productId}`);
    
    // Verify product was saved by reading it back
    const savedProduct = await get(newProductRef);
    if (savedProduct.exists()) {
      console.log(`Product verification successful: ${productWithFormattedImage.name} (ID: ${productId})`);
      
      // Additional logging
      const verifiedData = savedProduct.val();
      console.log("Saved product details:", {
        name: verifiedData.name,
        category: verifiedData.category,
        price: verifiedData.price,
        description: verifiedData.description,
        hasImage: !!verifiedData.image,
        id: verifiedData.id
      });
    } else {
      console.error("Product save verification failed - data not found after saving!");
    }
    
    // Return the new ID for reference
    return productId;
  } catch (error) {
    console.error("Error adding product to Realtime DB:", error);
    throw error;
  }
};

export const getProductsFromRealtimeDb = async () => {
  try {
    if (!isRealtimeDbAvailable()) {
      throw new Error("Realtime Database not available");
    }
    
    const productsRef = ref(realtimeDb, 'products');
    const snapshot = await get(productsRef);
    
    if (snapshot.exists()) {
      const products = [];
      snapshot.forEach((childSnapshot) => {
        products.push({
          ...childSnapshot.val(),
          id: childSnapshot.key
        });
      });
      return products;
    }
    
    return [];
  } catch (error) {
    console.error("Error getting products from Realtime DB:", error);
    throw error;
  }
};

export const updateProductInRealtimeDb = async (productId, updatedData) => {
  try {
    if (!isRealtimeDbAvailable()) {
      throw new Error("Realtime Database not available");
    }
    
    console.log(`Updating product ${productId} in Realtime DB at ${new Date().toISOString()}`);
    console.log("Reference path:", `products/${productId}`);
    console.log("Updated data:", JSON.stringify(updatedData));
    
    // Get reference to the product in Realtime DB
    const productRef = ref(realtimeDb, `products/${productId}`);
    
    // First check if the product exists
    const snapshot = await get(productRef);
    if (!snapshot.exists()) {
      console.error(`Product ${productId} not found in Realtime DB`);
      throw new Error("Product not found");
    }
    
    // Get the current product data
    const currentData = snapshot.val();
    console.log("Current product data:", JSON.stringify(currentData));
    
    // Ensure image is properly handled
    const processedImage = typeof updatedData.image === 'string' 
      ? updatedData.image 
      : updatedData.image?.uri || currentData.image || null;
    
    // Ensure category is one of the standard categories
    const normalizedCategory = normalizeCategory(updatedData.category || currentData.category);
    
    // Ensure price is a number
    const price = typeof updatedData.price === 'number' 
      ? updatedData.price 
      : parseFloat(String(updatedData.price).replace(/,/g, "")) || currentData.price || 0;
    
    // Merge the current data with the updates
    const mergedData = {
      ...currentData,
      ...updatedData,
      // Ensure critical fields are properly formatted
      image: processedImage,
      category: normalizedCategory,
      price: price,
      isVisible: true, // Ensure products are visible by default
      updatedAt: new Date().toISOString()
    };
    
    // Log the merged data that will be saved
    console.log("Merged data to save:", JSON.stringify(mergedData));
    
    // Update the product in Realtime DB
    console.log("Initiating update operation...");
    await update(productRef, mergedData);
    console.log(`Product ${productId} updated successfully in Realtime DB at ${new Date().toISOString()}`);
    
    // Verify the update worked
    try {
      const verifySnapshot = await get(productRef);
      if (verifySnapshot.exists()) {
        const updatedProduct = verifySnapshot.val();
        console.log(`Verified update: Product ${productId} was updated successfully`);
        console.log("Updated product data:", JSON.stringify(updatedProduct));
      } else {
        console.error(`Product ${productId} not found after update!`);
      }
    } catch (verifyError) {
      console.error("Error verifying update:", verifyError);
    }
    
    // Update AsyncStorage to sync with Realtime DB
    try {
      // Get current products from AsyncStorage
      const storedProductsString = await AsyncStorage.getItem("fruitSalads");
      if (storedProductsString) {
        const storedProducts = JSON.parse(storedProductsString);
        
        // Find and update the product
        const updatedProducts = storedProducts.map(product => 
          product.id === productId ? { ...product, ...mergedData } : product
        );
        
        // Save back to AsyncStorage
        await AsyncStorage.setItem("fruitSalads", JSON.stringify(updatedProducts));
        console.log(`AsyncStorage products updated for product ${productId}`);
      }
    } catch (storageError) {
      console.error("Error updating AsyncStorage after product update:", storageError);
      // Continue with update even if AsyncStorage update fails
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating product ${productId} in Realtime DB:`, error);
    if (error.code) {
      console.error(`Firebase error code: ${error.code}, message: ${error.message}`);
      if (error.code === 'PERMISSION_DENIED') {
        console.error(`Firebase PERMISSION_DENIED error. Check database rules.`);
      }
    }
    throw error;
  }
};

export const deleteProductFromRealtimeDb = async (productId) => {
  try {
    // Check if we're in offline mode
    const isDbAvailable = await isRealtimeDbAvailable();
    
    if (!isDbAvailable) {
      console.log("Firebase unavailable, handling product deletion in offline mode");
      
      // Update local storage
      try {
        // Track pending operations for syncing later
        const pendingOpsString = await AsyncStorage.getItem("pendingOperations");
        const pendingOps = pendingOpsString ? JSON.parse(pendingOpsString) : { 
          deletions: [], 
          updates: [], 
          additions: [] 
        };
        
        // Add this deletion to pending operations
        if (!pendingOps.deletions.includes(productId)) {
          pendingOps.deletions.push(productId);
          await AsyncStorage.setItem("pendingOperations", JSON.stringify(pendingOps));
        }
        
        // Update local product list
        const storedProductsString = await AsyncStorage.getItem("fruitSalads");
        if (storedProductsString) {
          const storedProducts = JSON.parse(storedProductsString);
          const updatedProducts = storedProducts.filter(product => product.id !== productId);
          await AsyncStorage.setItem("fruitSalads", JSON.stringify(updatedProducts));
          console.log(`Product ${productId} removed from AsyncStorage in offline mode`);
        }
        
        // Update favorites if needed
        const favoritesString = await AsyncStorage.getItem("favorites");
        if (favoritesString) {
          const favorites = JSON.parse(favoritesString);
          const updatedFavorites = favorites.filter(favoriteId => favoriteId !== productId);
          if (favorites.length !== updatedFavorites.length) {
            await AsyncStorage.setItem("favorites", JSON.stringify(updatedFavorites));
          }
        }
        
        return { 
          success: true, 
          offline: true, 
          message: "Product deleted in offline mode. Changes will sync when connection is restored." 
        };
      } catch (storageError) {
        console.error("Error updating local storage in offline mode:", storageError);
        throw new Error("Failed to delete product in offline mode");
      }
    }
    
    // Online mode - proceed with Firebase deletion
    console.log(`Attempting to delete product: ${productId} from Realtime DB at ${new Date().toISOString()}`);
    
    // Use the executeWithTimeoutAndRetry function for better reliability
    await executeWithTimeoutAndRetry(
      async () => {
        const productRef = ref(realtimeDb, `products/${productId}`);
        
        // First verify the product exists
        const snapshot = await get(productRef);
        if (!snapshot.exists()) {
          console.warn(`Product ${productId} not found in database, proceeding with deletion anyway`);
        } else {
          console.log(`Found product to delete: ${snapshot.val().name || "Unknown"} (ID: ${productId})`);
        }
        
        // Perform the deletion
        await remove(productRef);
        console.log(`Product ${productId} successfully removed from Realtime DB`);
        
        return true;
      },
      `delete product ${productId}`,
      3,  // Max 3 retries
      8000 // 8 second timeout
    );
    
    // Update AsyncStorage to reflect the deletion
    try {
      const storedProductsString = await AsyncStorage.getItem("fruitSalads");
      if (storedProductsString) {
        const storedProducts = JSON.parse(storedProductsString);
        const updatedProducts = storedProducts.filter(product => product.id !== productId);
        await AsyncStorage.setItem("fruitSalads", JSON.stringify(updatedProducts));
        console.log(`Product ${productId} removed from AsyncStorage`);
      }
      
      // Also update favorites if needed
      const favoritesString = await AsyncStorage.getItem("favorites");
      if (favoritesString) {
        const favorites = JSON.parse(favoritesString);
        const updatedFavorites = favorites.filter(favoriteId => favoriteId !== productId);
        if (favorites.length !== updatedFavorites.length) {
          await AsyncStorage.setItem("favorites", JSON.stringify(updatedFavorites));
          console.log(`Product ${productId} removed from favorites`);
        }
      }
    } catch (storageError) {
      console.error("Error updating local storage after deletion:", storageError);
      // Continue even if local storage update fails
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting product ${productId} from Realtime DB:`, error);
    
    // Check if we should try to update local storage anyway
    if (error.message.includes("timeout") || error.code === 'PERMISSION_DENIED') {
      console.log("Firebase operation failed, updating local storage only");
      
      try {
        // Add to pending operations for later sync
        const pendingOpsString = await AsyncStorage.getItem("pendingOperations");
        const pendingOps = pendingOpsString ? JSON.parse(pendingOpsString) : { 
          deletions: [], 
          updates: [], 
          additions: [] 
        };
        
        // Add this deletion to pending operations if not already there
        if (!pendingOps.deletions.includes(productId)) {
          pendingOps.deletions.push(productId);
          await AsyncStorage.setItem("pendingOperations", JSON.stringify(pendingOps));
        }
        
        // Update local product list
        const storedProductsString = await AsyncStorage.getItem("fruitSalads");
        if (storedProductsString) {
          const storedProducts = JSON.parse(storedProductsString);
          const updatedProducts = storedProducts.filter(product => product.id !== productId);
          await AsyncStorage.setItem("fruitSalads", JSON.stringify(updatedProducts));
          console.log(`Product ${productId} removed from AsyncStorage only`);
          
          // Also update favorites
          const favoritesString = await AsyncStorage.getItem("favorites");
          if (favoritesString) {
            const favorites = JSON.parse(favoritesString);
            const updatedFavorites = favorites.filter(favoriteId => favoriteId !== productId);
            if (favorites.length !== updatedFavorites.length) {
              await AsyncStorage.setItem("favorites", JSON.stringify(updatedFavorites));
            }
          }
          
          // Return but indicate it's a partial success
          return { 
            success: true, 
            partial: true, 
            message: "Updated local storage only. Will sync when connection is restored." 
          };
        }
      } catch (storageError) {
        console.error("Error updating local storage:", storageError);
      }
    }
    
    throw error;
  }
};

export const subscribeToProductsInRealtimeDb = (callback, errorCallback) => {
  try {
    if (!isRealtimeDbAvailable()) {
      if (errorCallback) {
        errorCallback(new Error("Realtime Database not available"));
      }
      return () => {};
    }
    
    console.log("Setting up Realtime DB subscription for products...");
    
    // Create reference to the products node
    const productsRef = ref(realtimeDb, 'products');
    
    // Test the connection by attempting to read data
    get(productsRef).then(snapshot => {
      if (snapshot.exists()) {
        console.log("Database connection test successful - products node exists");
        const count = Object.keys(snapshot.val() || {}).length;
        console.log(`Found ${count} products in initial test read`);
      } else {
        console.log("Database connection test successful - products node is empty");
      }
    }).catch(error => {
      console.error("Database connection test failed:", error);
    });
    
    // Set up real-time value listener
    const handler = onValue(productsRef, async (snapshot) => {
      const products = [];
      
      if (snapshot.exists()) {
        console.log("Product snapshot exists in Realtime DB");
        
        // Count products for debugging
        let totalProducts = 0;
        snapshot.forEach(() => totalProducts++);
        console.log(`Raw product count in snapshot: ${totalProducts}`);
        
        snapshot.forEach((childSnapshot) => {
          try {
            const productData = childSnapshot.val();
            const productId = childSnapshot.key;
            
            // Print detailed info about each product for debugging
            console.log(`Processing product: ${productId} - ${productData?.name || 'Unnamed'}`);
            
            // Only include visible products
            if (productData && productData.isVisible !== false) {
              // Ensure consistent product format for both admin and user views
              const formattedProduct = {
                ...productData,
                id: productId || productData.id,
                // Normalize category to one of the fixed categories
                category: normalizeCategory(productData.category),
                // Ensure categoryColor exists
                categoryColor: productData.categoryColor || getCategoryColor(productData.category),
                // Ensure image is properly handled - this is critical
                image: typeof productData.image === 'string' 
                  ? productData.image
                  : (productData.image?.uri || null),
                // Ensure description is always present
                description: productData.description || "",
                // Ensure price is always a number
                price: typeof productData.price === 'number' ? productData.price : 
                       parseFloat(String(productData.price || "0").replace(/,/g, "")) || 0,
                // Explicitly mark as visible
                isVisible: true
              };
              
              products.push(formattedProduct);
            } else {
              console.log(`Skipping invisible product: ${productId} - ${productData?.name || 'Unnamed'}`);
            }
          } catch (productError) {
            console.error(`Error processing product ${childSnapshot.key}:`, productError);
            // Continue processing other products
          }
        });
        
        console.log(`Successfully processed ${products.length} products from Realtime DB`);
        
        // For debugging, list all product names
        const productNames = products.map(p => p.name).join(', ');
        console.log(`Product names: ${productNames}`);
        
        // Synchronize with AsyncStorage to ensure user and admin panels are in sync
        try {
          // Get current favorites
          const favoritesString = await AsyncStorage.getItem("favorites");
          const favorites = favoritesString ? JSON.parse(favoritesString) : [];
          
          // Update favorites for products that no longer exist
          const validFavorites = favorites.filter(favId => 
            products.some(product => product.id === favId)
          );
          
          // Save cleaned favorites back to AsyncStorage if they changed
          if (validFavorites.length !== favorites.length) {
            console.log(`Cleaning up favorites: from ${favorites.length} to ${validFavorites.length}`);
            await AsyncStorage.setItem("favorites", JSON.stringify(validFavorites));
          }
          
          // Update products in AsyncStorage to match Realtime DB
          console.log("Syncing products to AsyncStorage...");
          await AsyncStorage.setItem("fruitSalads", JSON.stringify(products));
          
          // Mark favorite status for UI
          const productsWithFavorites = products.map(product => ({
            ...product,
            isFavorite: validFavorites.includes(product.id)
          }));
          
          // Send the updated products with favorites to the callback
          callback(productsWithFavorites);
        } catch (storageError) {
          console.error("Error syncing with AsyncStorage:", storageError);
          // Still return the products even if AsyncStorage sync failed
          callback(products);
        }
      } else {
        console.log("No products found in Realtime DB snapshot");
        callback([]);
        
        // Clear AsyncStorage products since there are none in the database
        try {
          await AsyncStorage.setItem("fruitSalads", JSON.stringify([]));
        } catch (clearError) {
          console.error("Error clearing AsyncStorage products:", clearError);
        }
      }
    }, (error) => {
      console.error("Error subscribing to products in Realtime DB:", error);
      if (errorCallback) {
        errorCallback(error);
      }
    });
    
    // Return unsubscribe function
    return () => {
      console.log("Unsubscribing from Realtime DB products");
      off(productsRef, 'value', handler);
    };
  } catch (error) {
    console.error("Error setting up products subscription in Realtime DB:", error);
    if (errorCallback) {
      errorCallback(error);
    }
    return () => {};
  }
};

// Helper function to normalize category
const normalizeCategory = (category) => {
  if (!category) return "New";
  
  // Convert to string and lowercase for comparison
  const normalizedCategory = String(category).toLowerCase();
  
  if (normalizedCategory.includes("recommend")) return "Recommended";
  if (normalizedCategory.includes("popular")) return "Popular";
  if (normalizedCategory.includes("new")) return "New";
  
  // Default to one of the standard categories if not matching
  return "New";
};

// Helper function to get category color
const getCategoryColor = (category) => {
  const normalizedCategory = normalizeCategory(category);
  switch (normalizedCategory) {
    case "Recommended":
      return "#FF7E1E"; // Orange
    case "Popular":
      return "#4CAF50"; // Green
    case "New":
      return "#2196F3"; // Blue
    default:
      return "#FF7E1E"; // Default orange
  }
};

// Order-related functions
export const createOrderInRealtimeDb = async (orderData) => {
  try {
    if (!isRealtimeDbAvailable()) {
      throw new Error("Realtime Database not available");
    }
    
    console.log("Creating order in Realtime DB with data:", {
      customerName: orderData.customerName,
      items: orderData.items?.length || 0,
      totalAmount: orderData.totalAmount,
      address: orderData.address?.substring(0, 20) + "..."
    });
    
    // Format items to ensure they can be properly stored
    const formattedItems = orderData.items.map(item => ({
      ...item,
      // Ensure image is properly formatted if it exists
      image: typeof item.image === 'string' 
        ? item.image 
        : (item.image?.uri || null)
    }));
    
    const formattedOrder = {
      ...orderData,
      items: formattedItems,
      // Make sure these fields exist
      status: orderData.status || "Order Taken",
      createdAt: orderData.createdAt || new Date().toISOString()
    };
    
    const ordersRef = ref(realtimeDb, 'orders');
    const newOrderRef = push(ordersRef);
    const orderId = newOrderRef.key;
    
    // Add the ID to the order object itself
    formattedOrder.id = orderId;
    
    await set(newOrderRef, formattedOrder);
    console.log("Order successfully saved to Realtime DB with ID:", orderId);
    
    // Verify the order was saved
    const verifyRef = ref(realtimeDb, `orders/${orderId}`);
    const snapshot = await get(verifyRef);
    
    if (snapshot.exists()) {
      console.log("Order verification successful - data exists in Realtime DB");
    } else {
      console.error("Order verification failed - data not found after saving!");
    }
    
    return orderId;
  } catch (error) {
    console.error("Error creating order in Realtime DB:", error);
    throw error;
  }
};

export const getOrdersFromRealtimeDb = async (userId = null) => {
  try {
    if (!isRealtimeDbAvailable()) {
      throw new Error("Realtime Database not available");
    }
    
    console.log("Getting orders from Realtime DB", userId ? `for user: ${userId}` : "for admin view");
    
    const ordersRef = ref(realtimeDb, 'orders');
    let ordersQuery;
    
    if (userId && userId !== "guest") {
      // Get orders for a specific user
      ordersQuery = query(ordersRef, orderByChild('userId'), equalTo(userId));
    } else {
      // Get all orders
      ordersQuery = ordersRef;
    }
    
    const snapshot = await get(ordersQuery);
    
    if (snapshot.exists()) {
      const orders = [];
      snapshot.forEach((childSnapshot) => {
        const orderData = childSnapshot.val();
        // Ensure the order has a valid ID
        const orderId = childSnapshot.key || orderData.id;
        console.log(`Found order: ${orderId}, customer: ${orderData.customerName || 'Unknown'}`);
        
        // Format any missing data
        orders.push({
          ...orderData,
          id: orderId,
          customerName: orderData.customerName || "Guest",
          items: orderData.items || [],
          totalAmount: orderData.totalAmount || 0,
          status: orderData.status || "Order Taken",
          // Ensure dates are present
          createdAt: orderData.createdAt || new Date().toISOString()
        });
      });
      
      // Sort by creation date (newest first)
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log(`Found ${orders.length} orders in Realtime DB`);
      return orders;
    }
    
    console.log("No orders found in Realtime DB (getOrdersFromRealtimeDb)");
    return [];
  } catch (error) {
    console.error("Error getting orders from Realtime DB:", error);
    throw error;
  }
};

export const getOrderByIdFromRealtimeDb = async (orderId) => {
  try {
    if (!isRealtimeDbAvailable()) {
      throw new Error("Realtime Database not available");
    }
    
    const orderRef = ref(realtimeDb, `orders/${orderId}`);
    const snapshot = await get(orderRef);
    
    if (snapshot.exists()) {
      return {
        ...snapshot.val(),
        id: snapshot.key
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error getting order from Realtime DB:", error);
    throw error;
  }
};

export const updateOrderStatusInRealtimeDb = async (orderId, status) => {
  try {
    if (!isRealtimeDbAvailable()) {
      throw new Error("Realtime Database not available");
    }
    
    const orderRef = ref(realtimeDb, `orders/${orderId}`);
    await update(orderRef, {
      status,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating order status in Realtime DB:", error);
    throw error;
  }
};

export const subscribeToOrdersInRealtimeDb = (callback, userId = null, errorCallback) => {
  try {
    if (!isRealtimeDbAvailable()) {
      if (errorCallback) {
        errorCallback(new Error("Realtime Database not available"));
      }
      return () => {};
    }
    
    console.log("Setting up Realtime DB subscription for orders...", userId ? `Filtered by user: ${userId}` : "Loading all orders (admin view)");
    
    // Get reference to the orders node
    const ordersRef = ref(realtimeDb, 'orders');
    let ordersQuery;
    
    // For admin view, we want all orders
    if (!userId || userId === "admin") {
      console.log("Creating query for all orders (admin view)");
      ordersQuery = ordersRef;
    } else {
      // For users, filter by userId
      console.log(`Creating filtered query for user: ${userId}`);
      ordersQuery = query(ordersRef, orderByChild('userId'), equalTo(userId));
    }
    
    // Set up the listener
    const handler = onValue(ordersQuery, (snapshot) => {
      console.log("Order snapshot received from Realtime DB");
      
      const orders = [];
      if (snapshot.exists()) {
        console.log("Orders snapshot exists in Realtime DB");
        
        snapshot.forEach((childSnapshot) => {
          const orderData = childSnapshot.val();
          const orderId = childSnapshot.key;
          
          // Make sure the order has all required fields
          console.log(`Found order: ${orderId}, Customer: ${orderData.customerName || 'Unknown'}`);
          
          // Ensure items are properly formatted
          let items = [];
          if (orderData.items && Array.isArray(orderData.items)) {
            items = orderData.items.map(item => ({
              ...item,
              // Ensure image is always accessible
              image: typeof item.image === 'string' 
                ? item.image 
                : (item.image?.uri || null),
              // Ensure price is a number
              price: typeof item.price === 'number' 
                ? item.price 
                : parseFloat(String(item.price).replace(/,/g, "")) || 0,
              // Ensure quantity is a number
              quantity: typeof item.quantity === 'number'
                ? item.quantity
                : parseInt(item.quantity) || 1
            }));
          }
          
          // Calculate total if it doesn't exist
          let totalAmount = orderData.totalAmount;
          if (!totalAmount && items.length > 0) {
            totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          }
          
          orders.push({
            ...orderData,
            id: orderId,
            customerName: orderData.customerName || "Guest",
            email: orderData.email || "Not provided",
            phone: orderData.phone || orderData.phoneNumber || "Not provided",
            phoneNumber: orderData.phoneNumber || orderData.phone || "Not provided",
            address: orderData.address || "Not provided",
            items: items,
            totalAmount: totalAmount || 0,
            status: orderData.status || "Order Taken",
            paymentMethod: orderData.paymentMethod || "Not specified",
            // Ensure dates are present
            createdAt: orderData.createdAt || new Date().toISOString(),
            updatedAt: orderData.updatedAt || orderData.createdAt || new Date().toISOString()
          });
        });
        
        // Sort orders by creation date (newest first)
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        console.log(`Found ${orders.length} orders in Realtime DB`);
      } else {
        console.log("No orders found in Realtime DB (empty snapshot)");
      }
      
      // Return the orders to the callback
      callback(orders);
    }, (error) => {
      console.error("Error subscribing to orders in Realtime DB:", error);
      if (errorCallback) {
        errorCallback(error);
      }
    });
    
    // Return unsubscribe function
    return () => {
      console.log("Unsubscribing from Realtime DB orders");
      off(ordersRef, 'value', handler);
    };
  } catch (error) {
    console.error("Error setting up orders subscription in Realtime DB:", error);
    if (errorCallback) {
      errorCallback(error);
    }
    return () => {};
  }
};

// Function to seed initial data to Realtime DB
export const seedInitialDataToRealtimeDb = async () => {
  try {
    if (!isRealtimeDbAvailable()) {
      console.log("Realtime Database not available for seeding");
      throw new Error("Realtime Database not available");
    }
    
    console.log("Checking if products need to be seeded to Realtime DB...");
    
    // Check if products already exist
    const productsRef = ref(realtimeDb, 'products');
    const snapshot = await get(productsRef);
    
    if (snapshot.exists()) {
      let count = 0;
      snapshot.forEach(() => count++);
      console.log(`Products already exist in Realtime DB (${count} products), skipping seed`);
      return false;
    }
    
    console.log("No products found in Realtime DB, attempting to seed...");
    
    // Load sample products from AsyncStorage
    const storedProducts = await AsyncStorage.getItem("fruitSalads");
    if (!storedProducts) {
      console.log("No sample products found in AsyncStorage for seeding");
      return false;
    }
    
    const products = JSON.parse(storedProducts);
    console.log(`Found ${products.length} products in AsyncStorage for seeding`);
    
    // Add each product to Realtime DB
    for (const product of products) {
      try {
        const productRef = ref(realtimeDb, `products/${product.id}`);
        await set(productRef, {
          ...product,
          createdAt: product.createdAt || new Date().toISOString()
        });
        console.log(`Seeded product: ${product.name} to Realtime DB`);
      } catch (error) {
        console.error(`Error seeding product ${product.name || product.id}:`, error);
      }
    }
    
    console.log(`Successfully seeded ${products.length} products to Realtime DB`);
    return true;
  } catch (error) {
    console.error("Error seeding initial data to Realtime DB:", error);
    return false;
  }
};

// Delete all products from Realtime DB
export const deleteAllProductsFromRealtimeDb = async () => {
  try {
    if (!isRealtimeDbAvailable()) {
      throw new Error("Realtime Database not available");
    }
    
    console.log("Deleting all products from Realtime DB...");
    const productsRef = ref(realtimeDb, 'products');
    
    // First get all products to log what we're deleting
    const snapshot = await get(productsRef);
    
    if (snapshot.exists()) {
      const productsToDelete = [];
      snapshot.forEach((childSnapshot) => {
        productsToDelete.push({
          id: childSnapshot.key,
          name: childSnapshot.val().name
        });
      });
      
      console.log(`Found ${productsToDelete.length} products to delete`);
      
      // Now delete the entire products node
      await remove(productsRef);
      
      console.log("All products deleted successfully from Realtime DB");
      
      // Log the deleted products for reference
      productsToDelete.forEach(product => {
        console.log(`Deleted product: ${product.id} - ${product.name}`);
      });
      
      return productsToDelete.length;
    } else {
      console.log("No products found to delete in Realtime DB");
      return 0;
    }
  } catch (error) {
    console.error("Error deleting all products from Realtime DB:", error);
    throw error;
  }
};

// Function to clear all products when app starts - will be called on app initialization
export const clearAllInitialProducts = async () => {
  try {
    if (!isRealtimeDbAvailable()) {
      console.warn("Realtime Database not available, cannot clear products");
      return false;
    }
    
    console.log("Clearing all initial products from Realtime DB...");
    await deleteAllProductsFromRealtimeDb();
    
    // Also clear from AsyncStorage
    await AsyncStorage.removeItem("fruitSalads");
    await AsyncStorage.removeItem("favorites");
    
    console.log("All initial products have been removed. Admin needs to add new products.");
    return true;
  } catch (error) {
    console.error("Error clearing initial products:", error);
    return false;
  }
};

// Add a function to create a temporary database connection for fallback
export const getTemporaryDatabaseConnection = async () => {
  try {
    console.log("Attempting to create temporary database connection");
    
    const { initializeApp } = require("firebase/app");
    const { getDatabase } = require("firebase/database");
    
    // Get firebaseConfig from config.js
    const { app } = require("./config");
    const firebaseConfig = app.options;
    
    // Create a temporary app with a unique name
    const tempAppName = `temp-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    
    // Get database from temporary app
    const tempDb = getDatabase(tempApp);
    
    console.log(`Temporary database connection created with name: ${tempAppName}`);
    return { tempDb, tempApp };
  } catch (error) {
    console.error("Failed to create temporary database connection:", error);
    return { tempDb: null, tempApp: null };
  }
}; 