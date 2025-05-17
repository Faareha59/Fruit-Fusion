# Fruit Fusion

A modern mobile app for ordering fresh, customizable fruit salad combos.

## Features

- User-friendly interface for browsing and ordering fruit salads
- Order tracking and delivery updates
- Secure authentication for user accounts
- Admin dashboard for managing orders and products

## Tech Stack

- **Frontend:** React Native (Expo)
- **Backend:** Firebase (Realtime Database, Authentication)

## Folder Structure

```
Fruit Fusion/
│
├── assets/                # Images and static assets
├── config/                # Firebase and app configuration
├── firebase/              # Firebase logic and helpers
├── screens/               # All app screens (Login, Signup, Dashboard, etc.)
├── services/              # Backend logic and API services
├── scripts/               # Utility scripts
├── App.js                 # App entry point
├── package.json           # Project dependencies
└── README.md              # Project documentation
```

## Firebase Features Used

- **Authentication:** User sign up, login, and admin authentication
- **Realtime Database:** Storing users, products, orders, and categories
- **Order Management:** Real-time order updates and admin order tracking

## API Integration

- All API calls are made using **Axios** for communication with Firebase Realtime Database.

## How to Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Faareha59/Fruit-Fusion.git
   cd Fruit-Fusion
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Firebase:**
   - Add your Firebase configuration in `config/firebaseConfig.js`.

4. **Start the app:**
   ```bash
   npx expo start
   ```

## Screens & Descriptions

- **SplashScreen:**  
  Displays the app logo and a brief animation when the app launches. Automatically navigates users to the Welcome screen after a short delay.

- **WelcomeScreen:**  
  Greets users and introduces the app. Offers navigation to login or signup screens and may display demo or onboarding content.

- **LoginScreen:**  
  Allows users to log in with their email and password. Handles authentication and redirects users to their respective dashboards.

- **SignupScreen:**  
  Enables new users to register by providing their email and password. Validates input and stores new user data in Firebase.

- **ProfileScreen:**  
  Lets users view and edit their profile information, such as name and email. Users can also log out from this screen.

- **AdminDashboardScreen:**  
  The main dashboard for admin users. Shows statistics (products, categories, orders) and provides navigation to admin management screens.

- **ManageProductsScreen:**  
  Allows admins to view, search, add, edit, and delete products. Displays product details and supports inventory management.

- **AdminOrdersScreen:**  
  Enables admins to view and manage all customer orders. Admins can update order statuses and track order progress in real time.

- **AdminCategoriesScreen:**  
  Lets admins view, add, and manage product categories. Ensures only authenticated admins can access this functionality.

- **CategoryManagementScreen:**  
  Provides advanced category management, including color assignment and editing for each category.

- **AddProductScreen:**  
  Allows admins to add new products by entering details such as name, description, price, stock, category, and image.

- **EditProductScreen:**  
  Enables admins to edit existing product details, including updating images, descriptions, price, stock, and category.

- **SimpleProductsScreen:**  
  Displays a categorized list of fruit salad products for users to browse, with images, descriptions, and prices.

- **ProductDetailsScreen:**  
  Shows detailed information about a selected product, including image, description, price, category, and quantity selection.

- **AddToBasketScreen:**  
  Lets users select the quantity of a product and add it to their shopping basket. Displays product details and total price.

## GitHub Repo

[https://github.com/Faareha59/Fruit-Fusion](https://github.com/Tooba-Baqai)

## Contributors

- Tooba Baqai(46489)
- Faareha Raza (47431)
