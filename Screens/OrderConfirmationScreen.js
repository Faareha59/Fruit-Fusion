import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OrderConfirmationScreen = ({ route, navigation }) => {
  const { orderId, orderData } = route.params;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Ensure we have items to display
  const orderItems = orderData.items || [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.successIconContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={60} color="#FFFFFF" />
          </View>
        </View>
        
        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.message}>
          Your order has been received and is being processed. You will receive updates on your order status.
        </Text>
        
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Order ID:</Text>
          <Text style={styles.orderId}>{orderId}</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time:</Text>
            <Text style={styles.detailValue}>{formatDate(orderData.createdAt)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>{orderData.paymentMethod}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Address:</Text>
            <Text style={styles.detailValue}>{orderData.deliveryAddress}</Text>
          </View>
          
          <View style={styles.productsContainer}>
            <Text style={styles.productsTitle}>Items Ordered</Text>
            
            {orderItems.map((item) => (
              <View key={item.id} style={styles.productItem}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productQuantity}>x{item.quantity}</Text>
                </View>
                <Text style={styles.productPrice}>Rs. {item.price * item.quantity}</Text>
              </View>
            ))}
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>Rs. {orderData.subtotal}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>Rs. {orderData.deliveryFee}</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Rs. {orderData.totalAmount}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.orderStatusContainer}>
          <Text style={styles.orderStatusTitle}>Order Status</Text>
          <View style={styles.statusSteps}>
            <View style={[styles.statusStep, styles.activeStatusStep]}>
              <View style={[styles.statusDot, styles.activeStatusDot]}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.statusText, styles.activeStatusText]}>Order Placed</Text>
            </View>
            
            <View style={[styles.statusLine, styles.inactiveStatusLine]} />
            
            <View style={[styles.statusStep, styles.inactiveStatusStep]}>
              <View style={[styles.statusDot, styles.inactiveStatusDot]} />
              <Text style={[styles.statusText, styles.inactiveStatusText]}>Processing</Text>
            </View>
            
            <View style={[styles.statusLine, styles.inactiveStatusLine]} />
            
            <View style={[styles.statusStep, styles.inactiveStatusStep]}>
              <View style={[styles.statusDot, styles.inactiveStatusDot]} />
              <Text style={[styles.statusText, styles.inactiveStatusText]}>On the Way</Text>
            </View>
            
            <View style={[styles.statusLine, styles.inactiveStatusLine]} />
            
            <View style={[styles.statusStep, styles.inactiveStatusStep]}>
              <View style={[styles.statusDot, styles.inactiveStatusDot]} />
              <Text style={[styles.statusText, styles.inactiveStatusText]}>Delivered</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => navigation.navigate('UserDashboard')}
        >
          <Text style={styles.continueButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  successIconContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 24,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  orderIdContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  orderIdLabel: {
    fontSize: 16,
    color: '#666666',
    marginRight: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF7E1E',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  productsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 2,
  },
  productQuantity: {
    fontSize: 12,
    color: '#777777',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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
  orderStatusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderStatusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  statusSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusStep: {
    alignItems: 'center',
    width: 70,
  },
  activeStatusStep: {},
  inactiveStatusStep: {},
  statusDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeStatusDot: {
    backgroundColor: '#4CAF50',
  },
  inactiveStatusDot: {
    backgroundColor: '#DDDDDD',
  },
  statusLine: {
    height: 2,
    width: 30,
  },
  activeStatusLine: {
    backgroundColor: '#4CAF50',
  },
  inactiveStatusLine: {
    backgroundColor: '#DDDDDD',
  },
  statusText: {
    fontSize: 12,
    textAlign: 'center',
  },
  activeStatusText: {
    color: '#333333',
    fontWeight: 'bold',
  },
  inactiveStatusText: {
    color: '#888888',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  continueButton: {
    backgroundColor: '#FF7E1E',
    borderRadius: 24,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderConfirmationScreen;
