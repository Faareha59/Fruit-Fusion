import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';

const AddToBasketScreen = ({ route, navigation }) => {
  const { item } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [existingInCart, setExistingInCart] = useState(false);
  const [existingQuantity, setExistingQuantity] = useState(0);

  useEffect(() => {
    checkFavoriteStatus();
    loadCartCount();
    checkExistingInCart();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log("AddToBasket screen focused - refreshing data");
      checkFavoriteStatus();
      loadCartCount();
      checkExistingInCart();
      return () => {};
    }, [])
  );

  const checkExistingInCart = async () => {
    try {
      const basketString = await AsyncStorage.getItem("basket");
      if (basketString) {
        const basket = JSON.parse(basketString);
        const existingItem = basket.find(i => i.id === item.id);
        if (existingItem) {
          setExistingInCart(true);
          setExistingQuantity(existingItem.quantity);
          setQuantity(existingItem.quantity);
        }
      }
    } catch (error) {
      console.error("Error checking existing cart item:", error);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const favoritesString = await AsyncStorage.getItem("favorites");
      if (favoritesString) {
        const favorites = JSON.parse(favoritesString);
        if (favorites.includes(item.id)) {
          setIsFavorite(true);
        } else {
          setIsFavorite(false);
        }
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };
  const loadCartCount = async () => {
    try {
      const basketString = await AsyncStorage.getItem("basket");
      if (basketString) {
        const basket = JSON.parse(basketString);
        const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalItems);
      }
    } catch (error) {
      console.error("Error loading cart count:", error);
    }
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const toggleFavorite = async () => {
    try {
      const favoritesString = await AsyncStorage.getItem("favorites");
      let favorites = favoritesString ? JSON.parse(favoritesString) : [];
      
      if (isFavorite) {
        favorites = favorites.filter(id => id !== item.id);
      } else {
        if (!favorites.includes(item.id)) {
          favorites.push(item.id);
        }
      }
      
      await AsyncStorage.setItem("favorites", JSON.stringify(favorites));

      setIsFavorite(!isFavorite);
      
      Alert.alert(
        !isFavorite ? "Added to Favorites" : "Removed from Favorites",
        `${item.name} has been ${!isFavorite ? "added to" : "removed from"} your favorites`
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to update favorite status");
    }
  };

  const addToBasket = async () => {
    try {
      const basketString = await AsyncStorage.getItem("basket");
      let basket = basketString ? JSON.parse(basketString) : [];

      const existingItemIndex = basket.findIndex(i => i.id === item.id);
      
      if (existingItemIndex !== -1) {
        basket[existingItemIndex].quantity = quantity;
      } else {
        basket.push({
          ...item,
          quantity
        });
      }
      
      await AsyncStorage.setItem("basket", JSON.stringify(basket));
      
      setCartCount(basket.reduce((sum, item) => sum + item.quantity, 0));
      setExistingInCart(true);
      setExistingQuantity(quantity);
      
      Alert.alert(
        existingInCart ? "Updated in Basket" : "Added to Basket",
        `${quantity} × ${item.name} ${existingInCart ? "updated in" : "added to"} your basket`,
        [
          {
            text: "Continue Shopping",
            onPress: () => navigation.goBack(),
            style: "cancel"
          },
          {
            text: "View Basket",
            onPress: () => navigation.navigate("OrderList")
          }
        ]
      );
    } catch (error) {
      console.error("Error adding to basket:", error);
      Alert.alert("Error", "Failed to add item to basket");
    }
  };

  const removeFromBasket = async () => {
    try {
      const basketString = await AsyncStorage.getItem("basket");
      let basket = basketString ? JSON.parse(basketString) : [];
      
      const updatedBasket = basket.filter(i => i.id !== item.id);
      
      await AsyncStorage.setItem("basket", JSON.stringify(updatedBasket));

      setCartCount(updatedBasket.reduce((sum, item) => sum + item.quantity, 0));
      setExistingInCart(false);
      setExistingQuantity(0);
      setQuantity(1);
 
      Alert.alert(
        "Removed from Basket",
        `${item.name} has been removed from your basket`,
        [
          {
            text: "Continue Shopping",
            onPress: () => navigation.goBack(),
            style: "cancel"
          }
        ]
      );
    } catch (error) {
      console.error("Error removing from basket:", error);
      Alert.alert("Error", "Failed to remove item from basket");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFA451" barStyle="light-content" />
      
      {}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#27214D" />
          <Text style={styles.backText}>Go back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => navigation.navigate("OrderList")}
        >
          <View style={styles.cartIconContainer}>
            <Ionicons name="basket-outline" size={24} color="#27214D" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      {}
      <View style={styles.imageContainer}>
        {typeof item.image === 'string' ? (
          <Image 
            source={{ uri: item.image }} 
            style={styles.productImage} 
            resizeMode="contain"
            defaultSource={require('../assets/images/icon.png')}
          />
        ) : item.image && item.image.uri ? (
          <Image 
            source={{ uri: item.image.uri }} 
            style={styles.productImage} 
            resizeMode="contain"
            defaultSource={require('../assets/images/icon.png')}
          />
        ) : (
          <Image 
            source={item.image || require('../assets/images/icon.png')} 
            style={styles.productImage} 
            resizeMode="contain"
          />
        )}
      </View>
      
      {}
      <ScrollView style={styles.detailsContainer}>
        {}
        <View style={styles.titlePriceContainer}>
          <Text style={styles.productTitle}>{item.name}</Text>
        </View>
        
        {}
        <Text style={styles.price}>Rs {(item.price * quantity).toLocaleString()}</Text>
        
        {}
        <View style={styles.quantityControlContainer}>
          <Text style={styles.quantityControlTitle}>Quantity:</Text>
          <View style={styles.quantityControlButtons}>
            <TouchableOpacity 
              style={styles.quantityControlButton}
              onPress={() => {
                if (quantity > 1) setQuantity(quantity - 1);
              }}
            >
              <Ionicons name="remove" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.quantityControlValue}>{quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityControlButton}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {}
        <Text style={styles.description}>
          {item.description || "No description available for this product.."}
        </Text>

        {}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[
              styles.favoriteButton,
              isFavorite && styles.favoriteButtonActive
            ]}
            onPress={toggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#FFA451" : "#333"}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={addToBasket}
          >
            <Text style={styles.addButtonText}>
              {existingInCart ? "Update basket" : "Add to basket"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {}
        {existingInCart && (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={removeFromBasket}
          >
            <Text style={styles.removeButtonText}>Remove from basket</Text>
          </TouchableOpacity>
        )}
        
        {}
        {existingInCart && (
          <View style={styles.cartStatusContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#5D577E" />
            <Text style={styles.cartStatusText}>
              This item is already in your basket ({existingQuantity} {existingQuantity === 1 ? 'pack' : 'packs'}).
              You can update the quantity or remove it.
            </Text>
          </View>
        )}
        
        {}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFA451",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
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
  cartButton: {
    padding: 4,
  },
  cartIconContainer: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: '#FF8A00',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: "30%",
  },
  productImage: {
    width: 200,
    height: 200,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  titlePriceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#27214D",
    flex: 1,
  },
  quantityControlContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7F5F5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  quantityControlTitle: {
    fontSize: 16,
    color: "#27214D",
    fontWeight: "bold",
  },
  quantityControlButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityControlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFA451",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  quantityControlValue: {
    fontSize: 18,
    color: "#27214D",
    fontWeight: "bold",
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: "center",
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFA451",
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: "#5D577E",
    lineHeight: 24,
    marginBottom: 24,
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  favoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButtonActive: {
    backgroundColor: "#FFF4E8",
    borderColor: "#FFA451",
  },
  addButton: {
    flex: 1,
    backgroundColor: "#FFA451",
    height: 56,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: "#F7F5F5",
    height: 56,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  removeButtonText: {
    color: "#FF5A5A",
    fontSize: 16,
    fontWeight: "600",
  },
  cartStatusContainer: {
    flexDirection: "row",
    backgroundColor: "#F7F5F5",
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  cartStatusText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#5D577E",
    lineHeight: 20,
  },
  bottomSpace: {
    height: 50,
  },
});

export default AddToBasketScreen;
