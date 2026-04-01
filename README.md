# Perfume E-commerce Platform

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce platform for selling premium perfumes. Features include product browsing, shopping cart, order management, personalized perfume recommendations through an interactive quiz, product reviews, notifications, and a comprehensive admin panel.

## 🚀 Features

### Customer Features
- **User Authentication**: Registration, login, forgot password with 6-digit reset code
- **Product Browsing**: Advanced filtering (brand, gender, season, price, longevity, accords, availability), search with fuzzy matching, pagination
- **Shopping Cart**: Guest cart support and authenticated cart with product images
- **Order Management**: Step-by-step checkout, order tracking, order cancellation
- **Perfume Quiz**: Interactive quiz for personalized scent profile and product recommendations
- **Product Reviews**: 5-star rating system with comments for delivered orders
- **Notifications**: Real-time notifications for order status changes and stock restorations
- **My Account**: Centralized account management with orders, notifications, settings, and scent profile
- **Product Recommendations**: Personalized recommendations based on scent profile

### Admin Features
- **Dashboard**: Revenue statistics and recent orders overview
- **Product Management**: Full CRUD operations with search functionality
- **Order Management**: View all orders, update status, search by order number/customer
- **Stock Management**: Track stock levels and trigger notifications on restock

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Context API** - State management
- **Google Material Symbols** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Crypto** - Reset code generation

## 📁 Project Structure

```
perfume-ecommerce/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # React contexts (Auth, Cart)
│   │   ├── services/        # API service layer
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json
├── backend/                  # Node.js/Express backend API
│   ├── controllers/         # Route controllers
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── middleware/          # Express middleware
│   ├── utils/               # Utility functions
│   ├── imgs/                # Product and note images
│   │   ├── products/        # Product images
│   │   └── notes/           # Fragrance note images
│   └── server.js            # Application entry point
└── README.md                # This file
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud instance)
- **npm** or **yarn**

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/alynanguyen/mvp-perfume-ecommerce-app.git
cd perfume-ecommerce
```

2. **Install backend dependencies:**
```bash
cd backend
npm install
```

3. **Install frontend dependencies:**
```bash
cd ../frontend
npm install
```

### Configuration

1. **Backend Configuration:**

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

2. **Frontend Configuration:**

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### Running the Application

1. **Start the backend server:**
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

2. **Start the frontend development server:**
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

3. **Open your browser:**
Navigate to `http://localhost:5173` to view the application

## 📚 Documentation

- [Frontend README](./frontend/README.md) - Detailed frontend documentation
- [Backend README](./backend/README.md) - Detailed backend documentation

## 🔑 Key Features Explained

### Product Filtering
- **Multi-option filters**: Brand, gender, season, accords, availability
- **Price range**: Below €100, €100-€300, Above €300
- **Longevity**: Soft/Moderate, Moderate/Strong, Very Strong
- **Search**: Fuzzy matching for typo-tolerant search
- **Sorting**: Newest, price, ratings, personalized recommendations

### Perfume Quiz
- Interactive quiz to determine user preferences
- Generates personalized scent profile
- Calculates suitability scores (0-100) for products
- Provides product recommendations based on quiz results

### Shopping Experience
- **Guest Cart**: Non-authenticated users can add items to cart (stored in localStorage)
- **Authenticated Cart**: Persistent cart for logged-in users
- **Checkout**: Step-by-step process (shipping → coupon → payment)
- **Free Shipping**: Available for orders over €90

### Reviews System
- Users can review products from delivered orders
- 5-star rating with optional comments
- Product average ratings automatically calculated
- One review per product per order

### Notifications
- Order status change notifications
- Stock restoration notifications
- Unread count badge
- Mark as read/delete functionality

## 🎨 Design Features

- **Responsive Design**: Mobile-first approach with hamburger menu
- **Material Symbols Icons**: Google Material Symbols (weight 200)
- **Currency**: All prices in Euro (€)
- **Image Display**: Full product images without cropping
- **Color-coded Elements**: Season and accord pills with pastel colors
- **Reusable Components**: Consistent UI components (Button, Alert, LoadingSpinner, StatusBadge, QuantityInput, Card) for maintainability

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- 6-digit reset code for password recovery
- Protected routes and admin authorization
- Input validation and sanitization

## 📦 API Endpoints

### Main Endpoints
- `/api/auth/*` - Authentication
- `/api/products/*` - Products
- `/api/cart/*` - Shopping cart
- `/api/orders/*` - Orders
- `/api/quiz/*` - Perfume quiz
- `/api/reviews/*` - Product reviews
- `/api/notifications/*` - Notifications

See [Backend README](./backend/README.md) for complete API documentation.

## 🧪 Development

### Backend Scripts
```bash
cd backend
npm run dev      # Start development server with nodemon
npm start        # Start production server
```

### Frontend Scripts
```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 📝 Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT expiration time
- `CLIENT_ORIGIN` - Frontend URL for CORS
- `NODE_ENV` - Environment (development/production)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)

## 🗄️ Database

The application uses MongoDB with the following main collections:
- **Users** - User accounts and authentication
- **Products** - Perfume products with details
- **Carts** - Shopping cart items
- **Orders** - Order history and details
- **ScentProfiles** - User scent profiles from quiz
- **Reviews** - Product reviews and ratings
- **Notifications** - User notifications
- **StockNotifications** - Stock notification subscriptions

## 🚢 Deployment

### Building for Production

1. **Build the frontend:**
```bash
cd frontend
npm run build
```
Output will be in `frontend/dist/`

2. **Start the backend:**
```bash
cd backend
npm start
```

### Production Considerations
- Set `NODE_ENV=production`
- Use secure JWT secrets
- Configure CORS for production domain
- Set up MongoDB connection string
- Serve frontend build files (can use Express static middleware or separate hosting)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Nguyen Tran Van Anh

## 🙏 Acknowledgments

- Premium perfume brands featured in the platform
- Material Symbols by Google
- All open-source libraries and frameworks used

## 📞 Support

For support, email vananhnguyen221003@gmail.com or open an issue in the repository.

---

**Note**: This is a demo e-commerce platform. The checkout process uses demo mode - no real payments are processed. Always use the "FREE" coupon code for 100% discount during testing.

