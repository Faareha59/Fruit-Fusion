import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  SafeAreaView
} from 'react-native';

const SimpleProductsScreen = ({ navigation }) => {
  // Dummy data with different categories
  const dummyProducts = [
    // Recommended Category
    {
      id: '1',
      name: 'Fruit Salad Bowl',
      description: 'Fresh mix of seasonal fruits with honey dressing',
      price: '250',
      category: 'Recommended',
      image: 'https://images.unsplash.com/photo-1564093497595-593b96d80180?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZnJ1aXQlMjBzYWxhZHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '2',
      name: 'Summer Delight',
      description: 'Refreshing watermelon, strawberry and mint mix',
      price: '270',
      category: 'Recommended',
      image: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=60'
    },
    
    // Popular Category
    {
      id: '3',
      name: 'Tropical Mix',
      description: 'Mango, pineapple, papaya with coconut shavings',
      price: '300',
      category: 'Popular',
      image: 'https://images.unsplash.com/photo-1568158879083-c42860933ed7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZnJ1aXQlMjBzYWxhZHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '4',
      name: 'Citrus Splash',
      description: 'Orange, grapefruit, and lemon with honey',
      price: '260',
      category: 'Popular',
      image: 'https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=60'
    },
    
    // New Category
    {
      id: '5',
      name: 'Berry Blast',
      description: 'Mixed berries with yogurt and granola',
      price: '350',
      category: 'New',
      image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGZydWl0JTIwc2FsYWR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '6',
      name: 'Green Goddess',
      description: 'Kiwi, green apple, and green grapes with lime juice',
      price: '290',
      category: 'New',
      image: 'https://images.unsplash.com/photo-1583096114844-06ce5a5f2171?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=60'
    },
    
    // Top Category
    {
      id: '7',
      name: 'Melon Medley',
      description: 'Watermelon, cantaloupe, and honeydew mix',
      price: '280',
      category: 'Top',
      image: 'https://images.unsplash.com/photo-1563252722-6434971ebd65?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGZydWl0JTIwc2FsYWR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '8',
      name: 'Protein Power',
      description: 'Banana, apple, and nuts with protein powder',
      price: '320',
      category: 'Top',
      image: 'https://images.unsplash.com/photo-1546548970-71785318a17b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '9',
      name: 'Exotic Fusion',
      description: 'Dragon fruit, kiwi, and star fruit with passion fruit drizzle',
      price: '380',
      category: 'Top',
      image: 'https://images.unsplash.com/photo-1596591868231-05e808fd151d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=60'
    }
  ];

  // Get unique categories
  const categories = [...new Set(dummyProducts.map(item => item.category))];

  // Render a product item
  const renderProductItem = (item) => (
    <View style={styles.productCard} key={item.id}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription}>{item.description}</Text>
        <View style={styles.productBottom}>
          <Text style={styles.productPrice}>Rs. {item.price}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Get color for category badge
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Recommended':
        return '#FF7E1E';
      case 'Popular':
        return '#4CAF50';
      case 'New':
        return '#2196F3';
      case 'Top':
        return '#9C27B0';
      default:
        return '#FF7E1E';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 50 }} />
        <Text style={styles.headerTitle}>Fruit Fusion</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.welcomeText}>
          Hello, What fruit salad combo do you want today?
        </Text>

        {categories.map(category => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.productList}>
              {dummyProducts
                .filter(item => item.category === category)
                .map(item => renderProductItem(item))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF7E1E',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  categorySection: {
    marginBottom: 25,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#444',
  },
  productList: {
    width: '100%',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    height: 180,
    width: '100%',
  },
  productInfo: {
    padding: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  productBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF7E1E',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SimpleProductsScreen;
