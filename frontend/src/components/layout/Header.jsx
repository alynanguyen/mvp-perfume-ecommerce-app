import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useState, useEffect, useRef } from 'react';
import { notificationsAPI, productsAPI } from '../../services/api';
import MaterialIcon from '../common/MaterialIcon';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartItemCount } = useCart();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProductsMenu, setShowProductsMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileProductsMenu, setShowMobileProductsMenu] = useState(false);
  const [brands, setBrands] = useState([]);
  const userMenuRef = useRef(null);
  const productsMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load brands for products menu
  useEffect(() => {
    const loadBrands = async () => {
      try {
        // Fetch all products to get all brands (use high limit to get all products)
        const response = await productsAPI.getProducts({ limit: 1000 });
        const allProducts = response.data.data || [];
        const uniqueBrands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
        setBrands(uniqueBrands);
      } catch (error) {
        console.error('Error loading brands:', error);
      }
    };
    loadBrands();
  }, []);

  // Initialize search from URL if on products page
  useEffect(() => {
    if (location.pathname === '/products') {
      const params = new URLSearchParams(location.search);
      setSearchQuery(params.get('search') || '');
    } else {
      setSearchQuery('');
    }
  }, [location]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);

      // Listen for notification updates
      const handleNotificationUpdate = () => {
        loadUnreadCount();
      };
      window.addEventListener('notificationUpdated', handleNotificationUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener('notificationUpdated', handleNotificationUpdate);
      };
    }
  }, [isAuthenticated]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside user menu
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      // Check if click is outside products menu
      // Only close if click is truly outside the menu container
      if (productsMenuRef.current && !productsMenuRef.current.contains(event.target)) {
        setShowProductsMenu(false);
      }
      // Check if click is outside mobile menu
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        // Only close if clicking outside the menu (not on the hamburger button)
        if (!event.target.closest('[data-mobile-menu-button]')) {
          setShowMobileMenu(false);
        }
      }
    };

    if (showUserMenu || showProductsMenu || showMobileMenu) {
      // Use mousedown with a small delay to let click events fire first
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserMenu, showProductsMenu, showMobileMenu]);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getNotifications({ limit: 1 });
      setUnreadNotifications(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleProductsMenuClick = (e, type, value) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling to document
    // Close menu first
    setShowProductsMenu(false);
    // Navigate immediately
    if (type === 'all') {
      navigate('/products', { replace: false });
    } else if (type === 'brand') {
      navigate(`/products?brand=${encodeURIComponent(value)}`, { replace: false });
    } else if (type === 'gender') {
      navigate(`/products?gender=${encodeURIComponent(value)}`, { replace: false });
    } else if (type === 'bestSeller') {
      navigate('/products?availability=bestSeller', { replace: false });
    }
  };

  const handleProductsMenuMouseDown = (e) => {
    e.stopPropagation(); // Stop mousedown from bubbling to document click-outside handler
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* First Row - Mobile and Desktop */}
        <div className="flex flex-row justify-between items-center gap-4 py-3 md:py-0 md:h-16">
          <div className="flex items-center w-full md:w-auto justify-between md:justify-start">
            {/* Hamburger Menu Button - Mobile Only */}
            <button
              data-mobile-menu-button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-700 hover:text-indigo-600 transition-colors"
              aria-label="Toggle menu"
            >
              <MaterialIcon icon={showMobileMenu ? 'close' : 'menu'} size={24} />
            </button>
            <Link to="/" className="text-2xl font-bold text-indigo-600">
              Perfume Store
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8 flex-1 max-w-2xl mx-8">
            {/* Desktop Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Products Dropdown */}
            <div className="relative" ref={productsMenuRef}>
              <button
                onClick={() => setShowProductsMenu(!showProductsMenu)}
                className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600 transition-colors"
              >
                <span>Products</span>
                <MaterialIcon
                  icon="expand_more"
                  size={16}
                  className={`transition-transform ${showProductsMenu ? 'rotate-180' : ''}`}
                />
              </button>
              {showProductsMenu && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-2 z-50 border border-gray-200 max-h-96 overflow-y-auto">
                  <button
                    onMouseDown={handleProductsMenuMouseDown}
                    onClick={(e) => handleProductsMenuClick(e, 'all')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    All Products
                  </button>
                  <button
                    onMouseDown={handleProductsMenuMouseDown}
                    onClick={(e) => handleProductsMenuClick(e, 'bestSeller')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    Best Sellers
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Brands
                  </div>
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      onMouseDown={handleProductsMenuMouseDown}
                      onClick={(e) => handleProductsMenuClick(e, 'brand', brand)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      {brand}
                    </button>
                  ))}
                  <div className="border-t border-gray-200 my-1"></div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Gender
                  </div>
                  <button
                    onMouseDown={handleProductsMenuMouseDown}
                    onClick={(e) => handleProductsMenuClick(e, 'gender', 'Male')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    Male
                  </button>
                  <button
                    onMouseDown={handleProductsMenuMouseDown}
                    onClick={(e) => handleProductsMenuClick(e, 'gender', 'Female')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    Female
                  </button>
                  <button
                    onMouseDown={handleProductsMenuMouseDown}
                    onClick={(e) => handleProductsMenuClick(e, 'gender', 'Unisex')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    Unisex
                  </button>
                </div>
              )}
            </div>
            <Link
              to={isAuthenticated ? "/quiz" : "/login?redirect=/quiz"}
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Quiz
            </Link>
            {isAuthenticated && (
              <Link
                to="/orders"
                className="text-gray-700 hover:text-indigo-600 transition-colors"
              >
                Orders
              </Link>
            )}
          </div>

          {/* Mobile Navigation - Icons Only (Cart, Notifications, Account) */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Cart icon */}
            <Link
              to="/cart"
              className="relative text-gray-700 hover:text-indigo-600 transition-colors"
            >
              <MaterialIcon icon="shopping_cart" size={24} />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* Notifications icon - only if authenticated */}
            {isAuthenticated && (
              <Link
                to="/account?tab=notifications"
                className="relative text-gray-700 hover:text-indigo-600 transition-colors"
              >
                <MaterialIcon icon="notifications" size={24} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Link>
            )}

            {/* Account icon - only if authenticated */}
            {isAuthenticated && (
              <Link
                to="/account"
                className="text-gray-700 hover:text-indigo-600 transition-colors"
              >
                <MaterialIcon icon="account_circle" size={24} />
              </Link>
            )}
          </div>

          {/* Desktop Navigation - Cart, Notifications, User */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart icon - visible for both authenticated and non-authenticated users */}
            <Link
              to="/cart"
              className="relative text-gray-700 hover:text-indigo-600 transition-colors"
            >
              <MaterialIcon icon="shopping_cart" size={24} />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/account?tab=notifications"
                  className="relative text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  <MaterialIcon icon="notifications" size={24} />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </Link>
                {/* User Account Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center text-gray-700 hover:text-indigo-600 transition-colors p-2"
                  >
                    <MaterialIcon icon="account_circle" size={24} />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <Link
                        to="/account"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        My Account
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Second Row - Mobile Search Bar Only */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600"
              >
                <MaterialIcon icon="search" size={16} />
              </button>
            </div>
          </form>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileMenu(false)}
          />
          {/* Menu Panel */}
          <div
            ref={mobileMenuRef}
            className="absolute inset-y-0 left-0 w-80 bg-white shadow-xl overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Products Menu */}
              <div>
                <button
                  onClick={() => setShowMobileProductsMenu(!showMobileProductsMenu)}
                  className="flex items-center justify-between w-full text-left text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  <span>Products</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${showMobileProductsMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showMobileProductsMenu && (
                  <div className="mt-2 pl-4 space-y-2">
                    <button
                      onClick={(e) => {
                        handleProductsMenuClick(e, 'all');
                        setShowMobileMenu(false);
                      }}
                      className="block w-full text-left text-gray-700 hover:text-indigo-600 transition-colors"
                    >
                      All Products
                    </button>
                    <button
                      onClick={(e) => {
                        handleProductsMenuClick(e, 'bestSeller');
                        setShowMobileMenu(false);
                      }}
                      className="block w-full text-left text-gray-700 hover:text-indigo-600 transition-colors"
                    >
                      Best Sellers
                    </button>
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Brands
                    </div>
                    {brands.map((brand) => (
                      <button
                        key={brand}
                        onClick={(e) => {
                          handleProductsMenuClick(e, 'brand', brand);
                          setShowMobileMenu(false);
                        }}
                        className="block w-full text-left text-gray-700 hover:text-indigo-600 transition-colors py-1"
                      >
                        {brand}
                      </button>
                    ))}
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Gender
                    </div>
                    <button
                      onClick={(e) => {
                        handleProductsMenuClick(e, 'gender', 'Male');
                        setShowMobileMenu(false);
                      }}
                      className="block w-full text-left text-gray-700 hover:text-indigo-600 transition-colors py-1"
                    >
                      Male
                    </button>
                    <button
                      onClick={(e) => {
                        handleProductsMenuClick(e, 'gender', 'Female');
                        setShowMobileMenu(false);
                      }}
                      className="block w-full text-left text-gray-700 hover:text-indigo-600 transition-colors py-1"
                    >
                      Female
                    </button>
                    <button
                      onClick={(e) => {
                        handleProductsMenuClick(e, 'gender', 'Unisex');
                        setShowMobileMenu(false);
                      }}
                      className="block w-full text-left text-gray-700 hover:text-indigo-600 transition-colors py-1"
                    >
                      Unisex
                    </button>
                  </div>
                )}
              </div>

              {/* Quiz Link */}
              <Link
                to={isAuthenticated ? "/quiz" : "/login?redirect=/quiz"}
                onClick={() => setShowMobileMenu(false)}
                className="block text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors"
              >
                Quiz
              </Link>

              {/* Orders Link - Only if authenticated */}
              {isAuthenticated && (
                <Link
                  to="/orders"
                  onClick={() => setShowMobileMenu(false)}
                  className="block text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  Orders
                </Link>
              )}

              {/* Divider */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* User Account Section */}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/account"
                    onClick={() => setShowMobileMenu(false)}
                    className="block text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                  >
                    My Account
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setShowMobileMenu(false)}
                      className="block text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      logout();
                    }}
                    className="block w-full text-left text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setShowMobileMenu(false)}
                    className="block text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setShowMobileMenu(false)}
                    className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-lg font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

