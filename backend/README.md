# Perfume E-commerce Backend

A comprehensive RESTful API backend for a perfume e-commerce platform built with Node.js, Express, and MongoDB. Features include user authentication, product management, shopping cart, orders, personalized perfume recommendations, reviews, notifications, and admin functionality.

## Features

### 🔐 Authentication & Authorization
- User signup and login with JWT
- Forgot password with 6-digit reset code
- Password reset functionality
- Role-based access control (Admin/User)
- Protected routes and admin-only operations
- Optional authentication for public routes

### 🛍️ Product Management
- Comprehensive perfume details:
  - Brand, name, country, gender, type
  - Fragrance notes (top, middle, base)
  - Accords and seasons
  - Multiple prices/volumes per product
  - Original prices for sale items
  - Stock management
  - Product images from `imgs/products/` directory
- Advanced search and filtering:
  - Search by name, brand, description (with fuzzy matching)
  - Filter by brand, gender, season, type
  - Price range filtering
  - Longevity filtering
  - Accord filtering
  - Availability filtering (onSale, bestSeller, limitedEdition)
- Sorting options:
  - Newest
  - Price (ascending/descending)
  - Highest rated
  - Recommended (based on scent profile)
- Pagination support (30 products per page)
- Product suitability scoring based on user scent profile
- Stock notifications for out-of-stock products

### 🛒 Shopping Features
- Shopping cart management:
  - Add/remove items
  - Update quantities
  - Guest cart support
  - Price selection from price arrays
- Order processing:
  - Create orders with shipping address
  - Order status management (processing, confirmed, shipped, delivered, cancelled)
  - Order cancellation with stock restoration
  - Order history retrieval
  - Order number generation

### 🎯 Perfume Recommendation Quiz
- Quiz questions and answers management
- Scent profile creation and updates
- Product recommendation algorithm:
  - Gender matching
  - Vibe matching
  - Season matching
  - Longevity matching
  - Accord matching
  - Note preferences (liked/disliked)
  - Price range matching
- Personalized product recommendations
- Suitability score calculation (0-100)

### ⭐ Reviews System
- Product reviews with ratings (1-5 stars) and comments
- Review submission for delivered orders only
- Review updates and deletion
- Product average rating calculation
- One review per product per order per user

### 🔔 Notifications
- Real-time notification system
- Notification types:
  - Order status changes
  - Order placed
  - Order cancelled
  - Stock restored
  - General notifications
- Unread count tracking
- Mark as read/delete functionality

### 📦 Stock Notifications
- Subscribe/unsubscribe to product stock notifications
- Automatic notifications when out-of-stock products are restocked
- Notification triggered on product stock update

### 👨‍💼 Admin Features
- Admin dashboard with statistics:
  - Total revenue
  - Total orders
  - Recent orders
- Product management (CRUD operations)
- Order management:
  - View all orders
  - Update order status
  - Search orders by order number, customer name, or email

## Tech Stack

- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Crypto for reset code generation
- CORS enabled
- Environment variables for configuration
- Static file serving for images

## Project Structure

