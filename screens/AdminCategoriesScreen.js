import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const AdminCategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
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
      loadCategories();
      return () => {};
    }, [])
  );

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const storedCategories = await AsyncStorage.getItem("categories");
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        const defaultCategories = ["Recommended", "Popular", "New", "Top"];
        setCategories(defaultCategories);
        await AsyncStorage.setItem("categories", JSON.stringify(defaultCategories));
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      Alert.alert("Error", "Failed to load categories.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert("Error", "Please enter a category name.");
      return;
    }

    if (categories.includes(newCategory.trim())) {
      Alert.alert("Error", "This category already exists.");
      return;
    }

    try {
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      setNewCategory("");
      await AsyncStorage.setItem("categories", JSON.stringify(updatedCategories));
      Alert.alert("Success", "Category added successfully.");
    } catch (error) {
      console.error("Error adding category:", error);
      Alert.alert("Error", "Failed to add category.");
    }
  };

  const handleDeleteCategory = (categoryToDelete) => {
    if (["Recommended", "Popular", "New", "Top"].includes(categoryToDelete)) {
      Alert.alert(
        "Cannot Delete",
        "Default categories cannot be deleted.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete the category "${categoryToDelete}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedCategories = categories.filter(
                (cat) => cat !== categoryToDelete
              );
              setCategories(updatedCategories);
              await AsyncStorage.setItem(
                "categories",
                JSON.stringify(updatedCategories)
              );
            
              const storedFruitSalads = await AsyncStorage.getItem("fruitSalads");
              if (storedFruitSalads) {
                const fruitSalads = JSON.parse(storedFruitSalads);
                const updatedFruitSalads = fruitSalads.map(item => {
                  if (item.category === categoryToDelete) {
                    return { ...item, category: "Recommended" };
                  }
                  return item;
                });
                await AsyncStorage.setItem("fruitSalads", JSON.stringify(updatedFruitSalads));
              }
              
              Alert.alert("Success", "Category deleted successfully.");
            } catch (error) {
              console.error("Error deleting category:", error);
              Alert.alert("Error", "Failed to delete category.");
            }
          },
        },
      ]
    );
  };

  const renderCategoryItem = ({ item }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryContent}>
        <View style={styles.categoryIconContainer}>
          <Ionicons name="pricetag-outline" size={20} color="#FF7E1E" />
        </View>
        <Text style={styles.categoryName}>{item}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteCategory(item)}
      >
        <Ionicons name="trash-outline" size={20} color={["Recommended", "Popular", "New", "Top"].includes(item) ? "#CCCCCC" : "#F44336"} />
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Manage Categories</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {}
      <View style={styles.addCategoryContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter new category name"
          value={newCategory}
          onChangeText={setNewCategory}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddCategory}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      {}
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoriesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetags-outline" size={64} color="#C4C4C4" />
            <Text style={styles.emptyText}>
              {isLoading
                ? "Loading categories..."
                : "No categories available. Add some!"}
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
  addCategoryContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#F3F1F1",
    backgroundColor: "#F7F5F5",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 12,
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
  categoriesList: {
    padding: 16,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F1F1",
    elevation: 1,
  },
  categoryContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF6ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#27214D",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F5F5",
    justifyContent: "center",
    alignItems: "center",
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
});

export default AdminCategoriesScreen; 