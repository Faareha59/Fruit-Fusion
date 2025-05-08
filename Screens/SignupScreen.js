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
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    navigation.navigate("Login");
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
          <Text style={styles.subtitle}>Create an account</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

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

          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="• • • • • • • •"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#5D577E"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, !name || !email || !password || !confirmPassword ? styles.buttonDisabled : null]}
            onPress={handleSignup}
            disabled={!name || !email || !password || !confirmPassword}
          >
            <Text style={styles.buttonText}>Sign up</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Login</Text>
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
    marginBottom: 24,
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
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: "#C2BDBD",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    color: "#5D577E",
    fontSize: 14,
  },
  loginLink: {
    color: "#FFA451",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default SignupScreen;
