import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FirebaseService from '../services/firebaseService';

const AdminDashboardScreen = ({ navigation }) => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoryMessage, setCategoryMessage] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    checkAdminAuth();
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const products = await FirebaseService.getProducts();
      setProductCount(products.length);
      
      const categories = await FirebaseService.getCategories();
      setCategoryCount(categories.length);
      
      const orders = await FirebaseService.getOrders();
      setOrderCount(orders.length);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setProductCount(0);
      setCategoryCount(0);
      setOrderCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAdminAuth = async () => {
    try {
      const isAdmin = await AsyncStorage.getItem("adminAuthenticated");
      if (isAdmin !== "true") {
        Alert.alert("Access Denied", "You must be logged in as an admin to access this page.");
        navigation.replace("AdminLogin");
      }
    } catch (error) {
      console.error("Error checking admin auth:", error);
      navigation.replace("AdminLogin");
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        "adminAuthenticated",
        "userData",
        "basket",
        "favorites"
      ]);
  
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Error", "Failed to log out properly.");
    }
  };

  const addCategory = async () => {
    if (!newCategory.trim()) {
      setCategoryMessage("Please enter a category name.");
      return;
    }
 
    try {
      const existingCategories = await FirebaseService.getCategories();
      if (existingCategories.some(cat => cat.name && cat.name.toLowerCase() === newCategory.trim().toLowerCase())) {
        setCategoryMessage("This category already exists.");
        return;
      }

      const categoryData = {
        name: newCategory.trim(),
        color: "#FF7E1E", 
        icon: "nutrition",
        isActive: true,
        createdAt: new Date().toISOString()
      };
 
      const result = await FirebaseService.addCategory(categoryData);
      
      if (result.success) {
        setCategoryMessage("Category added successfully!");
        fetchDashboardData();
        setNewCategory("");
        setTimeout(() => {
          setShowCategoryModal(false);
          setCategoryMessage("");
        }, 1000);
      } else {
        setCategoryMessage("Failed to add category. Please try again.");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      setCategoryMessage("An error occurred. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FF7E1E" barStyle="light-content" />
      
      {}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF7E1E" />
        </View>
      )}
      
      {}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF7E1E" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="nutrition-outline" size={36} color="#FF7E1E" />
            <Text style={styles.statNumber}>{productCount}</Text>
            <Text style={styles.statLabel}>Fruit Salads</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="grid-outline" size={36} color="#FF7E1E" />
            <Text style={styles.statNumber}>{categoryCount}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cart-outline" size={36} color="#FF7E1E" />
            <Text style={styles.statNumber}>{orderCount}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>
        
        {}
        <View style={styles.quickLinksContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.quickLinkItem}
            onPress={() => navigation.navigate("ManageProducts")}
          >
            <View style={styles.quickLinkIconContainer}>
              <Ionicons name="add-circle-outline" size={24} color="#FF7E1E" />
            </View>
            <View style={styles.quickLinkContent}>
              <Text style={styles.quickLinkTitle}>Add New Fruit Salad</Text>
              <Text style={styles.quickLinkDescription}>Create a new product listing</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#C4C4C4" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickLinkItem}
            onPress={() => navigation.navigate("CategoryManagement")}
          >
            <View style={styles.quickLinkIconContainer}>
              <Ionicons name="folder-open-outline" size={24} color="#FF7E1E" />
            </View>
            <View style={styles.quickLinkContent}>
              <Text style={styles.quickLinkTitle}>Manage Categories</Text>
              <Text style={styles.quickLinkDescription}>Add, edit, or remove categories</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#C4C4C4" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickLinkItem}
            onPress={() => navigation.navigate("ManageOrders")}
          >
            <View style={styles.quickLinkIconContainer}>
              <Ionicons name="time-outline" size={24} color="#FF7E1E" />
            </View>
            <View style={styles.quickLinkContent}>
              <Text style={styles.quickLinkTitle}>Pending Orders</Text>
              <Text style={styles.quickLinkDescription}>View and process new orders</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#C4C4C4" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      {}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add New Category</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Category name"
              value={newCategory}
              onChangeText={text => {
                setNewCategory(text);
                setCategoryMessage("");
              }}
            />
            {categoryMessage ? <Text style={styles.modalMessage}>{categoryMessage}</Text> : null}
            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={addCategory}
              >
                <Text style={{ color: "#fff" }}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={{ color: "#333" }}>Cancel</Text>
              </TouchableOpacity>
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
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27214D",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    marginLeft: 4,
    color: "#FF7E1E",
    fontWeight: "600",
  },
  scrollContainer: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#FFF6ED",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "31%",
    elevation: 2,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#27214D",
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#5D577E",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27214D",
    marginBottom: 16,
  },
  quickLinksContainer: {
    marginBottom: 24,
  },
  quickLinkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F1F1",
  },
  quickLinkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF6ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  quickLinkContent: {
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#27214D",
    marginBottom: 4,
  },
  quickLinkDescription: {
    fontSize: 12,
    color: "#5D577E",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    width: "80%",
    alignItems: "center"
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    width: "100%",
    marginBottom: 12
  },
  modalMessage: { color: "#FF7E1E", marginBottom: 8, textAlign: "center" },
  modalAddButton: {
    backgroundColor: "#FF7E1E",
    padding: 12,
    borderRadius: 8,
    marginRight: 10
  },
  modalCancelButton: {
    backgroundColor: "#ccc",
    padding: 12,
    borderRadius: 8
  }
});

export default AdminDashboardScreen; 