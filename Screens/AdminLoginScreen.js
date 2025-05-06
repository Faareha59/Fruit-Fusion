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
  Button
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AdminLoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password.");
      return;
    }
// Replace with your real admin credentials  
    // Replace with your real admin credentials
    if (username === "admin" && password === "password123") {
      try {
        // Set admin session token
        await AsyncStorage.setItem("adminAuthenticated", "true");
        navigation.replace("AdminDashboard");
      } catch (error) {
        Alert.alert("Error", "Failed to create admin session.");
      }
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <StatusBar backgroundColor="#FF7E1E" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Image
            source={require("../assets/images/Group 20.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>Admin Portal</Text>
          <Text style={styles.subtitle}>Login to your admin account</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter admin username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
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

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, !username || !password ? styles.buttonDisabled : null]}
            onPress={handleAdminLogin}
            disabled={!username || !password}
          >
            <Text style={styles.buttonText}>Login</Text>
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
  error: { color: "red", marginBottom: 10, textAlign: "center" }
});

export default AdminLoginScreen; 