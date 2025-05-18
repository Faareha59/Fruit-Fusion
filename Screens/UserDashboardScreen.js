import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  FlatList, 
  Image, 
  ActivityIndicator,
  RefreshControl,
  SafeAreaView, 
  StatusBar,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllProducts } from '../firebase/db-service';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width / 2) - 24; // Calculate card width based on screen size

const UserDashboardScreen = ({ navigation, route }) => {
  const { firstName } = route.params || { firstName: "User" };
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [categories, setCategories] = useState(['Recommended', 'Popular', 'New', 'Top']);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Menu dropdown state
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // Load products from Firebase and cart count when component mounts  
  useEffect(() => {
    console.log('Loading products from Firebase...');
    loadProducts();
    loadCartCount();
  }, []);

  // Filter products based on search query and selected category (optimized with useCallback)
  const filterProducts = useCallback(() => {
    if (allProducts.length > 0) {
      let filtered = [...allProducts];
      
      // Apply search query filter
      if (searchQuery.trim() !== '') {
        filtered = filtered.filter(product => 
          product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply category filter if a category is selected
      if (selectedCategory !== '') {
        filtered = filtered.filter(product => 
          (product.category || 'Other') === selectedCategory
        );
      }
      
      setFilteredProducts(filtered);
    }
  }, [searchQuery, selectedCategory, allProducts]);

  // Apply filters when dependencies change
  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  // Reset search and filters
  const resetAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('');
    setIsFilterModalVisible(false);
    setFilteredProducts(allProducts);
  }, [allProducts]);

  // Load products from Firebase
  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await getAllProducts();
      if (result.success) {
        console.log(`Loaded ${result.data.length} products from Firebase`);
        setAllProducts(result.data);
        setFilteredProducts(result.data);
      } else {
        console.error("Error loading products:", result.error);
        Alert.alert("Error", "Failed to load products");
      }
    } catch (error) {
      console.error("Error loading products:", error);
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error("Error adding to basket:", error);
      Alert.alert("Error", "Failed to add item to basket");
    }
  };

  // Reset all filters
  const resetFilters = () => {
    resetAllFilters();
  };

  // Handle filter selection
  const applyFilter = (category) => {
    setSelectedCategory(category);
    setIsFilterModalVisible(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Reset search and filters on refresh
    resetAllFilters();
    loadProducts()
      .finally(() => {
        setRefreshing(false);
      });
  };

  // Toggle menu visibility
  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Clear user data from AsyncStorage
      await AsyncStorage.removeItem('userData');
      
      // Close menu
      setIsMenuVisible(false);
      
      // Navigate to Login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to log out");
    }
  };

  // Toggle search bar
  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      // Reset search when closing
      setSearchQuery('');
    } else {
      // Focus search when opening
    setTimeout(() => {
        if (searchInput && searchInput.current) {
          searchInput.current.focus();
        }
      }, 100);
    }
  };

  // Search input ref for auto focus
  const searchInput = React.useRef(null);

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
    >
      <View style={styles.imageWrapper}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.productImage}
            onError={(e) => {
              console.log('Image loading error:', (item.image || 'no image url'));
            }}
            defaultSource={require('../assets/images/kisspng-fruit-basket-clip-art-5aed5301d44408 1.png')}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>📚</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name || 'Unnamed Product'}</Text>
        <View style={styles.priceActionRow}>
          <Text style={styles.productPrice}>Rs. {item.price || '0'}</Text>
          <TouchableOpacity 
            style={styles.addToCartBtn}
            onPress={(e) => {
              e.stopPropagation();
              addToCart(item);
            }}
          >
            <Text style={styles.addToCartBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategorySection = (category) => {
    // For products without a category, assign them to "Other"
    const categoryProducts = allProducts.filter(product => 
      (product.category || 'Other') === category
    );
    
    if (categoryProducts.length === 0) return null;

    return (
      <View style={styles.categorySection} key={category}>
        <Text style={styles.categoryTitle}>{category} Combo</Text>
        <FlatList
          data={categoryProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalProductList}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          decelerationRate="fast"
          snapToAlignment="start"
        />
      </View>
    );
  };

  // Render search results grid
  const renderSearchResults = () => {
    if (filteredProducts.length === 0) {
      return (
        <View style={styles.emptySearchContainer}>
          <Text style={styles.emptyText}>No fruit salads found</Text>
          <Text style={styles.emptySubtext}>
            Try a different search term or reset filters
          </Text>
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={resetFilters}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.searchResultsGrid}
        showsVerticalScrollIndicator={true}
        columnWrapperStyle={styles.columnWrapper}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFA451"
          />
        }
      />
    );
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Recommended':
        return '#FFA451';
      case 'Popular':
        return '#34C759';
      case 'New':
        return '#8E24AA';
      case 'Top':
        return '#3F51B5';
      default:
        return '#CCCCCC';
    }
  };

  // Group products by category
  useEffect(() => {
    if (allProducts.length > 0) {
      // Extract unique categories from products
      const uniqueCategories = [...new Set(allProducts.map(product => 
        product.category || 'Other'
      ))];
      setCategories(uniqueCategories);
    }
  }, [allProducts]);

  // Render filter modal
  const renderFilterModal = () => (
    <Modal
      transparent={true}
      visible={isFilterModalVisible}
      animationType="slide"
      onRequestClose={() => setIsFilterModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={0.9}
        onPress={() => setIsFilterModalVisible(false)}
      >
        <View 
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter by Category</Text>
            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={['', ...categories]}
            keyExtractor={item => item || 'all'}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryFilterItem,
                  selectedCategory === item && styles.selectedCategoryItem
                ]}
                onPress={() => applyFilter(item)}
              >
                <Text style={styles.categoryFilterText}>
                  {item === '' ? 'All Categories' : item}
                </Text>
                {selectedCategory === item && (
                  <Text style={styles.checkIcon}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.filterListContent}
          />

          <TouchableOpacity 
            style={styles.resetFilterButton}
            onPress={resetFilters}
          >
            <Text style={styles.resetFilterButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA451" />
          <Text style={styles.loadingText}>Loading Products...</Text>
        </View>
      ) : (
        <TouchableWithoutFeedback onPress={() => isMenuVisible && setIsMenuVisible(false)}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.menuContainer}>
                <TouchableOpacity onPress={toggleMenu}>
                  <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
                
                {isMenuVisible && (
                  <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                    <View style={styles.menuDropdown}>
                      <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => {
                          setIsMenuVisible(false);
                          navigation.navigate('OrderList', { selectedTab: 'orders' });
                        }}
                      >
                        <Text style={styles.menuItemText}>My Orders</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={handleLogout}
                      >
                        <Text style={styles.menuItemText}>Logout</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableWithoutFeedback>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.cartButton}
                onPress={() => navigation.navigate('Cart')}
              >
                <Text style={styles.headerButtonText}>🛒</Text>
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount}</Text>
                  </View>
                )}
                <Text style={styles.cartLabel}>My Basket</Text>
              </TouchableOpacity>
            </View>

            {/* Welcome Text */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>
                Hello
              </Text>
              <Text style={styles.welcomeQuestion}>
                Welcome to Fruit Fusion
              </Text>
            </View>

            {/* Search bar */}
            <View style={styles.searchBarContainer}>
              <View style={styles.searchIconContainer}>
                <Text style={styles.searchIcon}>🍎</Text>
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Search here"
                value={searchQuery}
                onChangeText={setSearchQuery}
                ref={searchInput}
              />
              <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterModalVisible(true)}>
                <Text style={styles.filterIcon}>☰</Text>
              </TouchableOpacity>
            </View>
            
            {/* Category filter indicator */}
            {selectedCategory && (
              <View style={styles.activeFilterContainer}>
                <View style={styles.activeFilterBadge}>
                  <Text style={styles.activeFilterBadgeText}>🔢</Text>
                </View>
                <Text style={styles.activeFilterText}>
                  Category: {selectedCategory}
                </Text>
                <TouchableOpacity onPress={resetFilters} style={styles.clearFilterButton}>
                  <Text style={styles.clearFilterText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Main content */}
            {(searchQuery || selectedCategory) ? (
              <View style={styles.searchResultsContainer}>
                {renderSearchResults()}
              </View>
            ) : (
              <ScrollView
                style={styles.scrollViewContainer}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#FFA451"
                  />
                }
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {allProducts.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No products available</Text>
                    <Text style={styles.emptySubtext}>
                      Check back later for fresh fruits!
                    </Text>
                  </View>
                ) : (
                  <>
                    {categories.map(category => renderCategorySection(category))}
                  </>
                )}
              </ScrollView>
            )}

            {/* Filter Modal */}
            {renderFilterModal()}
          </View>
        </TouchableWithoutFeedback>
      )}
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
    backgroundColor: '#F9F9F9',
  },
  scrollContent: {
    paddingVertical: 16,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  menuContainer: {
    position: 'relative',
    zIndex: 100,
  },
  menuIcon: {
    fontSize: 24,
    color: '#333333',
    padding: 4,
  },
  menuDropdown: {
    position: 'absolute',
    top: 40,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 120,
    paddingVertical: 8,
    zIndex: 100,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#27214D',
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 22,
    color: '#FFA451',
  },
  cartBadge: {
    position: 'absolute',
    right: 55,
    top: -8,
    backgroundColor: '#FFA451',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cartLabel: {
    fontSize: 14,
    color: '#27214D',
    marginLeft: 6,
  },
  // Welcome section
  welcomeSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 16,
    color: '#27214D',
    marginBottom: 4,
  },
  welcomeQuestion: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27214D',
  },
  // Search bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    borderRadius: 16,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIconContainer: {
    marginRight: 10,
  },
  searchIcon: {
    fontSize: 16,
    color: '#86869E',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#27214D',
    paddingVertical: 2,
  },
  filterButton: {
    padding: 4,
  },
  filterIcon: {
    fontSize: 16,
    color: '#86869E',
  },
  // Filter indicator
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F2',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 8,
    borderRadius: 10,
  },
  activeFilterBadge: {
    backgroundColor: '#FFA451',
    padding: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  activeFilterBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  activeFilterText: {
    flex: 1,
    fontSize: 14,
    color: '#27214D',
  },
  clearFilterButton: {
    padding: 4,
  },
  clearFilterText: {
    color: '#FFA451',
    fontWeight: '600',
  },
  // Category section
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27214D',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  horizontalProductList: {
    paddingHorizontal: 12,
  },
  // Product card
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 4,
    marginVertical: 6,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    width: CARD_WIDTH,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 100,
    overflow: 'hidden',
    height: CARD_WIDTH,
    width: CARD_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
  },
  productImage: {
    width: '90%',
    height: '90%',
    borderRadius: 100,
    resizeMode: 'contain',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
  },
  placeholderText: {
    fontSize: 36,
    color: '#CCCCCC',
  },
  productInfo: {
    padding: 12,
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27214D',
    textAlign: 'center',
    marginBottom: 8,
  },
  priceActionRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F08626',
  },
  addToCartBtn: {
    backgroundColor: '#FFA451',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  // Search results
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchResultsGrid: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  // Empty states
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27214D',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#86869E',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#FFA451',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#86869E',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27214D',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#86869E',
  },
  filterListContent: {
    paddingVertical: 8,
  },
  categoryFilterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  categoryFilterText: {
    fontSize: 16,
    color: '#27214D',
  },
  selectedCategoryItem: {
    backgroundColor: '#FFF9F2',
  },
  checkIcon: {
    fontSize: 18,
    color: '#FFA451',
    fontWeight: 'bold',
  },
  resetFilterButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginVertical: 8,
    backgroundColor: '#F1F1F1',
    borderRadius: 10,
  },
  resetFilterButtonText: {
    fontSize: 16,
    color: '#27214D',
    fontWeight: '600',
  },
  scrollViewContainer: {
    flex: 1,
  },
});

export default UserDashboardScreen;