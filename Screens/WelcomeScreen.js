import React, { useEffect, useState } from 'react';
import { Button, FlatList, Text, TextInput, View, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';

const WelcomeScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const BASE_URL = 'https://fruit-acf8e-default-rtdb.firebaseio.com/';

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const response = await axios.get(`${BASE_URL}/users.json`);
      console.log('Users data:', response.data);

      if (!response.data) {
        await createInitialUsers();
        const newResponse = await axios.get(`${BASE_URL}/users.json`);
        const usersData = newResponse.data;
        const usersList = Object.keys(usersData).map(key => ({
          id: key,
          ...usersData[key]
        }));
        setUsers(usersList);
      } else {
        const usersData = response.data;
        const usersList = Object.keys(usersData).map(key => ({
          id: key,
          ...usersData[key]
        }));
        setUsers(usersList);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setIsLoading(false);
    }
  }

  async function createInitialUsers() {
    try {
      const initialUsers = {
        'admin123': {
          uid: 'admin123',
          email: 'admin@fruitfusion.com',
          password: 'admin123',
          firstName: 'Admin',
          role: 'admin',
          points: 0,
          createdAt: new Date().toISOString()
        },
        'user123': {
          uid: 'user123',
          email: 'user@fruitfusion.com',
          password: 'user123',
          firstName: 'User',
          role: 'user',
          points: 100,
          createdAt: new Date().toISOString()
        }
      };

      await axios.put(`${BASE_URL}/users.json`, initialUsers);
      console.log('Initial users created');
    } catch (error) {
      console.error('Error creating initial users:', error);
    }
  }

  async function addNewUser() {
    try {
      const newUser = {
        uid: 'user_' + Date.now(),
        email: 'newuser@fruitfusion.com',
        password: 'user123',
        firstName: 'New User',
        role: 'user',
        points: 50,
        createdAt: new Date().toISOString()
      };

      const response = await axios.post(`${BASE_URL}/users.json`, newUser);
      console.log('New user added:', response.data);
      alert('New user added successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error adding new user:', error);
      alert('Error adding new user');
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Fruit Fusion</Text>
      
      <Text style={styles.subtitle}>User Accounts:</Text>
      <FlatList
        data={users}
        renderItem={({item}) => (
          <View style={styles.userItem}>
            <Text style={styles.userName}>{item.firstName}</Text>
            <Text style={styles.userDetails}>Role: {item.role}</Text>
            <Text style={styles.userDetails}>Points: {item.points}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.buttonContainer}>
        <Button 
          onPress={addNewUser} 
          title="Add New User"
          color="#FF6B6B"
        />
        
        <Button
          onPress={() => navigation.navigate('Login')}
          title="Go to Login"
          color="#4ECDC4"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#2C3E50',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
    color: '#34495E',
  },
  userItem: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  userDetails: {
    fontSize: 14,
    color: '#34495E',
    marginTop: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  }
});

export default WelcomeScreen;
