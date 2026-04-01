import { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const GUEST_CART_KEY = 'guestCart';

// Helper functions for guest cart
const getGuestCart = () => {
  try {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : { items: [], totalPrice: 0 };
  } catch (error) {
    console.error('Error reading guest cart:', error);
    return { items: [], totalPrice: 0 };
  }
};

const saveGuestCart = (cart) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving guest cart:', error);
  }
};

const clearGuestCart = () => {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch (error) {
    console.error('Error clearing guest cart:', error);
  }
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // Load user cart and merge with guest cart if exists
      loadCartAndMerge();
    } else {
      // Load guest cart from localStorage
      const guestCart = getGuestCart();
      // Ensure cart has proper structure
      if (!guestCart.items) {
        guestCart.items = [];
      }
      if (guestCart.totalPrice === undefined) {
        guestCart.totalPrice = 0;
      }
      setCart(guestCart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCart(response.data.data);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCartAndMerge = async () => {
    try {
      setLoading(true);
      const guestCart = getGuestCart();

      // Load user cart
      const response = await cartAPI.getCart();
      const userCart = response.data.data;

      // If guest cart has items, merge them into user cart
      if (guestCart.items && guestCart.items.length > 0) {
        for (const guestItem of guestCart.items) {
          try {
            await cartAPI.addToCart({
              productId: guestItem.product?._id || guestItem.productId,
              quantity: guestItem.quantity,
              priceIndex: guestItem.priceIndex
            });
          } catch (error) {
            console.error('Error merging cart item:', error);
          }
        }
        // Reload cart after merging
        const updatedResponse = await cartAPI.getCart();
        setCart(updatedResponse.data.data);
        // Clear guest cart after successful merge
        clearGuestCart();
      } else {
        setCart(userCart);
      }
    } catch (error) {
      console.error('Error loading and merging cart:', error);
      // Fallback to guest cart if user cart fails
      const guestCart = getGuestCart();
      setCart(guestCart);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1, priceIndex = undefined) => {
    if (!isAuthenticated) {
      // Guest cart - store in localStorage
      try {
        const productsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products/${productId}`);
        const productData = await productsResponse.json();
        const product = productData.data;

        if (!product) {
          return { success: false, message: 'Product not found' };
        }

        // Get price and volume
        const itemPrice = Array.isArray(product.price) && product.price.length > 0
          ? (priceIndex !== undefined && priceIndex >= 0 && priceIndex < product.price.length
              ? product.price[priceIndex]
              : Math.min(...product.price))
          : (product.price || 0);

        const itemVolume = Array.isArray(product.volume) && product.volume.length > 0
          ? (priceIndex !== undefined && priceIndex >= 0 && priceIndex < product.volume.length
              ? product.volume[priceIndex]
              : product.volume[0])
          : (product.volume || 0);

        const guestCart = getGuestCart();
        const existingItemIndex = guestCart.items.findIndex(
          item => (item.product?._id || item.productId) === productId &&
                  item.priceIndex === priceIndex
        );

        if (existingItemIndex >= 0) {
          guestCart.items[existingItemIndex].quantity += quantity;
        } else {
          // Create tempId for guest cart items
          const tempId = `guest_${productId}_${priceIndex || 0}_${Date.now()}`;
          guestCart.items.push({
            _id: tempId,
            tempId: tempId,
            product: { _id: productId, name: product.name, image_path: product.image_path, brand: product.brand },
            productId: productId,
            quantity,
            price: itemPrice,
            volume: itemVolume,
            priceIndex: priceIndex || 0
          });
        }

        // Recalculate total
        guestCart.totalPrice = guestCart.items.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);

        saveGuestCart(guestCart);
        setCart(guestCart);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.message || 'Failed to add to cart',
        };
      }
    } else {
      // Authenticated user - use API
      try {
        const response = await cartAPI.addToCart({ productId, quantity, priceIndex });
        setCart(response.data.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to add to cart',
        };
      }
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    if (!isAuthenticated) {
      // Guest cart
      const guestCart = getGuestCart();
      const itemIndex = guestCart.items.findIndex(item => item._id === itemId || item.tempId === itemId);

      if (itemIndex >= 0) {
        if (quantity <= 0) {
          guestCart.items.splice(itemIndex, 1);
        } else {
          guestCart.items[itemIndex].quantity = quantity;
        }

        guestCart.totalPrice = guestCart.items.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);

        saveGuestCart(guestCart);
        setCart(guestCart);
        return { success: true };
      }
      return { success: false, message: 'Item not found' };
    } else {
      // Authenticated user
      try {
        const response = await cartAPI.updateCartItem(itemId, { quantity });
        setCart(response.data.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update cart',
        };
      }
    }
  };

  const removeFromCart = async (itemId) => {
    if (!isAuthenticated) {
      // Guest cart
      const guestCart = getGuestCart();
      guestCart.items = guestCart.items.filter(item => item._id !== itemId && item.tempId !== itemId);

      guestCart.totalPrice = guestCart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);

      saveGuestCart(guestCart);
      setCart(guestCart);
      return { success: true };
    } else {
      // Authenticated user
      try {
        const response = await cartAPI.removeFromCart(itemId);
        setCart(response.data.data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to remove from cart',
        };
      }
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) {
      // Guest cart
      clearGuestCart();
      setCart({ items: [], totalPrice: 0 });
      return { success: true };
    } else {
      // Authenticated user
      try {
        await cartAPI.clearCart();
        setCart(null);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to clear cart',
        };
      }
    }
  };

  const cartItemCount = cart?.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
  const cartTotal = cart?.totalPrice || 0;

  const value = {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    loadCart,
    cartItemCount,
    cartTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

