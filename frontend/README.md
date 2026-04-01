# Perfume Ecommerce Frontend

A modern React-based frontend for the Perfume Ecommerce application built with Vite, TailwindCSS, and React Router. Features a complete e-commerce experience with product browsing, shopping cart, order management, personalized perfume recommendations, and an admin panel.

## Features

### 🔐 Authentication & User Management
- User registration and login with JWT
- Forgot password with 6-digit reset code
- Account settings (edit profile, change password, delete account)
- Protected routes and session management
- Guest cart support (localStorage)

### 🛍️ Product Browsing & Discovery
- Browse all products with pagination (30 products per page)
- Advanced filtering:
  - Brand (multi-select)
  - Gender (Male, Female, Unisex)
  - Season (Spring, Summer, Autumn, Winter, All-year)
  - Price range (Below €100, €100-€300, Above €300)
  - Longevity (Soft/Moderate, Moderate/Strong, Very Strong)
  - Accords (Floral, Fruity & Sweet, Woody & Resinous, etc.)
  - Availability (On Sale, Best Seller, Limited Edition)
- Search functionality with fuzzy matching
- Sort options:
  - Newest
  - Price: Low to High
  - Price: High to Low
  - Highest Rated
  - Recommended for You (based on scent profile)
- Product detail pages with:
  - Full product information
  - Multiple volume/price options
  - Stock status display
  - "Notify me when back in stock" feature
  - Fragrance notes with images
  - Season and accords displayed as colored pills
  - Related products ("Maybe you will also like")
  - Reviews section with ratings and comments
  - 5-star rating display

### 🛒 Shopping Cart
- Add/remove items
- Update quantities
- View cart total
- Guest cart (localStorage) and authenticated cart
- Product images with no crop display
- Volume information for each item

### 📦 Order Management
- Step-by-step checkout process:
  1. Shipping address
  2. Coupon code (FREE code for 100% discount)
  3. Payment details (card input with validation)
- Order history
- Order details with product images
- Order cancellation (for processing orders only)
- Order status tracking
- Product reviews for delivered orders

### 🎯 Perfume Recommendation Quiz
- Interactive quiz with intro screen
- Personalized scent profile generation
- Product recommendations based on quiz results
- Scent profile view in "My Account"
- Retake quiz option
- Scroll position reset on question change
- Analyzing state with 10-second minimum display

### ⭐ Reviews System
- Submit reviews for delivered orders
- 5-star rating with comments
- View all product reviews
- Update/delete your own reviews
- Average rating displayed on products

### 🔔 Notifications
- Real-time notification system
- Unread count badge
- Order status change notifications
- Stock restoration notifications
- Mark as read/delete functionality

### 👤 My Account
- Centralized account management
- Tabs for:
  - Orders (view and manage)
  - Notifications
  - Account Settings
  - Scent Profile
- Edit profile information
- Change password
- Delete account (with order validation)
- Set up 6-digit reset code

### 👨‍💼 Admin Panel
- Dashboard with statistics
- Product management (CRUD operations)
- Order management (view, update status, search)
- Search functionality for products and orders
- Modal-based product editing
- Recent orders overview

### 🏠 Homepage
- Hero section with free shipping banner
- Best Sellers slider
- New Arrivals slider (random products)
- Shop by Brand slider (auto-sliding logos)
- Shop by Gender section
- Features section highlighting:
  - Premium Quality
  - Free Shipping (orders over €90)
  - Personalized Recommendations

### 📱 Responsive Design
- Mobile-first approach
- Hamburger menu for mobile navigation
- Mobile filter overlay with "Apply Filters" button
- Responsive product cards and layouts
- Touch-friendly interactions

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running (see backend README)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:5000/api
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

## Environment Variables

- `VITE_API_URL`: The base URL for the backend API (default: `http://localhost:5000/api`)

## Project Structure

