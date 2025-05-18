import { db, storage } from '../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const initialCategories = [
  {
    name: 'Fresh Fruits',
    color: '#FFA451',
    icon: 'nutrition',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Dried Fruits',
    color: '#4CAF50',
    icon: 'leaf',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Exotic Fruits',
    color: '#9C27B0',
    icon: 'tropical',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const initialProducts = [
  {
    name: 'Fresh Apples',
    description: 'Sweet and crispy fresh apples from local farms',
    price: 2.99,
    category: 'Fresh Fruits',
    image: 'https://example.com/apple.jpg',
    stock: 100,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Dried Apricots',
    description: 'Organic dried apricots, perfect for snacking',
    price: 4.99,
    category: 'Dried Fruits',
    image: 'https://example.com/apricot.jpg',
    stock: 50,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Dragon Fruit',
    description: 'Exotic dragon fruit with a sweet taste',
    price: 6.99,
    category: 'Exotic Fruits',
    image: 'https://example.com/dragonfruit.jpg',
    stock: 30,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const initializeDatabase = async () => {
  try {
    // Check if categories already exist
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    if (categoriesSnapshot.empty) {
      console.log('Initializing categories...');
      for (const category of initialCategories) {
        await addDoc(collection(db, 'categories'), category);
      }
      console.log('Categories initialized successfully');
    }
    const productsSnapshot = await getDocs(collection(db, 'products'));
    if (productsSnapshot.empty) {
      console.log('Initializing products...');
      for (const product of initialProducts) {
        await addDoc(collection(db, 'products'), product);
      }
      console.log('Products initialized successfully');
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

export default initializeDatabase; 