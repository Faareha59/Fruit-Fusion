/**
 * Utility functions for working with order data in the app
 */

/**
 * Get the properly formatted phone number from order data
 * 
 * @param {Object} orderData - The order data object
 * @returns {string} - The formatted phone number or "Not provided"
 */
export const getOrderPhoneNumber = (orderData) => {
  if (!orderData) return "Not provided";
  
  // Check all possible phone number field names
  return orderData.customerPhone || 
         orderData.phoneNumber || 
         orderData.phone || 
         "Not provided";
};

/**
 * Get the properly formatted price from an item
 * 
 * @param {Object} item - The item object with price data
 * @returns {number} - The validated price value
 */
export const getItemPrice = (item) => {
  if (!item) return 0;
  
  // If price is already a number, use it
  if (typeof item.price === 'number') {
    return item.price;
  }
  
  // Otherwise try to convert to a number
  const price = Number(item.price);
  return isNaN(price) ? 0 : price;
};

/**
 * Get the properly formatted quantity from an item
 * 
 * @param {Object} item - The item object with quantity data
 * @returns {number} - The validated quantity value
 */
export const getItemQuantity = (item) => {
  if (!item) return 0;
  
  // If quantity is already a number, use it
  if (typeof item.quantity === 'number') {
    return item.quantity;
  }
  
  // Otherwise try to convert to a number
  const quantity = Number(item.quantity);
  return isNaN(quantity) ? 0 : quantity;
};

/**
 * Calculate the subtotal for an item based on price and quantity
 * 
 * @param {Object} item - The item object
 * @returns {number} - The calculated subtotal
 */
export const getItemSubtotal = (item) => {
  if (!item) return 0;
  
  const price = getItemPrice(item);
  const quantity = getItemQuantity(item);
  
  return price * quantity;
};

/**
 * Calculate the total amount for an order based on its items
 * 
 * @param {Object} orderData - The order data object
 * @returns {number} - The calculated total
 */
export const calculateOrderTotal = (orderData) => {
  if (!orderData || !orderData.items || !Array.isArray(orderData.items)) {
    return 0;
  }
  
  // Calculate sum of all item subtotals
  return orderData.items.reduce((total, item) => {
    return total + getItemSubtotal(item);
  }, 0);
};

/**
 * Format price for display
 * 
 * @param {number} price - The price to format
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price) => {
  return `Rs ${price.toLocaleString()}`;
};

/**
 * Get order details in a structured format for display
 * 
 * @param {Object} orderData - The order data object
 * @returns {Object} - Structured order details
 */
export const getOrderDetails = (orderData) => {
  if (!orderData) return null;
  
  // Format order items with proper price and quantity values
  const formattedItems = Array.isArray(orderData.items) 
    ? orderData.items.map(item => ({
        ...item,
        price: getItemPrice(item),
        quantity: getItemQuantity(item),
        subtotal: getItemSubtotal(item)
      }))
    : [];
  
  // Calculate totals
  const subtotal = formattedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryFee = orderData.deliveryFee || 0;
  const discount = orderData.discount || 0;
  const total = orderData.totalAmount || orderData.totalPrice || subtotal + deliveryFee - discount;
  
  // Return formatted order details
  return {
    id: orderData.id,
    customerName: orderData.customerName || "Guest",
    phoneNumber: getOrderPhoneNumber(orderData),
    address: orderData.deliveryAddress || orderData.address || "Not provided",
    items: formattedItems,
    subtotal,
    deliveryFee,
    discount,
    total,
    status: orderData.status || "Pending",
    createdAt: orderData.createdAt,
    paymentMethod: orderData.paymentMethod || "Cash on Delivery"
  };
}; 