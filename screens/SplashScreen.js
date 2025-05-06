import React, { useEffect } from "react";
import { View, Image, StyleSheet, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if admin is authenticated
      const isAdminAuthenticated = await AsyncStorage.getItem("adminAuthenticated");
      
      // Wait 2 seconds for splash screen effect
      setTimeout(() => {
        if (isAdminAuthenticated === "true") {
          navigation.replace("AdminDashboard");
        } else {
          navigation.replace("Login");
        }
      }, 2000);
    } catch (error) {
      console.error("Error checking auth status:", error);
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
        source={require("../assets/images/Group 20.png")}
        style={styles.logo}
        resizeMode="contain"
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