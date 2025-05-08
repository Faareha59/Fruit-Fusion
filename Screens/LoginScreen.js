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

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simple validation
      if (!email.includes('@')) {
        Alert.alert("Error", "Please enter a valid email address");
        setIsLoading(false);
        return;
      }
      
      // Save user data to AsyncStorage
      const userData = {
        id: Date.now().toString(),
        email,
        firstName: email.split('@')[0], // Simple way to extract a name
        isLoggedIn: true
      };
      
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // Navigate directly to Home screen
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'Home',
          params: { firstName: userData.firstName }
        }],
      });
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Skip login for testing purposes
  const skipLogin = async () => {
    try {
      // Create guest user data
      const guestData = {
        id: "guest-" + Date.now().toString(),
        email: "guest@example.com",
        firstName: "Guest",
        isLoggedIn: true,
        isGuest: true
      };
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(guestData));
      
      // Navigate directly to Home screen
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'Home',
          params: { firstName: guestData.firstName }
        }],
      });
    } catch (error) {
      console.error("Error in skip login:", error);
      Alert.alert("Error", "Failed to skip login. Please try again.");
    }
  };

  // Navigate to admin login
  const goToAdminLogin = () => {
    navigation.navigate("AdminLogin");
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
          <Text style={styles.welcomeText}>Welcome to Fruit Hub</Text>
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

          <TouchableOpacity style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

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
            onPress={goToAdminLogin}
          >
            <Ionicons name="shield-outline" size={18} color="#FF7E1E" />
            <Text style={styles.adminLoginText}>Admin Portal</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.skipButton}
            onPress={skipLogin}
          >
            <Text style={styles.skipButtonText}>Skip Login (For Testing)</Text>
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
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 40,
  },
  forgotPasswordText: {
    color: "#27214D",
    fontSize: 14,
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
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipButtonText: {
    color: "#5D577E",
    fontSize: 14,
  },
});

export default LoginScreen;