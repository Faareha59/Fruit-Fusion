import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToOrderById } from '../firebase/realtime-db';
import { getOrderDetails, formatPrice } from '../utils/orderUtils';

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [formattedOrder, setFormattedOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load order details when component mounts
    const loadOrderDetails = () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Subscribe to real-time updates for this order
        const unsubscribe = subscribeToOrderById(
          orderId,
          (orderData) => {
            if (orderData) {
              console.log("Received order data:", orderData.id);
              setOrderData(orderData);
              
              // Format the order data for display
              const formatted = getOrderDetails(orderData);
              setFormattedOrder(formatted);
            } else {
              setError("Order not found");
            }
            setIsLoading(false);
          },
          (error) => {
            console.error("Error loading order:", error);
            setError("Failed to load order details");
            setIsLoading(false);
          }
        );
        
        // Clean up subscription on unmount
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up order subscription:", error);
        setError("An unexpected error occurred");
        setIsLoading(false);
        return () => {};
      }
    };
    
    return loadOrderDetails();
  }, [orderId]);

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "#FFA451";
      case "Processing": return "#2196F3";
      case "Out for Delivery": return "#9C27B0";
      case "Delivered": return "#4CAF50";
      case "Cancelled": return "#F44336";
      default: return "#5D577E";
    }
  };

  // Handle call to customer
  const handleCallCustomer = () => {
    if (!formattedOrder?.phoneNumber || formattedOrder.phoneNumber === "Not provided") {
      Alert.alert("No Phone Number", "There is no phone number available for this customer.");
      return;
    }
    
    Alert.alert(
      "Call Customer",
      `Do you want to call ${formattedOrder.phoneNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => console.log(`Calling ${formattedOrder.phoneNumber}`) }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFA451" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error || !formattedOrder) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error || "Failed to load order"}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('UserDashboard')}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('UserDashboard')}
        >
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.content}>
        {/* Order ID and Status */}
        <View style={styles.section}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>Order #{orderId.substring(0, 8)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(formattedOrder.status) }]}>
              <Text style={styles.statusText}>{formattedOrder.status}</Text>
            </View>
          </View>
          <Text style={styles.orderDate}>
            Placed on {formatDate(formattedOrder.createdAt)}
          </Text>
        </View>
        
        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#5D577E" />
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{formattedOrder.customerName}</Text>
            </View>
            
            <TouchableOpacity style={styles.infoRow} onPress={handleCallCustomer}>
              <Ionicons name="call-outline" size={20} color="#5D577E" />
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={[styles.infoValue, styles.phoneValue]}>
                {formattedOrder.phoneNumber}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#5D577E" />
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{formattedOrder.address}</Text>
            </View>
          </View>
        </View>
        
        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {formattedOrder.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              
              <View style={styles.itemDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Price:</Text>
                  <Text style={styles.detailValue}>{formatPrice(item.price)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity:</Text>
                  <Text style={styles.detailValue}>{item.quantity}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Subtotal:</Text>
                  <Text style={styles.detailValue}>{formatPrice(item.subtotal)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>{formatPrice(formattedOrder.subtotal)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee:</Text>
              <Text style={styles.summaryValue}>{formatPrice(formattedOrder.deliveryFee)}</Text>
            </View>
            
            {formattedOrder.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount:</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{formatPrice(formattedOrder.discount)}
                </Text>
              </View>
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{formatPrice(formattedOrder.total)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.paymentSection}>
          <Text style={styles.paymentMethod}>
            Payment Method: {formattedOrder.paymentMethod}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#5D577E',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFA451',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#F5F5F5',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    width: 60,
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  phoneValue: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  itemCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  itemDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  summaryCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333333',
  },
  discountValue: {
    color: '#4CAF50',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF7E1E',
  },
  paymentSection: {
    padding: 16,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default OrderDetailsScreen; 