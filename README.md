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

## GitHub Repo

[https://github.com/Faareha59/Fruit-Fusion](https://github.com/Tooba-Baqai)

## Contributors

- Tooba Baqai(46489)
- Faareha Raza (47431)
