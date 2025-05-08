import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
  ScrollView,
  FlatList,
  Modal,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import { subscribeToProductsInRealtimeDb, getProductsFromRealtimeDb } from "../firebase/realtime-db";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const HomeScreen = ({ route, navigation }) => {
  const { firstName } = route.params || { firstName: "User" };
  const [searchText, setSearchText] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [cartCount, setCartCount] = useState(0);
  const [allCombos, setAllCombos] = useState([]);
  const [error, setError] = useState(null);
  
  // Filter categories
  const [filterCategories, setFilterCategories] = useState(["All", "Recommended", "Popular", "New"]);
  
  // Filtered combos based on search and category filter
  const [filteredCombos, setFilteredCombos] = useState([]);
  
  // Load cart count on initial render
  useEffect(() => {
    loadCartCount();
    loadFavorites();
  }, []);
  
  // Reload cart count every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Home screen focused - refreshing cart count and products");
      loadCartCount();
      loadFruitSaladsAndCategories(); // Reload products when screen is focused
      loadFavorites(); // Reload favorites when screen is focused
      return () => {};
    }, [])
  );
  
  // Load fruit salads and categories on component mount
  useEffect(() => {
    loadFruitSaladsAndCategories();
  }, []);

  // Load favorites from AsyncStorage and update allCombos
  const loadFavorites = async () => {
    try {
      const favoritesString = await AsyncStorage.getItem("favorites");
      if (favoritesString) {
        const favorites = JSON.parse(favoritesString);
        console.log(`Loaded ${favorites.length} favorites from AsyncStorage`);
        
        // Update allCombos with favorite status
        setAllCombos(prevCombos => {
          const updatedCombos = prevCombos.map(combo => ({
            ...combo,
            isFavorite: favorites.includes(combo.id)
          }));
          
          // Also update filtered combos to maintain consistency
          setFilteredCombos(prevFiltered => {
            // If filtered combos is empty or matches allCombos, just use the updated allCombos
            if (prevFiltered.length === 0 || prevFiltered.length === prevCombos.length) {
              return updatedCombos;
            }
            
            // Otherwise update just the filtered items
            return prevFiltered.map(combo => ({
              ...combo,
              isFavorite: favorites.includes(combo.id)
            }));
          });
          
          return updatedCombos;
        });
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  // Load cart count from AsyncStorage
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
  
  // Load fruit salads and categories from Realtime DB with Firestore fallback
  const loadFruitSaladsAndCategories = async () => {
    try {
      setError(null);
      console.log("Starting to load products from Firebase...");
      
      let productsLoaded = false;
      
      // First, try a direct query to check what's in the database
      try {
        console.log("Direct check of Realtime DB products...");
        const directProducts = await getProductsFromRealtimeDb();
        console.log(`Found ${directProducts.length} products via direct query in Realtime DB`);
        
        if (directProducts.length > 0) {
          // Filter out products with isVisible set to false
          const visibleProducts = directProducts.filter(product => product.isVisible !== false);
          console.log(`Found ${visibleProducts.length} visible products out of ${directProducts.length} total`);
          
          // Log product details for debugging
          visibleProducts.forEach(product => {
            console.log(`Direct query product: ${product.id} - ${product.name} (${product.category})`);
          });
          
          // If we found products directly, update the state
          setAllCombos(visibleProducts);
          productsLoaded = true;
          
          // Also update AsyncStorage for offline access
          try {
            await AsyncStorage.setItem("fruitSalads", JSON.stringify(visibleProducts));
            console.log("Updated AsyncStorage with current products from Realtime DB");
          } catch (storageError) {
            console.error("Error updating AsyncStorage with products:", storageError);
          }
          
          // Load favorites to update UI state
          await loadFavorites();
          
          // Set up real-time listener for future updates
          setupRealtimeProductListener();
          
          return;
        }
      } catch (directError) {
        console.error("Error during direct product check:", directError);
      }
      
      if (!productsLoaded) {
        // If no products in Realtime DB, try Firestore
        try {
          console.log("Checking Firestore for products...");
          const querySnapshot = await getDocs(collection(db, 'products'));
          
          if (!querySnapshot.empty) {
            const firestoreProducts = [];
            querySnapshot.forEach(doc => {
              const product = { id: doc.id, ...doc.data() };
              // Only include visible products
              if (product.isVisible !== false) {
                console.log(`Found Firestore product: ${product.id} - ${product.name || "unnamed"}`);
                firestoreProducts.push(product);
              }
            });
            
            console.log(`Found ${firestoreProducts.length} visible products in Firestore`);
            setAllCombos(firestoreProducts);
            
            // Update AsyncStorage for offline access
            try {
              await AsyncStorage.setItem("fruitSalads", JSON.stringify(firestoreProducts));
              console.log("Updated AsyncStorage with current products from Firestore");
            } catch (storageError) {
              console.error("Error updating AsyncStorage with products:", storageError);
            }
            
            // Load favorites to update UI state
            await loadFavorites();
            productsLoaded = true;
            
            // Set up real-time listener for future updates
            setupRealtimeProductListener();
            
            return;
          } else {
            console.log("No products found in Firestore either");
          }
        } catch (firestoreError) {
          console.error("Error fetching from Firestore:", firestoreError);
        }
      }
      
      // If we still haven't loaded products, try AsyncStorage as last resort
      if (!productsLoaded) {
        try {
          const storedProductsString = await AsyncStorage.getItem("fruitSalads");
          if (storedProductsString) {
            const storedProducts = JSON.parse(storedProductsString);
            console.log(`Loaded ${storedProducts.length} products from AsyncStorage`);
            
            // Only show visible products
            const visibleProducts = storedProducts.filter(product => product.isVisible !== false);
            setAllCombos(visibleProducts);
            
            // Load favorites to update UI state
            await loadFavorites();
            
            // Set up real-time listener for future updates
            setupRealtimeProductListener();
            
            return;
          }
        } catch (asyncStorageError) {
          console.error("Error loading products from AsyncStorage:", asyncStorageError);
        }
      }
      
      // If we get here, we couldn't load products from anywhere
      console.log("No products could be loaded from any source");
      setAllCombos([]);
      setError("No products available. Please check your connection.");
      
      // Still set up the real-time listener for when products become available
      setupRealtimeProductListener();
    } catch (error) {
      console.error("Error in loadFruitSaladsAndCategories:", error);
      setError("Failed to load products. Please try again.");
      setAllCombos([]);
    }
  };
  
  // Helper function to set up real-time product listener
  const setupRealtimeProductListener = () => {
    try {
      console.log("Setting up Realtime DB subscription for products...");
      const unsubscribe = subscribeToProductsInRealtimeDb(
        async (products) => {
          console.log(`Products loaded from Realtime DB subscription: ${products?.length || 0}`);
          
          if (products && products.length > 0) {
            // Filter out products with isVisible set to false
            const visibleProducts = products.filter(product => product.isVisible !== false);
            console.log(`Found ${visibleProducts.length} visible products out of ${products.length} total`);
            
            // Log each product for debugging
            visibleProducts.forEach(product => {
              console.log(`Subscription product: ${product.id.substring(0, 8)} - ${product.name || 'unnamed'}`);
            });
            
            // Update the state with the loaded products
            console.log("Updating UI with products from Realtime DB");
            setAllCombos(visibleProducts);
            
            // Update AsyncStorage for offline access
            try {
              await AsyncStorage.setItem("fruitSalads", JSON.stringify(visibleProducts));
              console.log("Updated AsyncStorage with current products from real-time update");
            } catch (storageError) {
              console.error("Error updating AsyncStorage with products:", storageError);
            }
            
            // Load favorites to update UI state
            await loadFavorites();
            
            // Always use our fixed filter categories
            setFilterCategories(["All", "Recommended", "Popular", "New"]);
          }
        },
        (error) => {
          console.error("Realtime DB subscription error:", error);
        }
      );
      
      // Return unsubscribe function to clean up the listener
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up real-time product listener:", error);
      return () => {};
    }
  };
  
  // Watch for changes to allCombos and update filtered results
  useEffect(() => {
    filterCombos();
  }, [allCombos, searchText, selectedFilter]);
  
  // Apply filters to the combos
  const filterCombos = () => {
    let filtered = [...allCombos];
    
    // Apply search filter
    if (searchText.trim() !== "") {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedFilter !== "All") {
      filtered = filtered.filter(item => 
        item.category === selectedFilter
      );
    }
    
    setFilteredCombos(filtered);
  };
  
  const toggleFavorite = async (id) => {
    try {
      // Get existing favorites from AsyncStorage
      const favoritesString = await AsyncStorage.getItem("favorites");
      let favorites = favoritesString ? JSON.parse(favoritesString) : [];
      
      // Check if item is already a favorite
      const isCurrentlyFavorite = favorites.includes(id);
      
      // Toggle favorite status
      if (isCurrentlyFavorite) {
        // Remove from favorites
        favorites = favorites.filter(favoriteId => favoriteId !== id);
      } else {
        // Add to favorites
        favorites.push(id);
      }
      
      // Save updated favorites to AsyncStorage
      await AsyncStorage.setItem("favorites", JSON.stringify(favorites));
      
      // Update the local state to reflect changes immediately
      setAllCombos(prevCombos => {
        // Create a new array with updated favorite status
        const updatedCombos = prevCombos.map(combo => 
          combo.id === id ? { ...combo, isFavorite: !isCurrentlyFavorite } : combo
        );
        
        // Also update filteredCombos to ensure UI consistency
        setFilteredCombos(prevFiltered => 
          prevFiltered.map(combo => 
            combo.id === id ? { ...combo, isFavorite: !isCurrentlyFavorite } : combo
          )
        );
        
        return updatedCombos;
      });
      
      console.log(`Product ${id} ${!isCurrentlyFavorite ? 'added to' : 'removed from'} favorites`);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to update favorite status");
    }
  };
  
  const handleAddToBasket = (item) => {
    navigation.navigate("AddToBasket", { item });
  };

  // Add item to cart with quantity 1
  const addToCart = async (item) => {
    try {
      // Get existing basket
      const basketString = await AsyncStorage.getItem("basket");
      let basket = basketString ? JSON.parse(basketString) : [];
      
      // Check if item already exists in basket
      const existingItemIndex = basket.findIndex(i => i.id === item.id);
      
      if (existingItemIndex !== -1) {
        // Update quantity if item already exists
        basket[existingItemIndex].quantity += 1;
      } else {
        // Add new item to basket
        basket.push({
          ...item,
          quantity: 1
        });
      }
      
      // Save updated basket and update cart count
      await AsyncStorage.setItem("basket", JSON.stringify(basket));
      setCartCount(basket.reduce((sum, item) => sum + item.quantity, 0));
      
      // Show feedback to user
      Alert.alert("Success", `${item.name} added to basket`);
    } catch (error) {
      console.error("Error adding to basket:", error);
      Alert.alert("Error", "Failed to add item to basket");
    }
  };
  
  // Get recommended combos
  const recommendedCombos = filteredCombos.filter(item => item.category === "Recommended");
  
  // Get other combos (non-recommended)
  const otherCombos = filteredCombos.filter(item => item.category !== "Recommended");

  // Render empty state when no results are found
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Image 
        source={require("../assets/images/kisspng-fruit-basket-clip-art-5aed5301d44408 1.png")} 
        style={styles.emptyStateImage}
      />
      <Text style={styles.emptyStateTitle}>No Products Available</Text>
      <Text style={styles.emptyStateText}>
        There are currently no products in the store.
        {searchText ? 
          ` No products match "${searchText}"${selectedFilter !== "All" ? ` in ${selectedFilter}` : ""}.` :
          " Check back later for delicious fruit salads!"}
      </Text>
    </View>
  );

  // Render a single recommended combo item
  const renderRecommendedItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recommendedItem}
      onPress={() => navigation.navigate("AddToBasket", { item })}
    >
      <View style={styles.recommendedImageContainer}>
        {renderProductImage(item)}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.id)}
        >
          <Ionicons
            name={item.isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={item.isFavorite ? "#FF7E1E" : "#ABABAB"}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.recommendedName} numberOfLines={1}>
        {item.name || 'Unnamed Product'}
      </Text>
      <Text style={styles.recommendedPrice}>
        Rs {formatPrice(item.price || 0)}
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addToCart(item)}
      >
        <Ionicons name="add" size={20} color="#FFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Handle different types of image data in products
  const renderProductImage = (item) => {
    // Handle different types of image data
    if (!item.image) {
      // Fallback image if no image is available
      return (
        <Image
          source={require("../assets/images/kisspng-fruit-basket-clip-art-5aed5301d44408 1.png")}
          style={styles.recommendedImage}
          resizeMode="cover"
        />
      );
    }
    
    // Handle string URI
    if (typeof item.image === "string") {
      return (
        <Image
          source={{ uri: item.image }}
          style={styles.recommendedImage}
          resizeMode="cover"
          defaultSource={require("../assets/images/kisspng-fruit-basket-clip-art-5aed5301d44408 1.png")}
        />
      );
    }
    
    // Handle object with URI
    if (item.image.uri) {
      return (
        <Image
          source={{ uri: item.image.uri }}
          style={styles.recommendedImage}
          resizeMode="cover"
          defaultSource={require("../assets/images/kisspng-fruit-basket-clip-art-5aed5301d44408 1.png")}
        />
      );
    }
    
    // Handle require'd image
    return (
      <Image
        source={item.image}
        style={styles.recommendedImage}
        resizeMode="cover"
      />
    );
  };

  // Helper function to format price with comma separators
  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Menu items
  const menuItems = [
    { icon: "home-outline", label: "Home", screen: "Home" },
    { icon: "basket-outline", label: "My Orders", screen: "OrderList" },
    { icon: "heart-outline", label: "Favorites", screen: "Favorites" },
    { icon: "log-out-outline", label: "Logout", action: "logout" },
  ];

  // Handle menu item press
  const handleMenuItemPress = (item) => {
    setMenuVisible(false);
    
    if (item.action === "logout") {
      // Handle logout
      Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Logout", 
            onPress: async () => {
              // Clear user data from AsyncStorage
              try {
                await AsyncStorage.removeItem("userData");
                // Redirect to Login instead of Welcome
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } catch (error) {
                console.error("Error during logout:", error);
              }
            } 
          }
        ]
      );
    } else if (item.screen) {
      // Use reset navigation for better reliability
      setTimeout(() => {
        try {
          console.log("Navigating to:", item.screen);
          navigation.navigate(item.screen);
        } catch (error) {
          console.error("Navigation error:", error);
          Alert.alert("Navigation Error", `Could not navigate to ${item.label}. ${error.message}`);
        }
      }, 100);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color="#27214D" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("OrderList")}>
          <View style={styles.cartIconContainer}>
            <Ionicons name="basket-outline" size={24} color="#FFA451" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Greeting */}
      <Text style={styles.greeting}>
        Hello {firstName}, What fruit salad combo do you want today?
      </Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#86869E" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for fruit salad combos"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
          <Ionicons name="options-outline" size={20} color="#27214D" />
        </TouchableOpacity>
      </View>
      
      {/* Filter Indicator */}
      {selectedFilter !== "All" && (
        <View style={styles.filterIndicator}>
          <Text style={styles.filterText}>Filtered by: {selectedFilter}</Text>
          <TouchableOpacity onPress={() => setSelectedFilter("All")}>
            <Ionicons name="close-circle" size={20} color="#27214D" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Show error state if there was an error */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={50} color="#FFA451" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadFruitSaladsAndCategories}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : allCombos.length === 0 ? (
        // Show empty state if no products exist
        renderEmptyState()
      ) : filteredCombos.length === 0 ? (
        // Show empty search results state
        renderEmptyState()
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Recommended Section - only show if we have recommended items */}
          {recommendedCombos.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recommended Combo</Text>
              </View>
              
              {/* Horizontal Scroll for Recommended Combos */}
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={recommendedCombos}
                keyExtractor={item => item.id}
                style={styles.recommendedList}
                renderItem={renderRecommendedItem}
              />
            </>
          )}
          
          {/* Other Combos Section - only show if we have other items */}
          {otherCombos.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedFilter !== "All" ? selectedFilter + " Combos" : "Other Combos"}
                </Text>
              </View>
              
              {/* Grid for Other Combos */}
              <View style={styles.gridContainer}>
                {otherCombos.map(item => (
                  <TouchableOpacity 
                    key={item.id}
                    style={styles.comboCardSmall}
                    onPress={() => handleAddToBasket(item)}
                  >
                    <View style={styles.imageContainerSmall}>
                      <TouchableOpacity 
                        style={styles.favoriteButton}
                        onPress={() => toggleFavorite(item.id)}
                      >
                        <Ionicons 
                          name={item.isFavorite ? "heart" : "heart-outline"} 
                          size={16} 
                          color={item.isFavorite ? "#FFA451" : "#FFFFFF"} 
                        />
                      </TouchableOpacity>
                      
                      {/* Handle different image formats (uri object or string) */}
                      <View style={styles.imageContainerSmall}>
                        {renderProductImage(item)}
                      </View>
                    </View>
                    <Text style={styles.comboName}>{item.name}</Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>Rs {formatPrice(item.price || 0)}</Text>
                      <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => addToCart(item)}
                      >
                        <Text style={styles.addButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
      
      {/* Filter Modal */}
      <Modal
        transparent={true}
        visible={filterModalVisible}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Category</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#27214D" />
              </TouchableOpacity>
            </View>
            
            {filterCategories.map((category, index) => (
              <TouchableOpacity
                key={`category-${index}-${category}`}
                style={[
                  styles.filterOption,
                  selectedFilter === category && styles.filterOptionSelected
                ]}
                onPress={() => {
                  setSelectedFilter(category);
                  setFilterModalVisible(false);
                }}
              >
                <Text 
                  style={[
                    styles.filterOptionText,
                    selectedFilter === category && styles.filterOptionTextSelected
                  ]}
                >
                  {category}
                </Text>
                {selectedFilter === category && (
                  <Ionicons name="checkmark" size={20} color="#FFA451" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
      
      {/* Side Menu */}
      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuContent}>
            <View style={styles.menuHeader}>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Ionicons name="close" size={24} color="#27214D" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.menuUserInfo}>
              <View style={styles.menuAvatar}>
                <Text style={styles.menuAvatarText}>
                  {firstName ? firstName.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
              <Text style={styles.menuUserName}>{firstName}</Text>
            </View>
            
            <View style={styles.menuItems}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(item)}
                >
                  <Ionicons name={item.icon} size={24} color="#27214D" />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.menuFooter}>
              <Text style={styles.menuFooterText}>App Version 1.0.0</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
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
  greeting: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27214D",
    marginBottom: 24,
    width: "80%",
  },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#27214D",
  },
  filterIndicator: {
    flexDirection: "row",
    backgroundColor: "#FFF4E8",
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterText: {
    color: "#FFA451",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
  },
  emptyImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27214D",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#5D577E",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27214D",
  },
  recommendedList: {
    marginBottom: 24,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  comboCard: {
    width: 152,
    marginRight: 16,
    marginBottom: 16,
  },
  comboCardSmall: {
    width: "48%",
    marginBottom: 16,
  },
  imageContainer: {
    height: 152,
    borderRadius: 16,
    backgroundColor: "#FFFAFA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  imageContainerSmall: {
    height: 120,
    borderRadius: 16,
    backgroundColor: "#FFFAFA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  comboImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  comboImageSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  comboName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#27214D",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFA451",
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFA451",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
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
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F1F1",
  },
  filterOptionSelected: {
    backgroundColor: "#FFF4E8",
  },
  filterOptionText: {
    fontSize: 16,
    color: "#27214D",
  },
  filterOptionTextSelected: {
    fontWeight: "bold",
    color: "#FFA451",
  },
  menuContent: {
    width: '80%',
    height: '100%',
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  menuUserInfo: {
    alignItems: "center",
    marginBottom: 40,
  },
  menuAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFA451",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  menuAvatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  menuUserName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27214D",
  },
  menuItems: {
    marginBottom: 40,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F1F1",
  },
  menuItemText: {
    fontSize: 16,
    color: "#27214D",
    marginLeft: 16,
  },
  menuFooter: {
    marginTop: 'auto',
    alignItems: "center",
  },
  menuFooterText: {
    fontSize: 14,
    color: "#86869E",
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFAFA",
    justifyContent: "center",
    alignItems: "center",
  },
  recommendedItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F1F1",
    borderRadius: 8,
  },
  recommendedImageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  recommendedImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  recommendedName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    color: "#27214D",
  },
  recommendedPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFA451",
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFAFA",
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27214D",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: "#5D577E",
  },
  cartButton: {
    position: 'relative',
  },
  banner: {
    backgroundColor: "#FFFAFA",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  bannerTextContainer: {
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#27214D",
  },
  bannerText: {
    fontSize: 16,
    color: "#5D577E",
  },
  bannerImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  filterButton: {
    padding: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27214D",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#5D577E",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#FFA451",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyStateImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27214D",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#5D577E",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});

export default HomeScreen;
