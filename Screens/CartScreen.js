import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCartItems();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [cartItems]);

  const loadCartItems = async () => {
    try {
      setIsLoading(true);
      const basketString = await AsyncStorage.getItem('basket');
      if (basketString) {
        const basket = JSON.parse(basketString);
        setCartItems(basket);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
      Alert.alert('Error', 'Could not load your cart items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(totalPrice);
  };

  const handleQuantityChange = async (id, newQuantity) => {
    if (newQuantity < 1) {
      return handleRemoveItem(id);
    }

    try {
      const updatedCart = cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      
      setCartItems(updatedCart);
      await AsyncStorage.setItem('basket', JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Could not update quantity. Please try again.');
    }
  };

  const handleRemoveItem = async (id) => {
    console.log('Delete button pressed for item id:', id);
 
    try {
      const updatedCart = cartItems.filter(item => item.id !== id);
     
      setCartItems(updatedCart);
  
      await AsyncStorage.setItem('basket', JSON.stringify(updatedCart));
      
      console.log('Item removed successfully');

      setTimeout(() => calculateTotal(), 100);
      
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Could not remove the item. Please try again.');
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add some items to your cart first.');
      return;
    }
    
    navigation.navigate('CheckoutScreen', {
      products: cartItems,
      total: total
    });
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.itemImage}
        onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
      />
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>Rs. {item.price}</Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
          >
            <Ionicons name="remove" size={18} color="#333333" />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
          >
            <Ionicons name="add" size={18} color="#333333" />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.id)}
      >
        <Ionicons name="trash-outline" size={22} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7E1E" />
          <Text style={styles.loadingText}>Loading your cart...</Text>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#CCCCCC" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>Add some delicious fruit salads!</Text>
          
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate('UserDashboard')}
          >
            <Text style={styles.shopButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.cartList}
          />
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>Rs. {total}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>Rs. 50</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Rs. {total + 50}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#FF7E1E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartList: {
    paddingVertical: 16,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    color: '#FF7E1E',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 12,
  },
  removeButton: {
    padding: 12,
    backgroundColor: '#FFF1F0',
    borderRadius: 30,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
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
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF7E1E',
  },
  checkoutButton: {
    backgroundColor: '#FF7E1E',
    borderRadius: 24,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartScreen;
