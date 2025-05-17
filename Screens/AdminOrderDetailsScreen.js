import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar,
  Modal,
  ActivityIndicator,
  Linking
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateOrderStatus, getOrderById } from "../services/firebaseService";

const AdminOrderDetailsScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const orderStatuses = [
    "Order Taken",
    "Processing",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
  ];

  useEffect(() => {
    checkAdminAuth();
    loadOrderDetails();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const isAdmin = await AsyncStorage.getItem("adminAuthenticated");
      if (isAdmin !== "true") {
        Alert.alert("Access Denied", "You must be logged in as an admin.");
        navigation.replace("AdminLogin");
      }
    } catch (error) {
      console.error("Error checking admin auth:", error);
      navigation.replace("AdminLogin");
    }
  };

  const refreshOrderDetails = () => {
    setIsRefreshing(true);
    loadOrderDetails()
      .finally(() => setIsRefreshing(false));
  };

  const loadOrderDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Loading order details for:", orderId);

      try {
        const order = await getOrderById(orderId);
        if (order) {
          console.log("Order loaded from Realtime DB:", order.id);

          let formattedItems = [];
          if (order.items && Array.isArray(order.items)) {
            formattedItems = order.items.map(item => ({
              ...item,
              price: typeof item.price === 'number' ? 
                      item.price : 
                      parseFloat(String(item.price).replace(/[^\d.-]/g, '')) || 0,
              quantity: typeof item.quantity === 'number' ? 
                       Math.max(1, item.quantity) : 
                       Math.max(1, parseInt(String(item.quantity).replace(/[^\d]/g, '')) || 1)
            }));
          } else {
            formattedItems = [];
          }
          
          const calculatedTotal = formattedItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
          }, 0);

          const completeOrder = {
            ...order,
            customerName: order.customerName || "Guest",
            phoneNumber: order.phoneNumber || order.phone || "Not provided",
            email: order.email || "Not provided",
            address: order.address || "Not provided",
            items: formattedItems,
            totalAmount: typeof order.totalAmount === 'number' ? 
              order.totalAmount : 
              typeof order.totalPrice === 'number' ?
              order.totalPrice :
              parseFloat(String(order.totalAmount || order.totalPrice).replace(/[^\d.-]/g, '')) || 
              calculatedTotal || 0,
            status: order.status || "Order Taken",
            paymentMethod: order.paymentMethod || "Not specified",
            createdAt: order.createdAt || new Date().toISOString()
          };
          
          setOrderData(completeOrder);
          setIsLoading(false);
          return;
        }
      } catch (realtimeError) {
        console.error("Error loading from Realtime DB:", realtimeError);
      }

      try {
        const storedOrders = await AsyncStorage.getItem("orders");
        if (storedOrders) {
          const orders = JSON.parse(storedOrders);
          const foundOrder = orders.find(o => o.id === orderId);
          
          if (foundOrder) {
            console.log("Order loaded from AsyncStorage:", foundOrder.id);

            let formattedItems = [];
            if (foundOrder.items && Array.isArray(foundOrder.items)) {
              formattedItems = foundOrder.items.map(item => ({
                ...item,
                price: typeof item.price === 'number' ? 
                        item.price : 
                        parseFloat(String(item.price).replace(/[^\d.-]/g, '')) || 0,
                quantity: typeof item.quantity === 'number' ? 
                         Math.max(1, item.quantity) : 
                         Math.max(1, parseInt(String(item.quantity).replace(/[^\d]/g, '')) || 1)
              }));
            } else {
              formattedItems = [];
            }

            const calculatedTotal = formattedItems.reduce((sum, item) => {
              return sum + (item.price * item.quantity);
            }, 0);

            const completeOrder = {
              ...foundOrder,
              customerName: foundOrder.customerName || "Guest",
              phoneNumber: foundOrder.phoneNumber || foundOrder.phone || "Not provided",
              email: foundOrder.email || "Not provided",
              address: foundOrder.address || "Not provided",
              items: formattedItems,
              totalAmount: typeof foundOrder.totalAmount === 'number' ? 
                foundOrder.totalAmount : 
                typeof foundOrder.totalPrice === 'number' ?
                foundOrder.totalPrice :
                parseFloat(String(foundOrder.totalAmount || foundOrder.totalPrice).replace(/[^\d.-]/g, '')) || 
                calculatedTotal || 0,
              status: foundOrder.status || "Order Taken",
              paymentMethod: foundOrder.paymentMethod || "Not specified",
              createdAt: foundOrder.createdAt || new Date().toISOString()
            };
            
            setOrderData(completeOrder);
            setError("Using offline data - connection to database failed");
            setIsLoading(false);
            return;
          }
        }

        setError("Order not found. It may have been deleted or the ID is incorrect.");
        setIsLoading(false);
      } catch (storageError) {
        console.error("Error loading from AsyncStorage:", storageError);
        setError("Failed to load order. Please check your connection and try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error in loadOrderDetails:", error);
      setError("An unexpected error occurred while loading the order.");
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    try {
      setIsLoading(true);
 
      try {
        await updateOrderStatus(orderId, newStatus);
        console.log("Order status updated in Realtime DB");

        setOrderData(prevData => ({
          ...prevData,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }));
        
        Alert.alert("Success", `Order status updated to "${newStatus}" successfully.`);
        setStatusModalVisible(false);
        return;
      } catch (realtimeError) {
        console.error("Error updating in Realtime DB:", realtimeError);

        try {

          const storedOrders = await AsyncStorage.getItem("orders");
          if (storedOrders) {
            let parsedOrders = JSON.parse(storedOrders);
            
            const updatedOrders = parsedOrders.map(order => {
              if (order.id === orderId) {
                return {
                  ...order,
                  status: newStatus,
                  updatedAt: new Date().toISOString()
                };
              }
              return order;
            });

            await AsyncStorage.setItem("orders", JSON.stringify(updatedOrders));

            setOrderData(prevData => ({
              ...prevData,
              status: newStatus,
              updatedAt: new Date().toISOString()
            }));
            
            Alert.alert("Success", `Order status updated to "${newStatus}" in offline mode.`);
            setStatusModalVisible(false);
            return;
          } else {
            throw new Error("No orders found in offline storage");
          }
        } catch (storageError) {
          console.error("Error updating in AsyncStorage:", storageError);
          throw storageError;
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert("Error", "Failed to update order status. Please try again.");
    } finally {
      setIsLoading(false);
      setStatusModalVisible(false);
    }
  };

  const callCustomer = () => {
    if (!orderData?.phoneNumber) {
      Alert.alert("Error", "No phone number available");
      return;
    }

    const phoneNumber = orderData.phoneNumber.replace(/\D/g, '');
    
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("Error", "Invalid phone number");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Order Taken":
        return "#FF9800";
      case "Processing":
        return "#2196F3";
      case "Out for Delivery":
        return "#9C27B0";
      case "Delivered":
        return "#4CAF50";
      case "Cancelled":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    const safeAmount = (amount && amount > 0) ? amount : 0;
    return `Rs ${safeAmount.toLocaleString()}`;
  };

  const calculateItemsSubtotal = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return 0;
    }
    
    return items.reduce((sum, item) => {
      const price = typeof item.price === 'number' && item.price > 0
        ? item.price
        : parseFloat(String(item.price).replace(/[^\d.-]/g, '')) || 1;
      
      const quantity = typeof item.quantity === 'number' && item.quantity > 0
        ? item.quantity
        : Math.max(1, parseInt(String(item.quantity).replace(/[^\d]/g, '')) || 1);
      
      return sum + (price * quantity);
    }, 0);
  };

  const renderItemImage = (item) => {
    try {
      if (!item.image) {
        return (
          <View style={[styles.itemImage, styles.imagePlaceholder]}>
            <Text style={styles.iconTextLarge}>🖼️</Text>
          </View>
        );
      }
 
      if (typeof item.image === 'string') {
        return (
          <Image 
            source={{ uri: item.image }} 
            style={styles.itemImage}
            defaultSource={require('../assets/images/icon.png')}
            onError={(e) => {
              console.log(`Failed to load image URL: ${e.nativeEvent?.error}`);
            }}
          />
        );
      }
  
      if (item.image.uri) {
        return (
          <Image 
            source={{ uri: item.image.uri }} 
            style={styles.itemImage}
            defaultSource={require('../assets/images/icon.png')}
            onError={(e) => {
              console.log(`Failed to load image URI: ${e.nativeEvent?.error}`);
            }}
          />
        );
      }

      return (
        <View style={[styles.itemImage, styles.imagePlaceholder]}>
          <Text style={styles.iconTextLarge}>🖼️</Text>
        </View>
      );
    } catch (error) {
      console.error("Error rendering item image:", error);
      return (
        <View style={[styles.itemImage, styles.imagePlaceholder]}>
          <Text style={styles.iconTextLarge}>🖼️</Text>
        </View>
      );
    }
  };

  const renderItemPrice = (item) => {
    const price = typeof item.price === 'number' && item.price > 0
      ? item.price
      : parseFloat(String(item.price).replace(/[^\d.-]/g, '')) || 1;
    
    return (
      <Text style={styles.itemPrice}>
        Rs {price.toLocaleString()}
      </Text>
    );
  };

  const renderItemQuantity = (item) => {
    const quantity = typeof item.quantity === 'number' && item.quantity > 0
      ? item.quantity
      : Math.max(1, parseInt(String(item.quantity).replace(/[^\d]/g, '')) || 1);
    
    return (
      <Text style={styles.itemQuantity}>
        {quantity}
      </Text>
    );
  };

  const renderItemSubtotal = (item) => {
    const price = typeof item.price === 'number' && item.price > 0
      ? item.price
      : parseFloat(String(item.price).replace(/[^\d.-]/g, '')) || 1;
    
    const quantity = typeof item.quantity === 'number' && item.quantity > 0
      ? item.quantity
      : Math.max(1, parseInt(String(item.quantity).replace(/[^\d]/g, '')) || 1);
    
    const subtotal = price * quantity;
    
    return (
      <Text style={styles.itemTotal}>
        Rs {subtotal.toLocaleString()}
      </Text>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#FFA451" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error || !orderData) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <Text style={styles.iconTextError}>⚠️</Text>
        <Text style={styles.errorText}>{error || "Order not found"}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.iconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Order #{orderId.substring(0, 8)}
        </Text>
        <TouchableOpacity 
          style={styles.statusButton}
          onPress={() => setStatusModalVisible(true)}
        >
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(orderData.status) }]}>
            <Text style={styles.statusText}>{orderData.status}</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerInfo}>
              <View style={styles.customerDetail}>
                <Text style={styles.iconText}>👤</Text>
                <Text style={styles.customerLabel}>Name:</Text>
                <Text style={styles.customerValue}>{orderData.customerName || "Guest User"}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.customerDetail}
                onPress={callCustomer}
              >
                <Text style={styles.iconText}>📞</Text>
                <Text style={styles.customerLabel}>Phone:</Text>
                <Text style={[styles.customerValue, styles.phoneNumber]}>
                  {orderData.phoneNumber || orderData.phone || "Not provided"}
                </Text>
                {(orderData.phoneNumber || orderData.phone) && (
                  <View style={styles.callButton}>
                    <Text style={styles.callButtonText}>Call</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {orderData.email && (
                <View style={styles.customerDetail}>
                  <Text style={styles.iconText}>📧</Text>
                  <Text style={styles.customerLabel}>Email:</Text>
                  <Text style={styles.customerValue}>{orderData.email}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.deliveryCard}>
            <View style={styles.deliveryInfo}>
              <View style={styles.deliveryDetail}>
                <Text style={styles.iconText}>📍</Text>
                <Text style={styles.deliveryLabel}>Address:</Text>
                <Text style={styles.deliveryValue}>{orderData.address || "Not provided"}</Text>
              </View>
              
              <View style={styles.deliveryDetail}>
                <Text style={styles.iconText}>📅</Text>
                <Text style={styles.deliveryLabel}>Date:</Text>
                <Text style={styles.deliveryValue}>{formatDate(orderData.createdAt)}</Text>
              </View>
              
              <View style={styles.deliveryDetail}>
                <Text style={styles.iconText}>💳</Text>
                <Text style={styles.deliveryLabel}>Payment:</Text>
                <Text style={styles.deliveryValue}>
                  {orderData.paymentMethod === "card" ? "Card Payment" : "Cash on Delivery"}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0 ? (
            orderData.items.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                {renderItemImage(item)}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name || "Unknown Product"}</Text>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPriceLabel}>Unit Price:</Text>
                    <Text style={styles.itemPrice}>
                      Rs {item.price?.toLocaleString() || 0}
                    </Text>
                  </View>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPriceLabel}>Quantity:</Text>
                    <Text style={styles.itemQuantity}>
                      {item.quantity || 0}
                    </Text>
                  </View>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPriceLabel}>Subtotal:</Text>
                    <Text style={styles.itemTotal}>
                      Rs {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.itemImage, styles.imagePlaceholder]}>
              <Text style={styles.iconTextLarge}>🛒</Text>
              <Text style={styles.emptyItemsText}>No items in this order</Text>
            </View>
          )}
          
          {}
          {orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0 && (
            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items Subtotal:</Text>
                <Text style={styles.summaryValue}>
                  Rs {orderData.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0).toLocaleString() || 0}
                </Text>
              </View>
              
              {orderData.deliveryFee > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                  <Text style={styles.summaryValue}>
                    Rs {orderData.deliveryFee.toLocaleString()}
                  </Text>
                </View>
              )}
              
              {orderData.discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount:</Text>
                  <Text style={[styles.summaryValue, styles.discountValue]}>
                    -Rs {orderData.discount.toLocaleString()}
                  </Text>
                </View>
              )}
              
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>
                  Rs {orderData.totalAmount?.toLocaleString() || orderData.total?.toLocaleString() || 0}
                </Text>
              </View>
            </View>
          )}
        </View>
        
        {}
        <TouchableOpacity
          style={styles.updateStatusButton}
          onPress={() => setStatusModalVisible(true)}
        >
          <Text style={styles.iconText}>🔄</Text>
          <Text style={styles.updateStatusButtonText}>Update Order Status</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setStatusModalVisible(false)}
              >
                <Text style={styles.iconText}>✗</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Current Status: 
              <Text style={[styles.currentStatus, { color: getStatusColor(orderData.status) }]}>
                {" " + orderData.status}
              </Text>
            </Text>
            
            <View style={styles.statusOptions}>
              {orderStatuses.map((status, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.statusOption,
                    orderData.status === status && styles.selectedStatusOption
                  ]}
                  onPress={() => updateOrderStatus(status)}
                  disabled={isLoading}
                >
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                  <Text
                    style={[
                      styles.statusOptionText,
                      orderData.status === status && styles.selectedStatusOptionText
                    ]}
                  >
                    {status}
                  </Text>
                  {orderData.status === status && (
                    <Text style={styles.iconText}>✅</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFA451" />
                <Text style={styles.loadingText}>Updating order status...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27214D",
  },
  statusButton: {
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27214D",
    marginBottom: 8,
  },
  customerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  customerInfo: {
    
  },
  customerDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  customerLabel: {
    fontSize: 14,
    color: "#5D577E",
    width: 60,
    marginLeft: 8,
  },
  customerValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#27214D",
    flex: 1,
  },
  phoneNumber: {
    color: "#2196F3",
    textDecorationLine: "underline",
  },
  callButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  callButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  deliveryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deliveryInfo: {
    
  },
  deliveryDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  deliveryLabel: {
    fontSize: 14,
    color: "#5D577E",
    width: 60,
    marginLeft: 8,
  },
  deliveryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#27214D",
    flex: 1,
  },
  orderItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  imagePlaceholder: {
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  itemDetails: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27214D",
    marginBottom: 4,
  },
  itemPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  itemPriceLabel: {
    fontSize: 14,
    color: "#666666",
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    textAlign: "right",
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    textAlign: "right",
    flex: 1,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF7E1E",
    textAlign: "right",
    flex: 1,
  },
  emptyItemsText: {
    fontSize: 14,
    color: "#5D577E",
    textAlign: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  orderSummary: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27214D",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#5D577E",
  },
  summaryValue: {
    fontSize: 14,
    color: "#27214D",
    fontWeight: "500",
  },
  discountValue: {
    color: "#4CAF50",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27214D",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF7E1E",
  },
  updateStatusButton: {
    backgroundColor: "#FFA451",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 20,
    flexDirection: "row",
  },
  updateStatusButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27214D",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#5D577E",
    marginBottom: 16,
  },
  currentStatus: {
    fontWeight: "bold",
  },
  statusOptions: {
    
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  selectedStatusOption: {
    backgroundColor: "#F9F9F9",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 16,
    color: "#27214D",
    flex: 1,
  },
  selectedStatusOptionText: {
    fontWeight: "bold",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#5D577E",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
    marginVertical: 16,
  },
  backButtonText: {
    color: "#FFA451",
    fontSize: 16,
    fontWeight: "bold",
  },
  iconText: {
    fontSize: 18,
    marginRight: 8,
  },
  iconTextLarge: {
    fontSize: 40,
    color: '#ccc',
    textAlign: 'center',
  },
  iconTextError: {
    fontSize: 64,
    color: '#F44336',
    marginBottom: 16,
  },
});

export default AdminOrderDetailsScreen; 