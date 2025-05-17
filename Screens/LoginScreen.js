import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  StatusBar,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';

import * as AuthService from '../firebase/auth';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Firebase Realtime Database URL
  const BASE_URL = 'https://fruit-acf8e-default-rtdb.firebaseio.com/';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get all users from Firebase
      const response = await axios.get(`${BASE_URL}/users.json`);
      console.log("Fetched users data");

      if (response.data) {
        // Find user with matching email and password
        const users = Object.entries(response.data);
        const matchedUser = users.find(([id, userData]) => 
          userData.email === email && userData.password === password
        );

        if (matchedUser) {
          const [userId, userData] = matchedUser;
          console.log("User found:", userId);

          // Save user info locally
          const userInfo = {
            id: userId,
            ...userData,
            isLoggedIn: true
          };
          await AsyncStorage.setItem('userData', JSON.stringify(userInfo));

          // Navigate based on user role
          if (userData.role === 'admin') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'AdminDashboard' }],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [{ 
                name: 'UserDashboard',
                params: { 
                  userId: userId,
                  firstName: userData.name || email.split('@')[0]
                }
              }],
            });
          }
        } else {
          Alert.alert("Error", "Invalid email or password");
        }
      } else {
        Alert.alert("Error", "No users found");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <StatusBar backgroundColor="#FFA451" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Image
            source={require("../assets/images/kisspng-fruit-basket-clip-art-5aed5301d44408 1.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>Welcome to Fruit Fusion</Text>
          <Text style={styles.subtitle}>Login to your account</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="yourname@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="• • • • • • • •"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#5D577E"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, (isLoading || !email || !password) ? styles.buttonDisabled : null]}
            onPress={handleLogin}
            disabled={isLoading || !email || !password}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.signupLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.adminLoginButton}
            onPress={() => navigation.navigate("AdminLogin")}
          >
            <Ionicons name="shield-outline" size={18} color="#FF7E1E" />
            <Text style={styles.adminLoginText}>Admin Portal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#27214D",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#5D577E",
  },
  formContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#27214D",
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#F3F1F1",
    backgroundColor: "#F7F5F5",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  passwordContainer: {
    position: "relative",
    marginBottom: 40,
  },
  passwordInput: {
    height: 56,
    borderWidth: 1,
    borderColor: "#F3F1F1",
    backgroundColor: "#F7F5F5",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  button: {
    backgroundColor: "#FFA451",
    height: 56,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  signupText: {
    color: "#5D577E",
    fontSize: 14,
  },
  signupLink: {
    color: "#FFA451",
    fontSize: 14,
    fontWeight: "600",
  },
  adminLoginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#FF7E1E",
    borderRadius: 10,
    backgroundColor: "#FFF6ED",
  },
  adminLoginText: {
    color: "#FF7E1E",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default LoginScreen;