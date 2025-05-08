// screens/SplashScreen.js
import React, { useEffect } from "react";
import { View, Image, StyleSheet, StatusBar, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Always navigate to Login screen instead of checking admin status
      setTimeout(() => {
        navigation.replace("Login");
      }, 2000);
    } catch (error) {
      console.error("Error in splash screen:", error);
      // Default to login screen if there's an error
      setTimeout(() => {
        navigation.replace("Login");
      }, 2000);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFA451" barStyle="light-content" />
      <Image
        source={require("../assets/images/kisspng-fruit-basket-clip-art-5aed5301d44408 1.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Button
        title="Admin Login"
        onPress={() => navigation.replace("AdminLogin")}
        color="#333"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFA451",
    justifyContent: "center",
    alignItems: "center"
  },
  logo: {
    width: 140,
    height: 140
  }
});

export default SplashScreen;