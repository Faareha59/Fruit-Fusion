import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  TextInput,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem("userData");
      if (userDataString) {
        const data = JSON.parse(userDataString);
        setUserData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
        });
        setEditedData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      saveUserData();
    } else {
      setEditedData({ ...userData });
    }
    setIsEditing(!isEditing);
  };

  const saveUserData = async () => {
    try {
      if (!editedData.firstName.trim()) {
        Alert.alert("Error", "First name is required");
        return;
      }
      
      if (!editedData.email.trim()) {
        Alert.alert("Error", "Email is required");
        return;
      }
      setUserData({ ...editedData });

      const userDataToSave = {
        ...await AsyncStorage.getItem("userData").then(data => JSON.parse(data || '{}')),
        ...editedData
      };
      
      await AsyncStorage.setItem("userData", JSON.stringify(userDataToSave));
      
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error saving user data:", error);
      Alert.alert("Error", "Failed to save profile changes");
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                "userData",
                "basket",
                "favorites",
                "adminAuthenticated"
              ]);
           
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }]
              });
            } catch (error) {
              Alert.alert("Logout Error", error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#27214D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={handleEditToggle}>
          <Text style={styles.editButtonText}>
            {isEditing ? "Save" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Picture */}
        <View style={styles.profilePictureContainer}>
          <View style={styles.profilePicture}>
            <Text style={styles.profileInitial}>
              {userData.firstName ? userData.firstName.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          {isEditing && (
            <TouchableOpacity style={styles.editPictureButton}>
              <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Form */}
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>First Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedData.firstName}
                onChangeText={(text) => handleInputChange("firstName", text)}
                placeholder="Enter your first name"
              />
            ) : (
              <Text style={styles.fieldValue}>{userData.firstName || "Not set"}</Text>
            )}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Last Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedData.lastName}
                onChangeText={(text) => handleInputChange("lastName", text)}
                placeholder="Enter your last name"
              />
            ) : (
              <Text style={styles.fieldValue}>{userData.lastName || "Not set"}</Text>
            )}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedData.email}
                onChangeText={(text) => handleInputChange("email", text)}
                placeholder="Enter your email"
                keyboardType="email-address"
              />
            ) : (
              <Text style={styles.fieldValue}>{userData.email || "Not set"}</Text>
            )}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedData.phone}
                onChangeText={(text) => handleInputChange("phone", text)}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>{userData.phone || "Not set"}</Text>
            )}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={editedData.address}
                onChangeText={(text) => handleInputChange("address", text)}
                placeholder="Enter your address"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.fieldValue}>{userData.address || "Not set"}</Text>
            )}
          </View>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF5A5A" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27214D",
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFA451",
  },
  profilePictureContainer: {
    alignItems: "center",
    marginBottom: 32,
    position: "relative",
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFA451",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  editPictureButton: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: "#27214D",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  form: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#5D577E",
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: "#27214D",
    fontWeight: "500",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F1F1",
  },
  input: {
    fontSize: 16,
    color: "#27214D",
    borderBottomWidth: 1,
    borderBottomColor: "#FFA451",
    paddingVertical: 8,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#F3F1F1",
    borderRadius: 10,
    marginTop: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF5A5A",
    marginLeft: 8,
  },
});

export default ProfileScreen; 