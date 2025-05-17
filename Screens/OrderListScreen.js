import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import { subscribeToOrdersInRealtimeDb } from "../firebase/realtime-db";

const OrderListScreen = ({ navigation, route }) => {
  const { selectedTab: initialTab } = route.params || {};
  const [basketItems, setBasketItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [userOrders, setUserOrders] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(initialTab || "basket"); // "basket" or "orders"

  const loadBasket = async () => {
    try {
      const basketString = await AsyncStorage.getItem("basket");
      if (basketString) {
        const basket = JSON.parse(basketString);
        
        // Ensure all basket items have numeric price and quantity
        const formattedBasket = basket.map(item => ({
          ...item,
          price: isNaN(Number(item.price)) ? 0 : Number(item.price),
          quantity: isNaN(Number(item.quantity)) ? 0 : Number(item.quantity)
        }));
        
        setBasketItems(formattedBasket);
        
        const total = formattedBasket.reduce(
          (sum, item) => sum + (item.price * item.quantity), 
          0
        );
        setTotalPrice(total);
      } else {
        setBasketItems([]);
        setTotalPrice(0);
      }
    } catch (error) {
      console.error("Error loading basket:", error);
    }
  };

  // Load user data
  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem("userData");
      if (userDataString) {
        const parsedUserData = JSON.parse(userDataString);
        setUserData(parsedUserData);
        return parsedUserData;
      }
      return null;
    } catch (error) {
      console.error("Error loading user data:", error);
      return null;
    }
  };

  // Load user's orders from Realtime DB
  const loadUserOrders = async () => {
    setIsLoading(true);
    try {
      const user = await loadUserData();
      const userId = user?.id || "guest";
      
      console.log("Loading orders for user:", userId);
      
      // Set up subscription to orders in Realtime DB
      const unsubscribe = subscribeToOrdersInRealtimeDb(
        (orders) => {
          console.log(`Received ${orders.length} orders from Realtime DB`);
          
          // Filter orders to only show those belonging to the current user
          const userOrders = orders.filter(order => order.userId === userId);
          
          // Format each order to ensure prices and quantities are correct
          const formattedOrders = userOrders.map(order => {
            // Ensure items array exists and is properly formatted
            const formattedItems = order.items && Array.isArray(order.items) 
              ? order.items.map(item => {
                  // Make sure price is always a positive number
                  const itemPrice = typeof item.price === 'number' && item.price > 0
                    ? item.price 
                    : parseFloat(String(item.price).replace(/[^\d.-]/g, ''));
                  
                  // Make sure quantity is always a positive number
                  const itemQuantity = typeof item.quantity === 'number' && item.quantity > 0
                    ? item.quantity 
                    : Math.max(1, parseInt(String(item.quantity).replace(/[^\d]/g, '')) || 1);
                  
                  return {
                    ...item,
                    price: itemPrice > 0 ? itemPrice : 1,  // Ensure price is at least 1
                    quantity: itemQuantity
                  };
                })
              : [];
            
            // Calculate total amount from items to ensure it's not zero
            const calculatedTotal = formattedItems.reduce((sum, item) => {
              return sum + (item.price * item.quantity);
            }, 0);
            
            // Determine a valid total amount
            let orderTotal = 0;
            if (typeof order.totalAmount === 'number' && order.totalAmount > 0) {
              orderTotal = order.totalAmount;
            } else if (typeof order.totalPrice === 'number' && order.totalPrice > 0) {
              orderTotal = order.totalPrice;
            } else {
              const parsedTotal = parseFloat(String(order.totalAmount || order.totalPrice).replace(/[^\d.-]/g, ''));
              orderTotal = parsedTotal > 0 ? parsedTotal : calculatedTotal;
            }
            
            // Ensure total is at least equal to sum of items
            if (orderTotal === 0 && calculatedTotal > 0) {
              orderTotal = calculatedTotal;
            }
            
            // Return the formatted order
            return {
              ...order,
              items: formattedItems,
              totalAmount: orderTotal > 0 ? orderTotal : 0
            };
          });
          
          // Sort by date, newest first
          const sortedOrders = [...formattedOrders].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          
          setUserOrders(sortedOrders);
          setIsLoading(false);
        },
        userId, // Pass the userId to filter orders on the server side if possible
        (error) => {
          console.error("Error loading orders:", error);
          // Try to load from AsyncStorage as fallback
          loadOrdersFromStorage();
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error("Error in loadUserOrders:", error);
      loadOrdersFromStorage();
      return () => {};
    }
  };
  
  // Fallback to load orders from AsyncStorage
  const loadOrdersFromStorage = async () => {
    try {
      const storedOrders = await AsyncStorage.getItem("orders");
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        const user = await loadUserData();
        const userId = user?.id || "guest";
        
        // Filter orders for current user
        const userOrders = parsedOrders.filter(order => order.userId === userId);
        
        // Format each order to ensure prices and quantities are correct
        const formattedOrders = userOrders.map(order => {
          // Ensure items array exists and is properly formatted
          const formattedItems = order.items && Array.isArray(order.items) 
            ? order.items.map(item => {
                // Make sure price is always a positive number
                const itemPrice = typeof item.price === 'number' && item.price > 0
                  ? item.price 
                  : parseFloat(String(item.price).replace(/[^\d.-]/g, ''));
                
                // Make sure quantity is always a positive number
                const itemQuantity = typeof item.quantity === 'number' && item.quantity > 0
                  ? item.quantity 
                  : Math.max(1, parseInt(String(item.quantity).replace(/[^\d]/g, '')) || 1);
                
                return {
                  ...item,
                  price: itemPrice > 0 ? itemPrice : 1,  // Ensure price is at least 1
                  quantity: itemQuantity
                };
              })
            : [];
          
          // Calculate total amount from items to ensure it's not zero
          const calculatedTotal = formattedItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
          }, 0);
          
          // Determine a valid total amount
          let orderTotal = 0;
          if (typeof order.totalAmount === 'number' && order.totalAmount > 0) {
            orderTotal = order.totalAmount;
          } else if (typeof order.totalPrice === 'number' && order.totalPrice > 0) {
            orderTotal = order.totalPrice;
          } else {
            const parsedTotal = parseFloat(String(order.totalAmount || order.totalPrice).replace(/[^\d.-]/g, ''));
            orderTotal = parsedTotal > 0 ? parsedTotal : calculatedTotal;
          }
          
          // Ensure total is at least equal to sum of items
          if (orderTotal === 0 && calculatedTotal > 0) {
            orderTotal = calculatedTotal;
          }
          
          // Return the formatted order
          return {
            ...order,
            items: formattedItems,
            totalAmount: orderTotal > 0 ? orderTotal : 0
          };
        });
        
        // Sort by date, newest first
        formattedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setUserOrders(formattedOrders);
      } else {
        setUserOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders from storage:", error);
      setUserOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load basket on initial mount
  useEffect(() => {
    loadBasket();
    const unsubscribe = loadUserOrders();
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);
  
  // Reload data every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("OrderList screen focused - refreshing data");
      loadBasket();
      const unsubscribe = loadUserOrders();
      
      // Check if we're coming back from a successful order placement
      AsyncStorage.getItem("orderJustPlaced").then(orderPlaced => {
        if (orderPlaced === 'true') {
          // Clear the flag
          AsyncStorage.removeItem("orderJustPlaced");
          // Switch to orders tab
          setSelectedTab("orders");
        }
      });
      
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }, [])
  );

  const removeItem = async (id) => {
    try {
      const updatedBasket = basketItems.filter(item => item.id !== id);
      setBasketItems(updatedBasket);
      
      // Recalculate total
      const total = updatedBasket.reduce(
        (sum, item) => {
          const price = isNaN(Number(item.price)) ? 0 : Number(item.price);
          const quantity = isNaN(Number(item.quantity)) ? 0 : Number(item.quantity);
          return sum + (price * quantity);
        }, 
        0
      );
      setTotalPrice(total);
      
      // Update storage
      await AsyncStorage.setItem("basket", JSON.stringify(updatedBasket));
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const updateQuantity = async (id, newQuantity) => {
    try {
      if (newQuantity < 1) return;
      
      const updatedBasket = basketItems.map(item => {
        if (item.id === id) {
          return { 
            ...item, 
            quantity: Number(newQuantity) // Ensure it's stored as a number
          };
        }
        return item;
      });
      
      setBasketItems(updatedBasket);
      
      // Recalculate total with numeric values
      const total = updatedBasket.reduce(
        (sum, item) => {
          const price = isNaN(Number(item.price)) ? 0 : Number(item.price);
          const quantity = isNaN(Number(item.quantity)) ? 0 : Number(item.quantity);
          return sum + (price * quantity);
        }, 
        0
      );
      setTotalPrice(total);
      
      // Update storage
      await AsyncStorage.setItem("basket", JSON.stringify(updatedBasket));
      
      // Find the updated item for feedback
      const updatedItem = updatedBasket.find(item => item.id === id);
      if (updatedItem) {
        console.log(`Quantity updated: ${updatedItem.name} x${newQuantity}`);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      Alert.alert("Error", "Failed to update quantity");
    }
  };
  
  const handleCheckout = () => {
    if (basketItems.length === 0) {
      Alert.alert("Empty Basket", "Add some items to your basket before checkout.");
      return;
    }

    // Ensure product data is in correct format before passing to checkout
    const formattedProducts = basketItems.map(item => ({
      ...item,
      id: item.id || String(Math.random()),
      name: item.name || "Product",
      price: isNaN(Number(item.price)) ? 0 : Number(item.price),
      quantity: isNaN(Number(item.quantity)) ? 0 : Number(item.quantity)
    }));

    // Recalculate total in case there were NaN values
    const formattedTotal = formattedProducts.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );

    navigation.navigate("Checkout", { 
      products: formattedProducts, 
      total: formattedTotal
    });
  };

  // Get status color based on order status
  const getStatusColor = (status) => {
    switch (status) {
      case "Order Taken":
        return "#FFA451";
      case "Processing":
        return "#2196F3";
      case "Out for Delivery":
        return "#FFC107";
      case "Delivered":
        return "#4CAF50";
      case "Cancelled":
        return "#F44336";
      default:
        return "#5D577E";
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  const renderBasketItem = ({ item }) => {
    // Ensure price and quantity are proper numbers
    const itemPrice = isNaN(Number(item.price)) ? 0 : Number(item.price);
    const itemQuantity = isNaN(Number(item.quantity)) ? 0 : Number(item.quantity);
    
    return (
      <View style={styles.basketItem}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.basketItemImage}
          defaultSource={require('../assets/images/icon.png')}
        />
        
        <View style={styles.basketItemDetails}>
          <Text style={styles.basketItemName}>{item.name}</Text>
          <Text style={styles.basketItemPrice}>Rs {itemPrice}</Text>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, itemQuantity - 1)}
              disabled={itemQuantity <= 1}
            >
              <Ionicons 
                name="remove" 
                size={18} 
                color={itemQuantity <= 1 ? "#CCCCCC" : "#27214D"} 
              />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{itemQuantity}</Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, itemQuantity + 1)}
            >
              <Ionicons name="add" size={18} color="#27214D" />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(item.id)}
        >
          <Ionicons name="trash-outline" size={24} color="#FF5757" />
        </TouchableOpacity>
      </View>
    );
  };

  // Render an order item in the My Orders list
  const renderOrderItem = ({ item }) => {
    // Get item count
    const itemsCount = item.items && Array.isArray(item.items) ? item.items.length : 0;
    
    return (
      <View style={styles.orderItem}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Order #{item.id.substring(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.orderDetails}>
          <View style={styles.orderDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#5D577E" />
            <Text style={styles.orderDetailText}>{formatDate(item.createdAt)}</Text>
          </View>
          
          <View style={styles.orderDetailRow}>
            <Ionicons name="cash-outline" size={16} color="#5D577E" />
            <Text style={styles.orderDetailText}>
              Rs {item.totalAmount?.toLocaleString() || item.total?.toLocaleString() || 0}
            </Text>
          </View>
          
          <View style={styles.orderDetailRow}>
            <Ionicons name="cube-outline" size={16} color="#5D577E" />
            <Text style={styles.orderDetailText}>
              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>
        
        <View style={styles.orderStatus}>
          <Text style={styles.orderStatusText}>Status: </Text>
          <View style={[styles.miniStatusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.miniStatusText}>{item.status}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFA451" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#27214D" />
          <Text style={styles.backText}>Go back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedTab === "basket" ? "My Basket" : "My Orders"}
        </Text>
      </View>
      
      {/* Tab navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === "basket" && styles.activeTab]}
          onPress={() => setSelectedTab("basket")}
        >
          <Ionicons 
            name="basket-outline" 
            size={20} 
            color={selectedTab === "basket" ? "#FFA451" : "#5D577E"} 
          />
          <Text 
            style={[styles.tabText, selectedTab === "basket" && styles.activeTabText]}
          >
            My Basket
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === "orders" && styles.activeTab]}
          onPress={() => setSelectedTab("orders")}
        >
          <Ionicons 
            name="list-outline" 
            size={20} 
            color={selectedTab === "orders" ? "#FFA451" : "#5D577E"} 
          />
          <Text 
            style={[styles.tabText, selectedTab === "orders" && styles.activeTabText]}
          >
            My Orders
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Basket content */}
      {selectedTab === "basket" && (
        <>
          {basketItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="basket-outline" size={64} color="#C4C4C4" />
              <Text style={styles.emptyText}>Your basket is empty</Text>
              <TouchableOpacity 
                style={styles.shopButton}
                onPress={() => navigation.navigate("UserDashboard")}
              >
                <Text style={styles.shopButtonText}>Browse Products</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                data={basketItems}
                renderItem={renderBasketItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.basketList}
              />
              
              {/* Checkout Button */}
              <View style={styles.checkoutContainer}>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Total</Text>
                  <Text style={styles.priceValue}>Rs {totalPrice.toLocaleString()}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.checkoutButton}
                  onPress={handleCheckout}
                >
                  <Text style={styles.checkoutButtonText}>Checkout</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </>
      )}
      
      {/* Orders content */}
      {selectedTab === "orders" && (
        <>
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#FFA451" />
              <Text style={styles.loaderText}>Loading your orders...</Text>
            </View>
          ) : (
            <>
              {userOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-outline" size={64} color="#C4C4C4" />
                  <Text style={styles.emptyText}>You haven't placed any orders yet</Text>
                  <TouchableOpacity 
                    style={styles.shopButton}
                    onPress={() => navigation.navigate("UserDashboard")}
                  >
                    <Text style={styles.shopButtonText}>Start Shopping</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={userOrders}
                  renderItem={renderOrderItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.ordersList}
                />
              )}
            </>
          )}
        </>
      )}
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
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F1F1",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    color: "#27214D",
    fontSize: 16,
    marginLeft: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#27214D",
    marginRight: 32,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F1F1",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFA451",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#5D577E",
    marginLeft: 4,
  },
  activeTabText: {
    color: "#FFA451",
    fontWeight: "600",
  },
  basketList: {
    padding: 16,
  },
  basketItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  basketItemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  basketItemDetails: {
    flex: 1,
  },
  basketItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#27214D",
    marginBottom: 8,
  },
  basketItemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFA451",
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#F7F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#27214D",
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#FFF4F4",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#5D577E",
    marginVertical: 16,
    textAlign: "center",
  },
  shopButton: {
    backgroundColor: "#FFA451",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  shopButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  checkoutContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F1F1",
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: "#5D577E",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27214D",
  },
  checkoutButton: {
    backgroundColor: "#FFA451",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Order list styles
  ordersList: {
    padding: 16,
  },
  orderItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#27214D",
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
  orderDetails: {
    marginBottom: 16,
  },
  orderDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  orderDetailText: {
    fontSize: 14,
    color: "#5D577E",
    marginLeft: 8,
  },
  orderStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F1F1",
    paddingTop: 10,
  },
  orderStatusText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#5D577E",
  },
  miniStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 4,
  },
  miniStatusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: "#5D577E",
  },
});

export default OrderListScreen;
