import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getImageUrl, placeholderDataUri } from '../../utils/imageUtils';
import QuantityInput from '../common/QuantityInput';

const CartItem = ({ item }) => {
  const { updateCartItem, removeFromCart } = useCart();
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [updating, setUpdating] = useState(false);

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1) return;
    if (!item) return;
    setUpdating(true);
    setQuantity(newQuantity);
    try {
      // Use _id if available, otherwise use tempId or index
      const itemId = item._id || item.tempId || item.product?._id;
      await updateCartItem(itemId, newQuantity);
    } catch (err) {
      console.error('updateCartItem failed', err);
    }
    setUpdating(false);
  };

  const handleRemove = async () => {
    if (!item) return;
    setUpdating(true);
    try {
      // Use _id if available, otherwise use tempId or index
      const itemId = item._id || item.tempId || item.product?._id;
      await removeFromCart(itemId);
    } catch (err) {
      console.error('removeFromCart failed', err);
    }
    setUpdating(false);
  };

  const product = item?.product || {};
  // Handle price - it might be a number or an array
  const itemPrice = item.price || 0;
  const itemVolume = item.volume || 0;
  const itemTotal = itemPrice * quantity;

  // If product data is missing, avoid rendering the item (prevents crashes)
  if (!item || !item.product) {
    console.error('Invalid cart item encountered:', item);
    return null;
  }

  return (
    <div className="p-4 flex items-center space-x-4">
      <Link to={`/products/${product._id}`} className="flex-shrink-0">
        <div className="w-24 h-24 bg-white rounded-lg overflow-hidden flex items-center justify-center p-2">
          {getImageUrl(product.image_path) ? (
            <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
              <img
                src={getImageUrl(product.image_path)}
                alt={product.name}
                className="w-full h-full object-contain drop-shadow-lg"
                onError={(e) => {
                  try { e.target.onerror = null; } catch (err) {}
                  e.target.src = placeholderDataUri(100, 100, 'Perfume');
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={`/products/${product._id}`} className="text-lg font-medium text-gray-900 hover:text-indigo-600">
          {product.name}
        </Link>
        <p className="text-sm text-gray-500">{product.brand}</p>
        <p className="text-sm text-gray-600">{itemVolume}ml</p>
        <p className="text-sm font-medium text-gray-900 mt-1">€{itemPrice.toFixed(2)}</p>
      </div>

      <div className="flex items-center space-x-4">
        <QuantityInput
          value={quantity}
          onChange={handleQuantityChange}
          min={1}
          disabled={updating}
        />

        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">€{itemTotal.toFixed(2)}</p>
        </div>

        <button
          onClick={handleRemove}
          disabled={updating}
          className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Remove item"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CartItem;

