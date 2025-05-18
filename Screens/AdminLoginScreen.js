import React, { useState, useEffect } from "react";
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
import * as FirebaseService from '../services/firebaseService.js';
import axios from 'axios';

const AdminLoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidForm, setIsValidForm] = useState(false);

  useEffect(() => {
    if (username.trim() && password) {
      setIsValidForm(true);
    } else {
      setIsValidForm(false);
    }
  }, [username, password]);

  const handleUsernameChange = (text) => {
    setUsername(text.trim());
    setError("");
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    setError("");
  };

  const handleAdminLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const adminUser = "admin";
      const adminPass = "password123";
      
      const isUsernameValid = username.trim() === adminUser;
      const isPasswordValid = password === adminPass;
      
      console.log('Verifying admin credentials...');
      console.log('Username match:', isUsernameValid);
      console.log('Password match:', isPasswordValid);
      
      if (isUsernameValid && isPasswordValid) {
        console.log('Admin login successful');
 
        const adminData = {
          username: username,
          role: 'admin',
          isLoggedIn: true,
          lastLogin: new Date().toISOString()
        };
     
        await AsyncStorage.setItem("adminAuthenticated", "true");
        await AsyncStorage.setItem("userData", JSON.stringify(adminData));
        
        try {
          const result = await FirebaseService.addUser({
            username: username,
            role: 'admin',
            lastLogin: new Date().toISOString()
          });
          
          if (result.success) {
            console.log('Admin login saved to Firebase successfully');
          } else {
            console.warn('Failed to save admin login to Firebase:', result.error);
          }
        } catch (firebaseError) {
          console.warn('Failed to save admin login to Firebase:', firebaseError);
        }
    
        navigation.reset({
          index: 0,
          routes: [{ 
            name: 'AdminDashboard',
            params: { username: username }
          }]
        });
      } else {
        console.log('Invalid admin credentials provided');
        setError("Invalid credentials");
        Alert.alert("Error", "Invalid admin credentials");
      }
    } catch (error) {
      console.error('Admin login error:', error);
      Alert.alert("Error", "Failed to create admin session.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <StatusBar backgroundColor="#FF7E1E" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Image
            source={require("../assets/images/kisspng-fruit-basket-clip-art-5aed5301d44408 1.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>Admin Portal</Text>
          <Text style={styles.subtitle}>Login to your admin account</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Enter admin username"
            value={username}
            onChangeText={handleUsernameChange}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.passwordInput, error ? styles.inputError : null]}
              placeholder="• • • • • • • •"
              value={password}
              onChangeText={handlePasswordChange}
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

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={18} color="#FF3B30" />
              <Text style={styles.error}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, (!isValidForm || isLoading) ? styles.buttonDisabled : null]}
            onPress={handleAdminLogin}
            disabled={!isValidForm || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.userLoginContainer}>
            <Text style={styles.userLoginText}>Not an admin? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.userLoginLink}>Go to User Login</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 16,
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
    backgroundColor: "#FF7E1E",
    height: 56,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: "#FFBE90",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  userLoginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  userLoginText: {
    color: "#5D577E",
    fontSize: 14,
  },
  userLoginLink: {
    color: "#FF7E1E",
    fontSize: 14,
    fontWeight: "600",
  },
  error: { 
    color: "#FF3B30", 
    marginLeft: 5,
    fontSize: 14,
  },
  inputError: {
    borderColor: "#FF3B30",
    borderWidth: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    backgroundColor: "#FFF0F0",
    padding: 8,
    borderRadius: 6,
  },
});

export default AdminLoginScreen; 