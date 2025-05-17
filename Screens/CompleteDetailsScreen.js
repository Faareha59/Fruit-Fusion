import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  ScrollView,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addOrder } from "../services/firebaseService";

const CompleteDetailsScreen = ({ navigation }) => {
  const [basketItems, setBasketItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    const loadBasket = async () => {
      try {
        const basketString = await AsyncStorage.getItem("basket");
        if (basketString) {
          const basket = JSON.parse(basketString);
          setBasketItems(basket);
        
          const total = basket.reduce(
            (sum, item) => sum + (item.price * item.quantity), 
            0
          );
          setTotalPrice(total);
        }
      } catch (error) {
        console.error("Error loading basket:", error);
      }
    };

    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem("userData");
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUserData(userData);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadBasket();
    loadUserData();
  }, []);

  const handlePayOnDelivery = () => {
    if (!address.trim()) {
      setAddressError("Please provide a delivery address");
      return;
    } else if (!address.toLowerCase().includes("islamabad")) {
      setAddressError("Sorry, we only deliver in Islamabad, Pakistan");
      return;
    } else {
      setAddressError("");
    }
    
    if (!phoneNumber.trim()) {
      setPhoneError("Please provide a phone number");
      return;
    } else if (!/^03\d{9}$/.test(phoneNumber)) {
      setPhoneError("Please enter a valid Pakistani mobile number (03xxxxxxxxx)");
      return;
    } else {
      setPhoneError("");
    }
    
    placeOrder("cash");
  };

  const placeOrder = async (paymentMethod) => {
    try {
      setIsLoading(true);
      
      const formattedItems = basketItems.map(item => ({
        ...item,
        image: typeof item.image === 'string' 
          ? item.image 
          : (item.image?.uri || null),
        price: typeof item.price === 'number' 
          ? item.price 
          : parseFloat(String(item.price).replace(/,/g, "")) || 0,
        quantity: typeof item.quantity === 'number'
          ? item.quantity
          : parseInt(item.quantity) || 1
      }));
      
      const calculatedTotal = formattedItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      
      const order = {
        userId: userData?.id || "guest",
        customerName: userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : "Guest User",
        email: userData?.email || "Not provided",
        phone: phoneNumber,
        phoneNumber: phoneNumber,
        items: formattedItems,
        totalAmount: calculatedTotal, 
        address,
        paymentMethod,
        status: "Order Taken",
        createdAt: new Date().toISOString()
      };
      
      console.log("Creating order with items:", order.items.length);
      
      let orderId;
  
      try {
        const result = await addOrder(order);
        orderId = result.id;
        console.log("Order created in Realtime DB with ID:", orderId);
      } catch (realtimeError) {
        console.error("Realtime DB error, using AsyncStorage fallback:", realtimeError);
    
        orderId = Date.now().toString();
        order.id = orderId;

        const ordersString = await AsyncStorage.getItem("orders");
        const orders = ordersString ? JSON.parse(ordersString) : [];
        orders.push(order);
        await AsyncStorage.setItem("orders", JSON.stringify(orders));
        console.log("Order saved to local storage with ID:", orderId);
      }

      await AsyncStorage.removeItem("basket");
  
      navigation.replace("OrderComplete", { orderId });
    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert("Error", "There was an error placing your order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderBasketItem = (item, index) => (
    <View key={index} style={styles.basketItem}>
      {}
      {item.image ? (
        <Image 
          source={typeof item.image === 'string' 
            ? { uri: item.image }
            : item.image.uri ? { uri: item.image.uri } : require('../assets/images/icon.png')
          } 
          style={styles.itemImage}
          defaultSource={require('../assets/images/icon.png')}
        />
      ) : (
        <View style={[styles.itemImage, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={30} color="#CCCCCC" />
        </View>
      )}
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
        <Text style={styles.itemPrice}>Rs {(item.price * item.quantity).toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFA451" barStyle="light-content" />
      
      {}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#27214D" />
          <Text style={styles.backText}>Go back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Basket</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {}
        {basketItems.slice(0, 2).map(renderBasketItem)}
        
        {}
        <View style={styles.formContainer}>
          <TouchableOpacity style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.formTitle}>Delivery address</Text>
          <TextInput
            style={[styles.input, addressError ? styles.inputError : null]}
            placeholder="F-10, Islamabad, Pakistan"
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              if (text.trim()) {
                if (text.toLowerCase().includes("islamabad")) {
                  setAddressError("");
                } else {
                  setAddressError("Sorry, we only deliver in Islamabad, Pakistan");
                }
              }
            }}
          />
          {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
          
          <Text style={styles.formTitle}>Pakistan Mobile Number</Text>
          <TextInput
            style={[styles.input, phoneError ? styles.inputError : null]}
            placeholder="03xxxxxxxxx"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={(text) => {
              const numericText = text.replace(/\D/g, '');
              const trimmedText = numericText.slice(0, 11);
              setPhoneNumber(trimmedText);
              
              if (/^03\d{9}$/.test(trimmedText)) {
                setPhoneError("");
              } else if (trimmedText.length > 0) {
                setPhoneError("Enter a valid Pakistani mobile number (03xxxxxxxxx)");
              }
            }}
            maxLength={11}
          />
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
          
          <View style={styles.paymentButtons}>
            <TouchableOpacity 
              style={[styles.paymentButton, styles.cashOnDeliveryButton, isLoading && styles.disabledButton]}
              onPress={handlePayOnDelivery}
              disabled={isLoading}
            >
              <Text style={styles.cashOnDeliveryText}>
                {isLoading ? "Processing..." : "Cash on Delivery"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: "#FFA451",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 32,
  },
  backText: {
    color: "#27214D",
    fontSize: 16,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  basketItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  imagePlaceholder: {
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27214D",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#5D577E",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFA451",
  },
  formContainer: {
    margin: 24,
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 24,
    right: 24,
    zIndex: 1,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27214D",
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: "#F7F5F5",
  },
  inputError: {
    borderColor: "#FF5A5A",
    borderWidth: 1,
  },
  errorText: {
    color: "#FF5A5A",
    fontSize: 14,
    marginBottom: 10,
    marginTop: -5,
  },
  paymentButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  paymentButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFA451",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 8,
  },
  cashOnDeliveryButton: {
    backgroundColor: "#FFA451",
  },
  cashOnDeliveryText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  disabledButton: {
    borderColor: "#CCCCCC",
    opacity: 0.7,
  },
  paymentButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFA451",
  },
});

export default CompleteDetailsScreen;
