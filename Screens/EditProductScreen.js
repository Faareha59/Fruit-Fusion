import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  updateProduct,
  getProductById,
  getAllCategories,
  addCategory
} from '../services/firebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ICONS = {
  BACK: "←",
  CHEVRON_DOWN: "▼",
  CHECKMARK: "✓",
  IMAGE: "🖼️",
  ADD: "+",
};

const EditProductScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false); 

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsInitialLoading(true);

        if (productId) {
          const result = await getProductById(productId);
          if (result && result.success && result.data) {
            const product = result.data;
            setName(product.name || '');
            setDescription(product.description || '');
            setPrice(product.price ? product.price.toString() : '');
            setStock(product.stock ? product.stock.toString() : '');
            setImageUri(product.image || '');
            setCategory(product.category || '');
          } else {
            console.error('Product not found or invalid data');
            Alert.alert('Error', 'Failed to load product details');
            navigation.goBack();
          }
        }

        let foundCategories = [];
        const asyncStorageCategories = await AsyncStorage.getItem('categories');
        
        if (asyncStorageCategories) {
          const parsedCategories = JSON.parse(asyncStorageCategories);
          
          if (Array.isArray(parsedCategories)) {
            if (typeof parsedCategories[0] === 'string') {
              foundCategories = parsedCategories.map(name => ({
                id: name,
                name: name,
                color: "#FF7E1E"
              }));
              setCategories(foundCategories);
            } else if (parsedCategories[0] && parsedCategories[0].name) {
              foundCategories = parsedCategories;
              setCategories(foundCategories);
            }
          }
          
          if (foundCategories.length > 0) {
            setIsInitialLoading(false);
            return;
          }
        }
  
        const categoriesResult = await getAllCategories();
        if (categoriesResult && categoriesResult.success && Array.isArray(categoriesResult.data) && categoriesResult.data.length > 0) {
          setCategories(categoriesResult.data);
        } else if (categoriesResult && Array.isArray(categoriesResult) && categoriesResult.length > 0) {
          setCategories(categoriesResult);
        } else {
          console.log('No categories found, adding defaults');
          const defaultCategories = [
            { id: "1", name: "Fruits", color: "#FF7E1E", icon: "nutrition", isActive: true },
            { id: "2", name: "Vegetables", color: "#4CAF50", icon: "nutrition", isActive: true },
            { id: "3", name: "Mixed", color: "#2196F3", icon: "nutrition", isActive: true }
          ];

          for (const category of defaultCategories) {
            try {
              await addCategory(category);
            } catch (err) {
              console.error('Error adding default category:', err);
            }
          }
    
          await AsyncStorage.setItem('categories', JSON.stringify(defaultCategories));
   
          setCategories(defaultCategories);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load product or categories');

        const defaultCategories = [
          { id: "1", name: "Fruits", color: "#FF7E1E", icon: "nutrition", isActive: true },
          { id: "2", name: "Vegetables", color: "#4CAF50", icon: "nutrition", isActive: true },
          { id: "3", name: "Mixed", color: "#2196F3", icon: "nutrition", isActive: true }
        ];
        setCategories(defaultCategories);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, [productId]);

  const CategoryDropdown = () => {
    return (
      <View>
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => setDropdownVisible(true)}
        >
          <Text style={styles.dropdownButtonText}>
            {category || "Select a category"}
          </Text>
          <Text style={styles.iconText}>{ICONS.CHEVRON_DOWN}</Text>
        </TouchableOpacity>

        <Modal
          transparent={true}
          visible={dropdownVisible}
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownTitle}>Select Category</Text>
              
              {categories.length > 0 ? (
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item.id || Math.random().toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        category === item.name && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setCategory(item.name);
                        setDropdownVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          category === item.name && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {category === item.name && (
                        <Text style={[styles.iconText, {color: "#FFA451"}]}>{ICONS.CHECKMARK}</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.dropdownList}
                />
              ) : (
                <Text style={styles.noDataText}>No categories available</Text>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setDropdownVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const validateInputs = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return false;
    }
    
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }
    
    if (!stock.trim() || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      Alert.alert('Error', 'Please enter a valid stock quantity');
      return false;
    }
    
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    
    return true;
  };

  const handleUpdate = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      const imageUrl = imageUri || 'https://via.placeholder.com/300';
      
      const updatedProduct = {
        name: name,
        description: description || '',
            price: parseFloat(price),
        stock: parseInt(stock),
            category,
        image: imageUrl,
        updatedAt: new Date().toISOString(),
          };

      const result = await updateProduct(productId, updatedProduct);

      if (result && result.success) {
      Alert.alert(
        'Success',
        'Product updated successfully!',
        [
          {
            text: 'OK',
              onPress: () => navigation.goBack() 
            }
        ]
      );
      } else {
        Alert.alert('Error', 'Failed to update product. Please try again.');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA451" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.iconText}>{ICONS.BACK}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Product</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <TouchableOpacity 
          style={styles.imagePickerContainer}
          onPress={pickImage}
        >
          {imageUri ? (
            <Image 
              source={{ uri: imageUri }} 
              style={styles.productImage}
              onError={(e) => {
                console.log('Failed to load image:', imageUri);
                Alert.alert('Error', 'Failed to load image. Please select another one.');
              }}
              defaultSource={require('../assets/images/kisspng-fruit-basket-clip-art-5aed5301d44408 1.png')}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.iconTextLarge}>{ICONS.IMAGE}</Text>
              <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter product name"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
        <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter product description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Price *</Text>
        <TextInput
          style={styles.input}
              placeholder="0.00"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Stock *</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={stock}
              onChangeText={setStock}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <CategoryDropdown />
        </View>

        <TouchableOpacity
          style={[
            styles.updateButton,
            (isLoading) && styles.disabledButton
          ]}
          onPress={handleUpdate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.updateButtonText}>Update Product</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 55,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  productImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: '#666',
    marginTop: 10,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  updateButton: {
    backgroundColor: '#FFA451',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconText: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  iconTextLarge: {
    fontSize: 40,
    color: '#ccc',
    textAlign: 'center',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    width: '100%',
    maxHeight: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  dropdownList: {
    maxHeight: 280,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#FFF8F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#FFA451',
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});

export default EditProductScreen;