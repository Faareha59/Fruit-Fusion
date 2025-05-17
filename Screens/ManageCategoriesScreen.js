import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Button, FlatList, TextInput, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function ManageCategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [message, setMessage] = useState("");

  // Load categories from AsyncStorage every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("categories").then(data => {
        if (data) setCategories(JSON.parse(data));
        else setCategories([
          { id: "1", name: "Fresh" },
          { id: "2", name: "Seasonal" }
        ]);
      });
    }, [])
  );

  // Save categories to AsyncStorage whenever they change
  const saveCategories = (newCategories) => {
    setCategories(newCategories);
    AsyncStorage.setItem("categories", JSON.stringify(newCategories));
  };

  const addCategory = () => {
    Alert.alert("Button pressed", newCategory);
  };

  const deleteCategory = (id) => {
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => {
          const updated = categories.filter(cat => cat.id !== id);
          saveCategories(updated);
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Categories</Text>
      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemBox}>
            <Text style={styles.itemText}>{item.name}</Text>
            <TouchableOpacity onPress={() => deleteCategory(item.id)} style={styles.deleteButton}>
              <Text style={{ color: "#fff" }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        style={{ width: "100%" }}
        ListEmptyComponent={<Text style={{ textAlign: "center", color: "#aaa", marginTop: 20 }}>No categories yet.</Text>}
      />
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="New category name"
          value={newCategory}
          onChangeText={text => {
            setNewCategory(text);
            setMessage("");
          }}
        />
        <TouchableOpacity
          style={[styles.addButton, { opacity: newCategory.trim() ? 1 : 0.5 }]}
          onPress={addCategory}
          disabled={!newCategory.trim()}
        >
          <Text style={{ color: "#fff" }}>Add</Text>
        </TouchableOpacity>
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  itemBox: { 
    backgroundColor: "#FFF6ED", 
    padding: 16, 
    borderRadius: 10, 
    marginBottom: 10, 
    width: "100%", 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between" 
  },
  itemText: { fontSize: 18 },
  deleteButton: { backgroundColor: "#FF3B30", padding: 8, borderRadius: 8 },
  addRow: { flexDirection: "row", marginTop: 20, marginBottom: 20, width: "100%" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginRight: 10 },
  addButton: { backgroundColor: "#FF7E1E", padding: 12, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  message: { color: "#FF7E1E", marginBottom: 10, textAlign: "center" }
});