```
backend/
├── config/
│   └── db.js                    # Database configuration
├── controllers/
│   ├── authController.js       # User authentication logic
│   ├── cartController.js       # Shopping cart operations
│   ├── notificationController.js # Notification management
│   ├── orderController.js      # Order processing
│   ├── paymentController.js    # Payment handling
│   ├── productController.js    # Product management
│   ├── quizController.js     # Perfume-matching quiz
│   ├── reviewController.js     # Review management
│   └── stockNotificationController.js # Stock notifications
├── data/
│   ├── parfum_dataset_cleaned.json # Product dataset
│   └── quiz.json               # Quiz metadata
├── imgs/
│   ├── products/               # Product images
│   └── notes/                  # Fragrance note images
├── middleware/
│   ├── authMiddleware.js       # JWT authentication
│   ├── errorHandler.js         # Global error handling
│   └── validation.js           # Request validation
├── models/
│   ├── Cart.js                 # Shopping cart schema
│   ├── Notification.js         # Notification schema
│   ├── Order.js                # Order schema
│   ├── Product.js              # Product schema
│   ├── Review.js               # Review schema
│   ├── ScentProfile.js         # Scent profile schema
│   ├── StockNotification.js    # Stock notification schema
│   └── User.js                 # User schema
├── routes/
│   ├── authRoutes.js           # Authentication routes
│   ├── cartRoutes.js           # Cart routes
│   ├── notificationRoutes.js   # Notification routes
│   ├── orderRoutes.js          # Order routes
│   ├── paymentRoutes.js        # Payment routes
│   ├── productRoutes.js        # Product routes
│   ├── quizRoutes.js           # Quiz routes
│   └── reviewRoutes.js         # Review routes
├── scripts/
│   ├── addAvailabilityFlags.js # Script to add availability flags
│   └── addSalePrices.js        # Script to add sale prices
├── utils/
│   └── quizAlgorithm.js       # Quiz recommendation algorithm
├── .env                        # Environment variables
├── .gitignore
├── package.json
└── server.js                   # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000` (or the port specified in `.env`).

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/forgot-password` - Request password reset (send email)
- `POST /api/auth/verify-reset-code` - Verify 6-digit reset code
- `POST /api/auth/reset-password` - Reset password with code
- `PUT /api/auth/change-password` - Change password (authenticated)
- `PUT /api/auth/setup-reset-code` - Set up 6-digit reset code
- `DELETE /api/auth/delete-account` - Delete user account

### Products
- `GET /api/products` - Get all products with filters
  - Query params:
    - `minPrice`, `maxPrice` - Price range
    - `brand` - Brand filter (comma-separated)
    - `search` - Search query (fuzzy matching)
    - `sort` - Sort option (price_asc, price_desc, reviews, recommended, year)
    - `gender` - Gender filter (comma-separated)
    - `season` - Season filter (comma-separated)
    - `type` - Product type filter
    - `minLongevity`, `maxLongevity` - Longevity range
    - `availability` - Availability filter (onSale, bestSeller, limitedEdition)
    - `accord` - Accord filter (comma-separated)
    - `page` - Page number (default: 1)
    - `limit` - Items per page (default: 30)
- `GET /api/products/:id` - Get single product (with suitability score if authenticated)
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin, triggers stock notifications)
- `DELETE /api/products/:id` - Delete product (Admin)
- `GET /api/products/:id/notify-stock` - Check stock notification subscription
- `POST /api/products/:id/notify-stock` - Subscribe to stock notifications
- `DELETE /api/products/:id/notify-stock` - Unsubscribe from stock notifications

### Shopping Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:itemId` - Update cart item quantity
- `DELETE /api/cart/:itemId` - Remove item from cart

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/cancel` - Cancel order (processing orders only)
- `GET /api/orders/admin/all` - Get all orders (Admin)
- `PUT /api/orders/admin/:id` - Update order status (Admin)

### Quiz
- `GET /api/quiz/questions` - Get quiz questions
- `POST /api/quiz/submit` - Submit quiz answers
- `GET /api/quiz/profile` - Get user's scent profile
- `PUT /api/quiz/profile` - Update scent profile (retake quiz)

### Reviews
- `POST /api/reviews` - Create review (for delivered orders)
- `GET /api/reviews/product/:productId` - Get product reviews (paginated)
- `GET /api/reviews/order/:orderId/product/:productId` - Get user's review for product in order
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Notifications
- `GET /api/notifications` - Get user's notifications (paginated)
- `GET /api/notifications/unread-count` - Get unread notification count
- `PUT /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification
- `PUT /api/notifications/read-all` - Mark all notifications as read

### Payments
- `POST /api/payments/create-payment-intent` - Create payment intent (demo mode)
- `POST /api/payments/webhook` - Payment webhook handler

## Product Schema

Products in the database follow this structure:
```javascript
{
  name: String,
  brand: String,
  country: String,
  gender: [String],
  type: String,
  accords: [String],
  notes: {
    top_notes: [String],
    middle_notes: [String],
    base_notes: [String]
  },
  description: String,
  season: [String],
  weather: [String],
  price: [Number],              // Array of prices
  originalPrice: [Number],      // Array of original prices (for sale items)
  volume: [Number],             // Array of volumes
  year: Number,
  reviews: Number,              // Average rating
  longevity: {
    min: Number,
    max: Number
  },
  sillage: String,
  image_path: String,
  stock: Number,
  onSale: Boolean,
  bestSeller: Boolean,
  limitedEdition: Boolean
}
```

## Image Serving

- Product images are served from `imgs/products/` directory
- Note images are served from `imgs/notes/` directory
- Static files are served via Express static middleware
- Image paths are relative to the backend root directory

## Quiz Algorithm

The recommendation algorithm calculates a suitability score (0-100) based on:
- Gender preference matching (20 points)
- Vibe matching (15 points)
- Season matching (10 points)
- Longevity matching (15 points)
- Accord matching (20 points)
- Liked notes matching (10 points)
- Disliked notes penalty (10 points deduction)
- Price range matching (10 points)

## Error Handling

The API uses consistent error response format:
```javascript
{
  success: false,
  message: "Error message here"
}
```

## Authentication

The API uses JWT for authentication. Include the token in requests:
```
Authorization: Bearer <your_jwt_token>
```

Some routes support optional authentication (e.g., `/api/products`) where the token is optional but provides additional features (like suitability scores) when present.

## Stock Notifications

When a product's stock is updated from 0 (or less) to a positive value:
1. The system automatically finds all users subscribed to stock notifications for that product
2. Creates notifications for those users
3. Marks the subscriptions as notified

## Reviews

- Users can only review products from delivered orders
- One review per product per order per user
- Product average ratings are automatically calculated
- Reviews include rating (1-5 stars) and optional comment (max 1000 characters)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
