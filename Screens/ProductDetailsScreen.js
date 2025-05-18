import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProductDetailsScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleIncrementQuantity = () => {
    if (quantity < 10) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const addToCart = async () => {
    setIsAddingToCart(true);
    
    try {
      const basketString = await AsyncStorage.getItem('basket');
      const basket = basketString ? JSON.parse(basketString) : [];
  
      const existingItemIndex = basket.findIndex(item => item.id === product.id);
      
      if (existingItemIndex !== -1) {
        basket[existingItemIndex].quantity += quantity;
      } else {
        basket.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: quantity,
          category: product.category
        });
      }
      
      await AsyncStorage.setItem('basket', JSON.stringify(basket));
      
      Alert.alert(
        'Added to Cart',
        `${quantity} ${product.name} added to your cart.`,
        [
          { 
            text: 'Continue Shopping', 
            style: 'cancel',
            onPress: () => navigation.navigate('UserDashboard')
          },
          { 
            text: 'Go to Cart', 
            onPress: () => navigation.navigate('Cart')
          }
        ]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Could not add to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    navigation.navigate('CheckoutScreen', {
      products: [{ ...product, quantity }],
      total: product.price * quantity
    });
  };

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA451" />
        <Text>Loading product details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.imageContainer}>
            {product.image ? (
              <Image
                source={{ uri: product.image }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>🍎</Text>
              </View>
            )}
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.productName}>{product.name}</Text>
            
            <View style={styles.categoryContainer}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{product.category || 'Fruit Salad'}</Text>
              </View>
            </View>
            
            <Text style={styles.price}>Rs. {product.price}</Text>
            
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={handleDecrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                
                <Text style={styles.quantityText}>{quantity}</Text>
                
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={handleIncrementQuantity}
                  disabled={quantity >= 10}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.description}>{product.description || 'A delicious and nutritious fruit salad, perfect for any time of day.'}</Text>
          </View>
        </ScrollView>
        
        <View style={styles.bottomContainer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalAmount}>Rs. {product.price * quantity}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addToCartButton}
            onPress={addToCart}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.addToCartText}>Add to Cart</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 10,
  },
  productImage: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#F9F9FB',
  },
  placeholderContainer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#F9F9FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 80,
    color: '#DDDDDD',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 80,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27214D',
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FFA451',
    borderRadius: 16,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F08626',
    marginBottom: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#F9F9FB',
    padding: 16,
    borderRadius: 10,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#27214D',
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    margin: 5,
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27214D',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#86869E',
    lineHeight: 20,
    marginBottom: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    elevation: 5,
  },
  totalContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#86869E',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F08626',
  },
  addToCartButton: {
    backgroundColor: '#FFA451',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default ProductDetailsScreen;