```
src/
├── components/          # React components
│   ├── account/        # Account management components
│   ├── admin/          # Admin panel components
│   ├── auth/           # Authentication components
│   ├── cart/           # Shopping cart components
│   ├── common/         # Reusable shared components
│   │   ├── Alert.jsx           # Alert/message component
│   │   ├── Button.jsx          # Button component with variants
│   │   ├── Card.jsx            # Card container component
│   │   ├── LoadingSpinner.jsx  # Loading spinner component
│   │   ├── MaterialIcon.jsx    # Material Symbols icon wrapper
│   │   ├── PasswordInput.jsx  # Password input with visibility toggle
│   │   ├── QuantityInput.jsx  # Quantity selector with +/- buttons
│   │   ├── ScrollToTop.jsx     # Scroll reset on route change
│   │   ├── StatusBadge.jsx     # Status badge component
│   │   └── index.js            # Centralized exports
│   ├── layout/         # Layout components (Header, Footer)
│   ├── orders/         # Order components
│   ├── products/       # Product components
│   ├── quiz/           # Quiz components
│   └── reviews/        # Review components
├── context/            # React contexts (Auth, Cart)
├── services/           # API service layer
├── utils/              # Utility functions (imageUtils)
└── App.jsx             # Main App component with routing
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Overview

### Authentication
- User registration with optional 6-digit reset code setup
- Login with error handling
- Forgot password flow with 6-digit code verification
- Password visibility toggle
- Protected routes with redirects
- Session management with JWT tokens

### Products
- Browse all products with pagination
- Advanced multi-option filtering
- Search with fuzzy matching
- Sort by various criteria including personalized recommendations
- Product detail pages with comprehensive information
- Product images from `imgs/products/` directory
- Note images from `imgs/notes/` directory
- Stock notifications for out-of-stock products

### Shopping Cart
- Add/remove items
- Update quantities
- View cart total
- Guest cart (localStorage) for non-authenticated users
- Persistent cart for authenticated users
- Product images with full display (no crop)

### Orders
- View order history
- Order details with product images
- Step-by-step checkout process
- Coupon code application (FREE for 100% discount)
- Card payment input (demo mode)
- Order cancellation (processing orders only)
- Product reviews for delivered orders

### Quiz
- Interactive perfume recommendation quiz
- Intro screen before quiz starts
- Personalized scent profile generation
- Product recommendations based on quiz results
- Scent profile view in account section
- Retake quiz option
- Scroll management and loading states

### Reviews
- Submit reviews for products in delivered orders
- 5-star rating system
- Comment support (up to 1000 characters)
- View all product reviews with pagination
- Update/delete your own reviews
- Average rating displayed on products

### Notifications
- Real-time notification system
- Unread count badge in header
- Order status change notifications
- Stock restoration notifications
- Mark as read/delete functionality

### Admin Panel
- Dashboard with revenue and order statistics
- Product management (create, read, update, delete)
- Product search functionality
- Order management (view all, update status, search)
- Order search by order number, customer name, or email
- Modal-based product editing

## Backend Connection

Make sure the backend server is running on the port specified in `VITE_API_URL`. The frontend will make API calls to:
- `/api/auth/*` - Authentication endpoints
- `/api/products/*` - Product endpoints
- `/api/cart/*` - Cart endpoints
- `/api/orders/*` - Order endpoints
- `/api/quiz/*` - Quiz endpoints
- `/api/reviews/*` - Review endpoints
- `/api/notifications/*` - Notification endpoints
- `/api/products/:id/notify-stock` - Stock notification endpoints

## Image Handling

- Product images are served from `imgs/products/` directory
- Note images are served from `imgs/notes/` directory
- Images use `object-contain` for full display without cropping
- Fallback placeholders for missing images
- Image URLs are constructed using the `getImageUrl` utility

## Currency

All prices are displayed in Euro (€) throughout the application.

## Icons

The application uses Google Material Symbols icons (weight 200) via a custom `MaterialIcon` component with contextual sizing.

## Reusable Components

The project includes a set of reusable components in `src/components/common/` to ensure consistency and reduce code duplication:

### LoadingSpinner
Reusable loading spinner with configurable sizes and full-screen option:
```jsx
<LoadingSpinner size="md" fullScreen={true} />
```

### Alert
Alert/message component for success, error, warning, and info messages:
```jsx
<Alert type="success" message="Operation successful" onClose={handleClose} />
```

### Button
Standardized button component with variants (primary, secondary, danger, outline):
```jsx
<Button variant="primary" size="md" fullWidth={false} disabled={false}>
  Click Me
</Button>
```

### StatusBadge
Status badge component for order statuses and other status indicators:
```jsx
<StatusBadge status="delivered" size="md" />
```

### QuantityInput
Quantity selector with increment/decrement buttons:
```jsx
<QuantityInput value={quantity} onChange={setQuantity} min={1} max={10} />
```

### Card
Reusable card container with configurable padding, shadow, and sticky positioning:
```jsx
<Card padding="md" shadow="md" sticky={false}>
  Content here
</Card>
```

### Other Common Components
- **MaterialIcon**: Material Symbols icon wrapper
- **PasswordInput**: Password input with show/hide toggle
- **ScrollToTop**: Automatically resets scroll position on route changes

All common components can be imported from the centralized index:
```jsx
import { LoadingSpinner, Alert, Button, StatusBadge, QuantityInput, Card } from '../common';
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory. You can preview the build with:
```bash
npm run preview
```

## Technologies Used

- React 19
- Vite
- React Router DOM
- Axios
- TailwindCSS
- Google Material Symbols Icons
- Context API for state management

## Notes

- The checkout process uses demo mode - no real payments are processed
- Guest cart is stored in localStorage
- Product recommendations are based on the quiz results and scent profile
- Free shipping is available for orders over €90
- The application is fully responsive and optimized for mobile devices
- All product images display fully without cropping
- Reviews can only be submitted for products in delivered orders
