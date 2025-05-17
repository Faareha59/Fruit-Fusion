import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CategoryManagementScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [categoryColor, setCategoryColor] = useState("#FF7E1E");
  const [isLoading, setIsLoading] = useState(true);

  const colorOptions = [
    "#FF7E1E", 
    "#4CAF50", 
    "#2196F3", 
    "#9C27B0", 
    "#F44336", 
    "#FFEB3B", 
    "#00BCD4", 
    "#FF9800", 
    "#607D8B", 
    "#8BC34A"  
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const storedCategories = await AsyncStorage.getItem('categories');
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        const defaultCategories = [
          { id: "1", name: "Fruits", color: "#FF7E1E", icon: "nutrition", isActive: true },
          { id: "2", name: "Vegetables", color: "#4CAF50", icon: "nutrition", isActive: true },
          { id: "3", name: "Mixed", color: "#2196F3", icon: "nutrition", isActive: true }
        ];
        await AsyncStorage.setItem('categories', JSON.stringify(defaultCategories));
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      const defaultCategories = [
        { id: "1", name: "Fruits", color: "#FF7E1E", icon: "nutrition", isActive: true },
        { id: "2", name: "Vegetables", color: "#4CAF50", icon: "nutrition", isActive: true },
        { id: "3", name: "Mixed", color: "#2196F3", icon: "nutrition", isActive: true }
      ];
      setCategories(defaultCategories);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    setIsLoading(true);

    try {
      const existingCategory = categories.find(
        category => category.name.toLowerCase() === newCategory.trim().toLowerCase()
      );

      if (existingCategory) {
        Alert.alert("Error", "This category already exists");
        setIsLoading(false);
        return;
      }

      const newCategoryItem = {
        id: Date.now().toString(),
        name: newCategory.trim(),
        color: categoryColor,
        icon: "nutrition", 
        isActive: true,
        createdAt: new Date().toISOString()
      };

      const updatedCategories = [...categories, newCategoryItem];
      setCategories(updatedCategories);

      await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));

      setNewCategory("");
      setCategoryColor("#FF7E1E");
      
      Alert.alert("Success", "Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
      Alert.alert("Error", "Failed to add category. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            
            try {
              const updatedCategories = categories.filter(category => category.id !== id);
              
              setCategories(updatedCategories);
              
              await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
              
              Alert.alert("Success", "Category deleted successfully");
            } catch (error) {
              console.error("Error deleting category:", error);
              Alert.alert("Error", "Failed to delete category. Please try again.");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderColorOption = (color) => (
    <TouchableOpacity
      key={color}
      style={[
        styles.colorOption,
        { backgroundColor: color },
        categoryColor === color && styles.selectedColorOption
      ]}
      onPress={() => setCategoryColor(color)}
    />
  );

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF7E1E" />
        </View>
      )}
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

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter category name"
          value={newCategory}
          onChangeText={setNewCategory}
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: categoryColor }, isLoading && styles.buttonDisabled]}
          onPress={handleAddCategory}
          disabled={isLoading}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.colorSectionTitle}>Select category color:</Text>
      
      <View style={styles.colorOptionsContainer}>
        {colorOptions.map(renderColorOption)}
      </View>

      <Text style={styles.sectionTitle}>Current Categories</Text>
      
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id || item.name}
        renderItem={({ item }) => (
          <View style={styles.categoryItem}>
            <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon || "nutrition"} size={24} color="#fff" />
            </View>
            <Text style={styles.categoryName}>{item.name}</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteCategory(item.id)}
            >
              <Ionicons name="trash-outline" size={22} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>
            {isLoading ? "Loading categories..." : "No categories available"}
          </Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27214D"
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 16
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  buttonDisabled: {
    opacity: 0.5
  },
  colorSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#27214D",
    marginBottom: 10
  },
  colorOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 5
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: "#000"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27214D",
    marginBottom: 15
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    marginBottom: 10
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: "#27214D"
  },
  deleteButton: {
    padding: 5
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginTop: 20
  }
});

export default CategoryManagementScreen;
