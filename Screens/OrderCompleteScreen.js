import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  BackHandler,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

const OrderCompleteScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [orderNumber, setOrderNumber] = useState(orderId ? orderId.substring(0, 8) : "Unknown");

  // Handle hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Prevent going back to the checkout
        navigation.navigate("UserDashboard");
        return true;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [navigation])
  );

  const handleContinueShopping = () => {
    navigation.navigate("UserDashboard");
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Success Icon */}
      <View style={styles.successIconContainer}>
        <View style={styles.successIconOuter}>
          <View style={styles.successIconInner}>
            <Ionicons name="checkmark" size={32} color="#FFFFFF" />
          </View>
        </View>
      </View>
      
      {/* Success Message */}
      <Text style={styles.title}>Order Placed Successfully!</Text>
      <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
      <Text style={styles.message}>
        Your order has been placed and is being prepared. Thank you for shopping with us.
      </Text>
      
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleContinueShopping}
        >
          <Ionicons name="basket-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconContainer: {
    marginBottom: 32,
  },
  successIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(76, 217, 100, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  successIconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4CD964",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#27214D",
    marginBottom: 8,
    textAlign: "center",
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFA451",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#5D577E",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
  },
  primaryButton: {
    backgroundColor: "#FFA451",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  buttonIcon: {
    marginRight: 8
  }
});

export default OrderCompleteScreen;
