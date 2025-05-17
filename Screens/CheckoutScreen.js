import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../firebase/config';
import { ref, push, set } from 'firebase/database';
import { addOrderWithValidation } from '../services/firebaseService';

const CheckoutScreen = ({ route, navigation }) => {
  const { products, total } = route.params;
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userInfo = JSON.parse(userDataString);
        setUserData(userInfo);
        if (userInfo.name) setName(userInfo.name);
        if (userInfo.phone) setPhone(userInfo.phone);
        if (userInfo.address) setAddress(userInfo.address);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const validateFields = () => {
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter your name.');
      return false;
    }

    const phoneRegex = /^(03[0-9]{9})$/;
    if (!phone.trim() || !phoneRegex.test(phone.trim())) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid Pakistani phone number (03xxxxxxxxx).');
      return false;
    }
    
    if (!address.trim()) {
      Alert.alert('Missing Information', 'Please enter your delivery address.');
      return false;
    }
    
    const addressLower = address.toLowerCase();
    if (!addressLower.includes('islamabad') || !addressLower.includes('pakistan')) {
      Alert.alert('Invalid Address', 'We only deliver to Islamabad, Pakistan. Please update your address.');
      return false;
    }
    
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateFields()) return;

    if (paymentMethod !== 'Cash on Delivery') {
      setPaymentMethod('Cash on Delivery');
      Alert.alert('Payment Method', 'Only Cash on Delivery is available. Your order will be processed with Cash on Delivery.');
    }
    
    setIsLoading(true);
    
    try {
      const orderData = {
        userId: userData?.id || 'guest',
        customerName: name,
        customerPhone: phone,
        deliveryAddress: address,
        items: products, 
        subtotal: total,
        deliveryFee: 50,
        totalAmount: total + 50, 
        paymentMethod: 'Cash on Delivery', 
        status: 'Pending',
        createdAt: new Date().toISOString()
      };
  
      const result = await addOrderWithValidation(orderData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save order');
      }
 
      await AsyncStorage.setItem('basket', JSON.stringify([]));
 
      await AsyncStorage.setItem('orderJustPlaced', 'true');

      navigation.navigate('OrderConfirmation', { 
        orderId: result.id,
        orderData: result.data
      });
      
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(
        'Order Failed',
        'There was an error placing your order. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getValidatedTotal = () => {
    return products.reduce((sum, product) => {
      const price = isNaN(Number(product.price)) ? 0 : Number(product.price);
      const quantity = isNaN(Number(product.quantity)) ? 0 : Number(product.quantity);
      return sum + (price * quantity);
    }, 0);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number (03xxxxxxxxx)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={11}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Delivery Address</Text>
            <TextInput
              style={[styles.input, styles.addressInput]}
              placeholder="Enter your complete address in Islamabad, Pakistan"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method (Cash on Delivery Only)</Text>
          
          <TouchableOpacity 
            style={[
              styles.paymentOption,
              paymentMethod === 'Cash on Delivery' && styles.selectedPaymentOption
            ]}
            onPress={() => setPaymentMethod('Cash on Delivery')}
          >
            <View style={styles.paymentIconContainer}>
              <Ionicons name="cash-outline" size={24} color="#FF7E1E" />
            </View>
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentTitle}>Cash on Delivery</Text>
              <Text style={styles.paymentDescription}>Pay when your order arrives</Text>
            </View>
            {paymentMethod === 'Cash on Delivery' && (
              <Ionicons name="checkmark-circle" size={24} color="#FF7E1E" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.paymentOption,
              { opacity: 0.5 },
              paymentMethod === 'Card Payment' && styles.selectedPaymentOption
            ]}
            onPress={() => Alert.alert('Only Cash on Delivery', 'Currently, we only support Cash on Delivery.')}
          >
            <View style={styles.paymentIconContainer}>
              <Ionicons name="card-outline" size={24} color="#FF7E1E" />
            </View>
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentTitle}>Card Payment</Text>
              <Text style={styles.paymentDescription}>Currently unavailable</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          <View style={styles.orderSummary}>
            {products.map(product => {
              const itemPrice = isNaN(Number(product.price)) ? 0 : Number(product.price);
              const itemQuantity = isNaN(Number(product.quantity)) ? 0 : Number(product.quantity);
              const itemTotal = itemPrice * itemQuantity;
              
              return (
                <View key={product.id} style={styles.orderItem}>
                  <Text style={styles.orderItemName}>{product.name} x{itemQuantity}</Text>
                  <Text style={styles.orderItemPrice}>Rs. {itemTotal}</Text>
                </View>
              );
            })}
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>Rs. {getValidatedTotal()}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>Rs. 50</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Rs. {getValidatedTotal() + 50}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.placeOrderButton}
          onPress={handlePlaceOrder}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.placeOrderButtonText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  addressInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedPaymentOption: {
    borderColor: '#FF7E1E',
    backgroundColor: 'rgba(255, 126, 30, 0.05)',
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 126, 30, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  paymentDescription: {
    fontSize: 14,
    color: '#777777',
  },
  orderSummary: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 14,
    color: '#333333',
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
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
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  placeOrderButton: {
    backgroundColor: '#FF7E1E',
    borderRadius: 24,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;
