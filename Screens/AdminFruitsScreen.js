import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  TextInput,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { 
  getAllProducts, 
  deleteProduct, 
  subscribeToProducts,
  database
} from "../services/firebaseService";

const AdminFruitsScreen = ({ navigation }) => {
  const [fruitSalads, setFruitSalads] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFruitSalads, setFilteredFruitSalads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);
  
  useEffect(() => {
    console.log("Setting up real-time product subscription in AdminFruitsScreen");
    const unsubscribe = subscribeToProducts(
      async (products) => {
        if (products && products.length > 0) {
          console.log(`Real-time update: Received ${products.length} products`);
          setFruitSalads(products);
          if (searchQuery.trim() === "") {
            setFilteredFruitSalads(products);
          } else {
            const filtered = products.filter(product => 
              product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredFruitSalads(filtered);
          }
          
          try {
            await AsyncStorage.setItem("fruitSalads", JSON.stringify(products));
            console.log("Updated AsyncStorage with current products from real-time update");
          } catch (error) {
            console.error("Error updating AsyncStorage with products:", error);
          }
        } else {
          console.log("Real-time update: No products available");
          setFruitSalads([]);
          setFilteredFruitSalads([]);

          try {
            await AsyncStorage.removeItem("fruitSalads");
          } catch (error) {
            console.error("Error clearing AsyncStorage products:", error);
          }
        }

        setIsLoading(false);
      },
      (error) => {
        console.error("Error in real-time products subscription:", error);
        loadFruitSalads();
      }
    );

    return () => {
      console.log("Cleaning up real-time product subscription in AdminFruitsScreen");
      if (unsubscribe) unsubscribe();
    };
  }, []);

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

  useFocusEffect(
    React.useCallback(() => {
      if (fruitSalads.length === 0) {
        loadFruitSalads();
      }
      return () => {};
    }, [fruitSalads.length])
  );

  const handleDeleteAllProducts = () => {
    Alert.alert(
      "Delete All Products",
      "Are you sure you want to delete ALL products? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeletingAll(true);

              let deletedCount = 0;
              try {

                const allProducts = await getAllProducts();
                deletedCount = allProducts ? allProducts.length : 0;

                if (allProducts && allProducts.length > 0) {
                  for (const product of allProducts) {
                    await deleteProduct(product.id);
                  }
                  console.log(`Deleted ${deletedCount} products from Realtime DB`);
                } else {
                  console.log("No products to delete");
                }
              } catch (error) {
                console.error("Error deleting from Realtime DB:", error);
              }

              await AsyncStorage.removeItem("fruitSalads");
              await AsyncStorage.removeItem("favorites");
              
              setFruitSalads([]);
              setFilteredFruitSalads([]);
              
              Alert.alert(
                "Success", 
                `All products deleted successfully. ${deletedCount} products removed from the database.`,
                [{ text: "OK" }]
              );
            } catch (error) {
              console.error("Error during delete all:", error);
              Alert.alert("Error", "Failed to delete all products. Please try again.");
            } finally {
              setIsDeletingAll(false);
            }
          }
        }
      ]
    );
  };


  const loadFruitSalads = async () => {
    setIsLoading(true);
    try {
      let productsLoaded = false;
      
      try {
        const realtimeProducts = await getAllProducts();
        
        if (realtimeProducts && realtimeProducts.length > 0) {
          console.log(`Loaded ${realtimeProducts.length} products from Realtime DB`);
          setFruitSalads(realtimeProducts);
          setFilteredFruitSalads(realtimeProducts);
          productsLoaded = true;
          
          await AsyncStorage.setItem("fruitSalads", JSON.stringify(realtimeProducts));
        } else {
          console.log("No products found in Realtime DB");
        }
      } catch (realtimeError) {
        console.error("Error loading products from Realtime DB:", realtimeError);
      }
      
      if (!productsLoaded) {
        console.log("Falling back to AsyncStorage for product data");
        const storedFruitSalads = await AsyncStorage.getItem("fruitSalads");
        if (storedFruitSalads) {
          const parsedFruitSalads = JSON.parse(storedFruitSalads);
          console.log(`Loaded ${parsedFruitSalads.length} products from AsyncStorage`);
          setFruitSalads(parsedFruitSalads);
          setFilteredFruitSalads(parsedFruitSalads);
        } else {
          console.log("No products found in AsyncStorage");
          setFruitSalads([]);
          setFilteredFruitSalads([]);
        }
      }
    } catch (error) {
      console.error("Error loading products:", error);
      Alert.alert("Error", "Failed to load product data. Please try again.");
      setFruitSalads([]);
      setFilteredFruitSalads([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFruitSalad = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this fruit salad?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(`User confirmed deletion of product ${id} at ${new Date().toISOString()}`);

              Alert.alert(
                "Deleting...",
                "Please wait while the product is being deleted.",
                [],
                { cancelable: false }
              );

              try {
                await deleteProduct(id);
                console.log("Product deletion successful");

                loadFruitSalads();

                setTimeout(() => {
                  Alert.alert(
                    "Success", 
                    "Product deleted successfully.",
                    [{ text: "OK" }]
                  );
                }, 500);
                
                return;
              } catch (realtimeError) {
                console.error("Error deleting from Realtime DB:", realtimeError);

                console.log("Falling back to local storage deletion only");

                const updatedFruitSalads = fruitSalads.filter(
                  (fruitSalad) => fruitSalad.id !== id
                );
                setFruitSalads(updatedFruitSalads);
                setFilteredFruitSalads(
                  filteredFruitSalads.filter((fruitSalad) => fruitSalad.id !== id)
                );

                await AsyncStorage.setItem(
                  "fruitSalads",
                  JSON.stringify(updatedFruitSalads)
                );
                
                Alert.alert(
                  "Partial Success", 
                  "Product deleted from local storage only. Changes will not be synchronized with the server."
                );
              }

              try {
                const favoritesString = await AsyncStorage.getItem("favorites");
                if (favoritesString) {
                  const favorites = JSON.parse(favoritesString);
                  const updatedFavorites = favorites.filter(favoriteId => favoriteId !== id);
                  
                  if (favorites.length !== updatedFavorites.length) {
                    await AsyncStorage.setItem("favorites", JSON.stringify(updatedFavorites));
                    console.log(`Removed deleted product ${id} from favorites`);
                  }
                }
              } catch (favoritesError) {
                console.error("Error updating favorites after deletion:", favoritesError);
              }
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert(
                "Error", 
                `Failed to delete product: ${error.message}. Please try again.`
              );
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFruitSalads(fruitSalads);
    } else {
      const filtered = fruitSalads.filter((fruitSalad) =>
        fruitSalad.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFruitSalads(filtered);
    }
  }, [searchQuery, fruitSalads]);

  const renderFruitSaladItem = ({ item }) => (
    <View style={styles.fruitSaladItem}>
      <View style={styles.fruitSaladContent}>
        <View style={styles.imageContainer}>
          <Image
            source={typeof item.image === 'string' ? { uri: item.image } : item.image}
            style={styles.fruitSaladImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.fruitSaladDetails}>
          <Text style={styles.fruitSaladName}>{item.name}</Text>
          <Text style={styles.fruitSaladCategory}>{item.category}</Text>
          <Text style={styles.fruitSaladPrice}>Rs {item.price.toLocaleString()}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate("AdminEditFruitScreen", { product: item })}
        >
          <Ionicons name="create-outline" size={16} color="#FFF" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteFruitSalad(item.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#FFF" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FF7E1E" barStyle="light-content" />
      
      {}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#27214D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Fruit Salads</Text>
        <View style={{ width: 24 }} />
      </View>

      {}
      <View style={styles.dangerZone}>
        <TouchableOpacity 
          style={styles.deleteAllButton}
          onPress={handleDeleteAllProducts}
          disabled={isDeletingAll || isLoading}
        >
          {isDeletingAll ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="trash" size={18} color="#FFF" />
              <Text style={styles.deleteAllButtonText}>Delete All Products</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#5D577E" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search fruit salads..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate("AdminAddFruit")}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      {}
      <FlatList
        data={filteredFruitSalads}
        renderItem={renderFruitSaladItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.fruitSaladsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="nutrition-outline" size={64} color="#C4C4C4" />
            <Text style={styles.emptyText}>
              {isLoading
                ? "Loading fruit salads..."
                : searchQuery.trim() !== ""
                ? "No fruit salads found matching your search."
                : "No fruit salads available. Add some!"}
            </Text>
          </View>
        )}
      />
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
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 10,
    backgroundColor: "#F7F5F5",
    paddingHorizontal: 16,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF7E1E",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  fruitSaladsList: {
    padding: 16,
  },
  fruitSaladItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F1F1",
    elevation: 1,
  },
  fruitSaladContent: {
    flexDirection: "row",
    marginBottom: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F7F5F5",
  },
  fruitSaladImage: {
    width: "100%",
    height: "100%",
  },
  fruitSaladDetails: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: "center",
  },
  fruitSaladName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27214D",
    marginBottom: 4,
  },
  fruitSaladCategory: {
    fontSize: 14,
    color: "#5D577E",
    marginBottom: 8,
  },
  fruitSaladPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF7E1E",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#F3F1F1",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: "#4CAF50",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#5D577E",
    textAlign: "center",
    marginTop: 16,
  },
  dangerZone: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  deleteAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F44336",
    alignSelf: "center",
    width: "100%",
  },
  deleteAllButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default AdminFruitsScreen; 