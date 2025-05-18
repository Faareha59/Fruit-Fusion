import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AdminLoginScreen from './screens/AdminLoginScreen.js';
import LoginScreen from './screens/LoginScreen.js';
import SignupScreen from './screens/SignupScreen.js';
import SplashScreen from './screens/SplashScreen.js';
import AdminDashboardScreen from './screens/AdminDashboardScreen.js';
import ManageProductsScreen from './screens/ManageProductsScreen.js';
import AdminCategoriesScreen from './screens/AdminCategoriesScreen.js';
import AdminFruitsScreen from './screens/AdminFruitsScreen.js';
import AddProductScreen from './screens/AddProductScreen';
import EditProductScreen from './screens/EditProductScreen';
import UserDashboardScreen from './screens/UserDashboardScreen';
import SimpleProductsScreen from './screens/SimpleProductsScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import OrderConfirmationScreen from './screens/OrderConfirmationScreen';
import AdminOrdersScreen from './screens/AdminOrdersScreen';
import AdminOrderDetailsScreen from './screens/AdminOrderDetailsScreen';
import ProductDetailsScreen from './screens/ProductDetailsScreen';
import OrderListScreen from './screens/OrderListScreen';
import CompleteDetailsScreen from './screens/CompleteDetailsScreen';
import OrderCompleteScreen from './screens/OrderCompleteScreen';

const Stack = createStackNavigator();

function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.title}>Fruit Fusion</Text>
        <Text style={styles.subtitle}>Fresh & Delicious</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.userButton]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.userButtonText}>User Login</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.adminButton]}
          onPress={() => navigation.navigate('AdminLogin')}
        >
          <Text style={styles.adminButtonText}>Admin Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FFA451" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
 
  useEffect(() => {
    console.log('App started, waiting for initialization...');
    const timer = setTimeout(() => {
      console.log('App ready to render');
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Splash" 
          screenOptions={{ 
            headerShown: false,
            cardStyle: { backgroundColor: '#FFF' }
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Home" component={UserDashboardScreen} />
          <Stack.Screen name="UserDashboard" component={UserDashboardScreen} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          <Stack.Screen name="ManageProducts" component={ManageProductsScreen} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} />
          <Stack.Screen name="EditProduct" component={EditProductScreen} />
          <Stack.Screen name="CategoryManagement" component={AdminCategoriesScreen} />
          <Stack.Screen name="AdminFruits" component={AdminFruitsScreen} />
          <Stack.Screen name="ManageOrders" component={AdminOrdersScreen} />
          <Stack.Screen name="AdminOrderDetails" component={AdminOrderDetailsScreen} />
          <Stack.Screen name="SimpleProducts" component={SimpleProductsScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} />
          <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
          <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
          <Stack.Screen name="OrderList" component={OrderListScreen} />
          <Stack.Screen name="CompleteDetails" component={CompleteDetailsScreen} />
          <Stack.Screen name="OrderComplete" component={OrderCompleteScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFA451',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFA451',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#FFFFFF',
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
