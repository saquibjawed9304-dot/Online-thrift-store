# ThriftHub - Modern Thrift Store Web Application

ThriftHub is a premium, beginner-friendly thrift store web application designed for a seamless shopping experience. It features a modular architecture, clean code, and a stunning UI.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14+)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

### Installation
1.  **Clone the project**:
    ```bash
    git clone <repository-url>
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the application**:
    ```bash
    npm run dev
    ```

## 📁 Project Structure

The project has been organized for maximum readability and ease of maintenance:

### Frontend (`/public`)
- **`index.html`**: The clean entry point of the application, containing only the HTML structure.
- **`css/style.css`**: Centralized stylesheet for all premium animations and responsive designs.
- **`js/data.js`**: Contains static fallback product data for offline or demo use.
- **`js/app.js`**: Modular JavaScript logic covering authentication, routing, cart management, and API interactions.

### Backend
- **`server.js`**: The main entry point for the Node.js/Express server.
- **`routes/`**: Modular API endpoints for products, authentication, and orders.
- **`models/`**: MongoDB schemas defining the data structure.

## ✨ Features
- **Dynamic Routing**: Smooth page transitions without reloading.
- **Authentication**: Fully functional Login and Signup system.
- **Cart & Wishlist**: Persistent shopping experience using LocalStorage.
- **Premium Design**: Modern aesthetics with glassmorphism, hero sections, and micro-animations.
- **Partner Stores**: Interactive store locator using Google Maps integration.

## 🛠️ Built With
- **Frontend**: HTML5, Vanilla CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
