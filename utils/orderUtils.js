
export const getOrderPhoneNumber = (orderData) => {
  if (!orderData) return "Not provided";
  
  return orderData.customerPhone || 
         orderData.phoneNumber || 
         orderData.phone || 
         "Not provided";
};

export const getItemPrice = (item) => {
  if (!item) return 0;
  
  if (typeof item.price === 'number') {
    return item.price;
  }
  
  const price = Number(item.price);
  return isNaN(price) ? 0 : price;
};

export const getItemQuantity = (item) => {
  if (!item) return 0;

  if (typeof item.quantity === 'number') {
    return item.quantity;
  }

  const quantity = Number(item.quantity);
  return isNaN(quantity) ? 0 : quantity;
};

export const getItemSubtotal = (item) => {
  if (!item) return 0;
  
  const price = getItemPrice(item);
  const quantity = getItemQuantity(item);
  
  return price * quantity;
};

export const calculateOrderTotal = (orderData) => {
  if (!orderData || !orderData.items || !Array.isArray(orderData.items)) {
    return 0;
  }
  
  return orderData.items.reduce((total, item) => {
    return total + getItemSubtotal(item);
  }, 0);
};


export const formatPrice = (price) => {
  return `Rs ${price.toLocaleString()}`;
};

export const getOrderDetails = (orderData) => {
  if (!orderData) return null;
  
  const formattedItems = Array.isArray(orderData.items) 
    ? orderData.items.map(item => ({
        ...item,
        price: getItemPrice(item),
        quantity: getItemQuantity(item),
        subtotal: getItemSubtotal(item)
      }))
    : [];
 
  const subtotal = formattedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryFee = orderData.deliveryFee || 0;
  const discount = orderData.discount || 0;
  const total = orderData.totalAmount || orderData.totalPrice || subtotal + deliveryFee - discount;

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