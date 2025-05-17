import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Image, 
  ActivityIndicator,
  StatusBar,
  Platform,
  TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { 
  getAllProducts, 
  subscribeToProducts, 
  deleteProduct,
  BASE_URL
} from '../services/firebaseService';

const ManageProductsScreen = ({ navigation, route }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load products on mount and when screen comes into focus
  useEffect(() => {
    checkAdminAuth();
    loadProducts();
  }, []);

  // Handle refresh parameter from navigation
  useEffect(() => {
    if (route.params?.refresh) {
      loadProducts();
      // Clear the refresh parameter
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params?.refresh]);

  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
      return () => {};
    }, [])
  );

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

  const loadProducts = async () => {
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      console.log('Setting up Firebase subscription for products');
      // Subscribe to real-time updates
      const unsubscribe = subscribeToProducts((updatedProducts) => {
        console.log(`Received ${updatedProducts.length} products from Firebase`);
        setProducts(updatedProducts);
        setFilteredProducts(updatedProducts);
        setIsLoading(false);
      });

     
      return () => {
        console.log('Cleaning up Firebase subscription');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up Firebase subscription:', error);
      setErrorMessage('Failed to connect to database. Please try again.');
      setIsLoading(false);

      // Try to load products once if subscription fails
      try {
        const fetchedProducts = await getAllProducts();
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
      } catch (secondError) {
        console.error('Fallback fetch failed:', secondError);
      }
    }
  };

  useEffect(() => {
    // Filter products based on search query
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = products.filter(product => 
        product.name?.toLowerCase().includes(lowercaseQuery) || 
        product.category?.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleDeleteProduct = async (productId) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(productId);
              // No need to update state manually as we have a subscription
              Alert.alert('Success! 🎉', 'Product has been deleted successfully!');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product. Please check your connection.\nError: ' + (error.response?.data?.error || error.message));
            }
          }
        }
      ]
    );
  };

  const handleEditProduct = (product) => {
    if (product && product.id) {
      navigation.navigate("EditProduct", { productId: product.id });
    } else {
      Alert.alert("Error", "Product ID is missing. Cannot edit this product.");
    }
  };

  const handleAddProduct = () => {
    navigation.navigate("AddProduct");
  };

  const renderProductItem = ({ item }) => {
    const categoryColor = item.categoryColor || "#FF7E1E";
    
    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>{item.category || "Uncategorized"}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditProduct(item)}
            >
              <Ionicons name="pencil" size={18} color="#2196F3" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteProduct(item.id)}
            >
              <Ionicons name="trash" size={18} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.productContent}>
          {item.image && typeof item.image === 'string' ? (
            <Image 
              source={{ uri: item.image }} 
              style={styles.productImage}
              defaultSource={require('../assets/images/icon.png')}
              onError={() => console.log(`Failed to load image: ${item.image}`)}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={30} color="#CCCCCC" />
            </View>
          )}
          
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productCategory}>{item.category}</Text>
            <Text style={styles.productPrice}>Rs {(item.price || 0).toLocaleString()}</Text>
            <Text 
              style={styles.productDescription} 
              numberOfLines={2}
            >
              {item.description || "No description available"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="basket-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>No products found</Text>
      <Text style={styles.emptySubText}>
        {searchQuery ? "Try a different search term" : "Add your first product"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FF7E1E" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#27214D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Products</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddProduct}
        >
          <Ionicons name="add" size={24} color="#27214D" />
        </TouchableOpacity>
      </View>
      
      {/* Error Message */}
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#fff" />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}
      
      {/* Search Container */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity 
            style={styles.clearSearch}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Product List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7E1E" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyList}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAddProduct}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27214D",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  errorBanner: {
    backgroundColor: "#FF9800",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 8,
  },
  errorBannerText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#27214D",
    marginTop: 16,
  },
  productList: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F3F3",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  productContent: {
    flexDirection: "row",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#27214D",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: "#666666",
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF7E1E",
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: "#666666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
  },
  emptySubText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 16,
  },
  clearSearch: {
    padding: 5,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF7E1E",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default ManageProductsScreen;
