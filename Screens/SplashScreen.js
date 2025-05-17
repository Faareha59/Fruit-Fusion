// screens/SplashScreen.js
import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  Image, 
  StyleSheet, 
  StatusBar, 
  TouchableOpacity, 
  Text, 
  Animated, 
  Dimensions,
  SafeAreaView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  
  // State to control button visibility
  const [showButtons, setShowButtons] = useState(false);
  
  // Button animation values
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonTranslateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    console.log('SplashScreen mounted');
    
    // Simple timeout to navigate to Welcome screen after 2.5 seconds
    const timer = setTimeout(() => {
      console.log('Navigating to Welcome screen');
      navigation.replace('Welcome');
    }, 2500);
    
    // Cleanup timer on unmount
    return () => clearTimeout(timer);
  }, [navigation]);
  
  // Just for reference - keeping the old animation code commented
  /*
    // First animation sequence - logo appears
    const logoAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]);
    
    // Start logo animation
    logoAnimation.start();
    
    // After a delay, show the login buttons
    const buttonTimer = setTimeout(() => {
      setShowButtons(true);
      
      // Animate buttons appearing
      Animated.parallel([
        Animated.timing(buttonFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateYAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    }, 1500);
    
    // Cleanup timers on unmount
    return () => {
      clearTimeout(buttonTimer);
    };
  */

  const handleUserLogin = () => {
    console.log('Navigating to User Login');
    navigation.replace('Login');
  };

  const handleAdminLogin = () => {
    console.log('Navigating to Admin Login');
    navigation.replace('AdminLogin');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFA451" barStyle="light-content" />
      <View style={styles.container}>
        {/* Logo and Title Section */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/kisspng-fruit-basket-clip-art-5aed5301d44408 1.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Fruit Fusion</Text>
          <Text style={styles.subtitle}>Fresh & Delicious</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFA451",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFA451",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 3,
  },
  userButton: {
    backgroundColor: '#FFFFFF',
  },
  adminButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userButtonText: {
    color: '#FFA451',
    fontSize: 18,
    fontWeight: 'bold',
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default SplashScreen;