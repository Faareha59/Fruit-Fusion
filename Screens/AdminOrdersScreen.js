import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { 
  getAllOrders,
  updateOrderStatus as updateOrderStatusInFirebase,
  database
} from '../services/firebaseService';
import { ref, onValue, get } from 'firebase/database';
import { subscribeToOrdersInRealtimeDb } from "../firebase/realtime-db";

const safeAsyncStorage = {
  getItem: async (key, defaultValue = null) => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return JSON.parse(value);
      }
      return defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} from AsyncStorage:`, error);
      return defaultValue;
    }
  },
  
  setItem: async (key, value) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in AsyncStorage:`, error);
      return false;
    }
  }
};

const AdminOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentUnsubscribe, setCurrentUnsubscribe] = useState(null);

  const orderStatuses = [
    "Order Taken",
    "Processing",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
  ];

  
  useEffect(() => {
    checkAdminAuth();
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

  useFocusEffect(
    React.useCallback(() => {
      console.log("AdminOrdersScreen focused - refreshing orders data");
      const unsubscribe = loadOrders();
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }, [])
  );

  useEffect(() => {
    loadOrders();
 
    return () => {
      if (currentUnsubscribe) {
        console.log("Cleaning up Realtime DB subscription");
        currentUnsubscribe();
      }
    };
  }, []);

  const loadOrders = () => {
    setIsLoading(true);
    setError(null);
    
    console.log("Attempting to load orders directly from Realtime DB...");

    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("Orders loading timed out, falling back to storage");
        setError("Loading orders took too long. Displaying cached data.");
        loadOrdersFromStorage();
      }
    }, 10000); 
    getAllOrders()
      .then(directOrders => {
        clearTimeout(timeoutId); 
        console.log(`Direct check: Found ${directOrders.length} orders in Realtime DB`);
        
        if (directOrders && directOrders.length > 0) {
          try {
          const processedOrders = directOrders.map(order => ({
            ...order,
              id: order.id || String(Math.random()),
            customerName: order.customerName || "Guest",
            items: order.items || [],
            totalAmount: order.totalAmount || 0,
            status: order.status || "Order Taken",
            paymentMethod: order.paymentMethod || "Not specified",
            createdAt: order.createdAt || new Date().toISOString()
          }));

          setOrders(processedOrders);
          setIsLoading(false);
   
          setupOrdersSubscription();
          } catch (processingError) {
            console.error("Error processing orders:", processingError);
            setError("Error processing orders. Some data may not display correctly.");
            setOrders(directOrders); 
            setIsLoading(false);
          }
        } else {
          console.log("No orders found via direct check, trying subscription anyway");
          setupOrdersSubscription();
        }
      })
      .catch(error => {
        clearTimeout(timeoutId); 
        console.error("Error during direct check of orders:", error);
        setError("Error connecting to database. Trying real-time connection...");
        setupOrdersSubscription(); 
      });
    
    return () => {
      clearTimeout(timeoutId); 
      if (currentUnsubscribe) {
        currentUnsubscribe();
      }
    };
  };
 
  const loadOrdersFromStorage = async () => {
    setError("Using local storage (not connected to database)");
    try {
      const storedOrders = await safeAsyncStorage.getItem("orders", []);
      if (Array.isArray(storedOrders) && storedOrders.length > 0) {
        const sortedOrders = [...storedOrders].sort((a, b) => {
          try {
            return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
          } catch (e) {
            return 0;
          }
        });
        setOrders(sortedOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders from storage:", error);
      setError("Failed to load orders. Please try again.");
      setOrders([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    const unsubscribe = loadOrders();
    return unsubscribe;
  };

  const setupOrdersSubscription = () => {
    console.log("Setting up Firebase Realtime DB subscription for admin orders");
    
    try {
      const unsubscribeFunction = subscribeToOrdersInRealtimeDb(
        (updatedOrders) => {
          if (updatedOrders && updatedOrders.length > 0) {
            try {
              const processedOrders = updatedOrders.map(order => {
                const formattedItems = order.items && Array.isArray(order.items) 
                  ? order.items.map(item => ({
                      ...item,
                      price: typeof item.price === 'number' 
                        ? item.price 
                        : parseFloat(String(item.price).replace(/[^\d.-]/g, '')) || 0,
                      quantity: typeof item.quantity === 'number' 
                        ? Math.max(1, item.quantity) 
                        : Math.max(1, parseInt(String(item.quantity).replace(/[^\d]/g, '')) || 1)
                    })) 
                  : [];

                const calculatedTotal = formattedItems.length > 0
                  ? formattedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                  : 0;

                return {
                  ...order,
                  id: order.id || String(Math.random()),
                  userId: order.userId || "unknown",
                  customerName: order.customerName || "Guest",
                  phoneNumber: order.phoneNumber || order.phone || "Not provided",
                  email: order.email || "Not provided",
                  address: order.address || "Not provided",
                  items: formattedItems,
                  totalAmount: typeof order.totalAmount === 'number' 
                    ? order.totalAmount 
                    : typeof order.totalPrice === 'number'
                      ? order.totalPrice
                      : parseFloat(String(order.totalAmount || order.totalPrice).replace(/[^\d.-]/g, '')) || calculatedTotal || 0,
                  status: order.status || "Order Taken",
                  paymentMethod: order.paymentMethod || "Not specified",
                  createdAt: order.createdAt || new Date().toISOString()
                };
              });
              
              console.log(`Firebase subscription: Found ${processedOrders.length} orders from all users`);
              processedOrders.sort((a, b) => {
                try {
                  return new Date(b.createdAt) - new Date(a.createdAt);
                } catch (error) {
                  return 0; 
                }
              });
              
              setOrders(processedOrders);
              setIsLoading(false);
              setRefreshing(false);

              safeAsyncStorage.setItem("adminOrders", processedOrders);
            } catch (processingError) {
              console.error("Error processing orders in subscription:", processingError);
              setError("Error processing orders. Some data may not display correctly.");
              setOrders(updatedOrders);
              setIsLoading(false);
              setRefreshing(false);
            }
          } else {
            console.log("No orders found in subscription data");
            setOrders([]);
            setIsLoading(false);
            setRefreshing(false);
          }
        },
        null,
        (error) => {
          console.error("Error in admin orders subscription:", error);
          setError("Error connecting to database. Using local data.");
          loadOrdersFromStorage();
        }
      );

      setCurrentUnsubscribe(() => unsubscribeFunction);
      
      return unsubscribeFunction;
    } catch (error) {
      console.error("Error setting up Firebase subscription:", error);
      setError("Error connecting to database. Using local data.");
      loadOrdersFromStorage();
      return () => {};
    }
  };

  const updateLocalOrderStatus = (orderId, newStatus) => {
    const updatedOrdersList = orders.map(order => {
              if (order.id === orderId) {
                return {
                  ...order,
                  status: newStatus,
                  updatedAt: new Date().toISOString()
                };
              }
              return order;
            });
    setOrders([...updatedOrdersList]);
    
    return updatedOrdersList;
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setStatusModalVisible(false);

    setIsLoading(true);
 
    const updatedOrdersList = updateLocalOrderStatus(orderId, newStatus);
  
    setTimeout(() => { 
      setOrders([...updatedOrdersList]);
    }, 50);
            
    setTimeout(async () => {
      try {
        let useFirebase = true;
        try {
          if (!database) {
            useFirebase = false;
            throw new Error("Firebase database not available");
          }
        } catch (dbCheckError) {
          console.log("Firebase check failed, using local storage:", dbCheckError);
          useFirebase = false;
        }
       
        if (useFirebase) {
          try {
            await updateOrderStatusInFirebase(orderId, newStatus);
            console.log("Firebase update successful");

            setIsLoading(false);
            Alert.alert("Success", "Order status updated successfully.");
            return;
          } catch (firebaseError) {
            console.error("Firebase update failed:", firebaseError);
          }
        }

        try {
          safeAsyncStorage.setItem("orders", updatedOrdersList)
            .then(success => {
              console.log(success ? "AsyncStorage updated successfully" : "AsyncStorage update failed");
            })
            .catch(error => {
              console.error("AsyncStorage update error:", error);
            });

          Alert.alert("Success", "Order status updated in offline mode.");
        } catch (localUpdateError) {
          console.error("Error in local update:", localUpdateError);
          Alert.alert("Error", "Failed to update order status. Please try again.");
      }
    } catch (error) {
        console.error("General error in status update:", error);
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
    }, 100);
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
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

  const getFormattedPhone = (order) => {
    const phoneNumber = order.phoneNumber || order.customerPhone || '';
    if (!phoneNumber) return '';
 
    if (typeof phoneNumber === 'string' && phoneNumber.trim()) {
      const cleaned = phoneNumber.replace(/\D/g, '');
      if (cleaned.length === 11 && cleaned.startsWith('03')) {
        return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
      }
      return cleaned;
    }
    
    return phoneNumber;
  };

  const renderOrderItem = ({ item }) => {
    const itemCount = item.items && Array.isArray(item.items) ? item.items.length : 0;
    
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item.id.substring(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>
            Customer: {item.customerName || "Guest User"}
          </Text>
          <Text style={styles.orderDate}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        
        <View style={styles.orderDetails}>
          <View style={styles.orderDetail}>
            <Text style={styles.detailLabel}>Items:</Text>
            <Text style={styles.detailValue}>
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </Text>
          </View>
          
          <View style={styles.orderDetail}>
            <Text style={styles.detailLabel}>Total:</Text>
            <Text style={styles.detailValue}>
              Rs {item.totalAmount?.toLocaleString() || item.total?.toLocaleString() || 0}
            </Text>
          </View>
          
          {getFormattedPhone(item) ? (
            <View style={styles.orderDetail}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>
                {getFormattedPhone(item)}
              </Text>
            </View>
          ) : null}
        </View>
        
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.statusButton, {flex: 1}]}
            onPress={() => openStatusModal(item)}
          >
            <Text style={styles.actionButtonText}>Update Status</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FF7E1E" barStyle="light-content" />
      
      {}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#27214D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Orders</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isLoading || refreshing}
        >
          <Ionicons name="refresh" size={24} color="#27214D" />
        </TouchableOpacity>
      </View>
      
      {}
      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#fff" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}
      
      {}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7E1E" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={64} color="#C4C4C4" />
              <Text style={styles.emptyText}>
                No orders available yet.
              </Text>
            </View>
          )}
        />
      )}
      
      {}
      <Modal
        animationType="fade"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={() => {
          if (!isLoading) {
            setStatusModalVisible(false);
          }
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={0.7}
          onPress={() => !isLoading && setStatusModalVisible(false)}
      >
          <View style={styles.modalContainer}
            onStartShouldSetResponder={() => true}
            onResponderGrant={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity 
                onPress={() => !isLoading && setStatusModalVisible(false)}
                style={styles.closeButton}
                disabled={isLoading}
              >
                <Text style={[styles.iconText, isLoading && {opacity: 0.5}]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {orderStatuses.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    selectedOrder && selectedOrder.status === status && styles.selectedStatusOption,
                    isLoading && styles.disabledStatusOption
                  ]}
                  onPress={() => {
                    if (selectedOrder && !isLoading) {
                      handleStatusUpdate(selectedOrder.id, status);
                    }
                  }}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      selectedOrder && selectedOrder.status === status && styles.selectedStatusOptionText,
                      isLoading && {opacity: 0.5}
                    ]}
                  >
                    {status}
                  </Text>
                  {selectedOrder && selectedOrder.status === status && (
                    <Text style={[styles.iconText, {color: "#FFA451"}]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            {isLoading && (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="small" color="#FFA451" />
                <Text style={styles.modalLoadingText}>Updating status...</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27214D",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#27214D",
  },
  errorBanner: {
    flexDirection: "row",
    backgroundColor: "#f44336",
    padding: 12,
    alignItems: "center",
  },
  errorBannerText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontSize: 14,
  },
  ordersList: {
    padding: 16,
    paddingBottom: 80, 
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27214D",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  customerInfo: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  customerName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#27214D",
    marginBottom: 6,
  },
  orderDate: {
    fontSize: 14,
    color: "#5D577E",
    marginTop: 2,
  },
  orderDetails: {
    marginBottom: 16,
  },
  orderDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#5D577E",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#27214D",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFA451",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  detailsButton: {
    flex: 1,
    backgroundColor: "#2196F3",
  },
  statusButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#86869E",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27214D",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: 300,
  },
  statusOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },
  selectedStatusOption: {
    backgroundColor: "#FFF4E8",
  },
  statusOptionText: {
    fontSize: 16,
    color: "#27214D",
  },
  selectedStatusOptionText: {
    fontWeight: "bold",
    color: "#FFA451",
  },
  iconText: {
    fontSize: 16,
    marginRight: 8,
  },
  iconTextWhite: {
    fontSize: 16,
    marginRight: 8,
    color: '#FFFFFF',
  },
  disabledStatusOption: {
    opacity: 0.5,
  },
  modalLoadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalLoadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#27214D",
  },
});

export default AdminOrdersScreen; 