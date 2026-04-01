import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ordersAPI, reviewsAPI } from '../../services/api';
import ReviewForm from '../reviews/ReviewForm';
import { Link as RouterLink } from 'react-router-dom';
import { getImageUrl, placeholderDataUri } from '../../utils/imageUtils';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import Alert from '../common/Alert';
import Button from '../common/Button';

const OrderDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState('');
  const [productReviews, setProductReviews] = useState({}); // { productId: review }

  useEffect(() => {
    loadOrder();
    // Show success message if coming from checkout
    if (location.state?.success) {
      setMessage(location.state.message || 'Order placed successfully!');
      setTimeout(() => setMessage(''), 5000);
    }
  }, [id, location.state]);

  useEffect(() => {
    // Load existing reviews for delivered orders
    if (order && order.orderStatus === 'delivered' && order.items) {
      loadProductReviews();
    }
  }, [order, id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getOrder(id);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductReviews = async () => {
    if (!order || order.orderStatus !== 'delivered') return;

    const reviews = {};
    // Get unique product IDs (in case same product is ordered in different volumes)
    const uniqueProductIds = [...new Set(order.items.map(item => {
      const productId = typeof item.product === 'object' && item.product !== null
        ? String(item.product._id)
        : String(item.product);
      return productId;
    }))];

    for (const productId of uniqueProductIds) {
      try {
        const response = await reviewsAPI.getUserReview(id, productId);
        if (response.data.success && response.data.data) {
          reviews[productId] = response.data.data;
        }
      } catch (error) {
        // Silently fail - review might not exist yet
        console.error(`Error loading review for product:`, error);
      }
    }
    setProductReviews(reviews);
  };

  const handleReviewSubmitted = (reviewData) => {
    const productId = reviewData.product;
    setProductReviews(prev => ({
      ...prev,
      [productId]: reviewData
    }));
  };

  const handleReviewUpdated = (reviewData) => {
    const productId = reviewData.product;
    setProductReviews(prev => ({
      ...prev,
      [productId]: reviewData
    }));
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancelling(true);
    setMessage('');
    try {
      const response = await ordersAPI.cancelOrder(id);
      if (response.data.success) {
        setMessage('Order cancelled successfully');
        await loadOrder(); // Reload order to show updated status
        // Trigger event to update Header unread notification count
        window.dispatchEvent(new Event('notificationUpdated'));
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = order?.orderStatus === 'processing';
  const cannotModify = order?.orderStatus === 'shipped' || order?.orderStatus === 'delivered' || order?.orderStatus === 'confirmed';

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-500">Order not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/orders" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
        ← Back to Orders
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <StatusBadge status={order.orderStatus} />
        </div>
        <p className="text-sm text-gray-500">
          Placed on {new Date(order.createdAt).toLocaleDateString()}
        </p>
        {message && (
          <Alert
            type={message.includes('success') || message.includes('placed') ? 'success' : 'error'}
            message={message}
            className="mt-4"
          />
        )}
        {canCancel && (
          <Button
            onClick={handleCancelOrder}
            disabled={cancelling}
            variant="danger"
            className="mt-4"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        )}
        {cannotModify && (
          <p className="mt-4 text-sm text-gray-600">
            This order cannot be modified as it has been {order.orderStatus}.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {(() => {
                // Group items by product ID
                const groupedItems = {};
                order.items.forEach((item) => {
                  const productId = typeof item.product === 'object' && item.product !== null
                    ? String(item.product._id)
                    : String(item.product);

                  if (!groupedItems[productId]) {
                    groupedItems[productId] = {
                      productId,
                      items: [],
                      productImagePath: typeof item.product === 'object' && item.product !== null
                        ? item.product.image_path
                        : null,
                      productName: item.name
                    };
                  }
                  groupedItems[productId].items.push(item);
                });

                return Object.values(groupedItems).map((group) => {
                  const imageUrl = getImageUrl(group.productImagePath);
                  const totalPrice = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                  return (
                    <div key={group.productId} className="pb-4 border-b border-gray-200 last:border-0">
                      {/* Product Header with Image */}
                      <div className="flex items-center gap-4 mb-4">
                        {/* Product Image */}
                        <RouterLink
                          to={`/products/${group.productId}`}
                          className="flex-shrink-0"
                        >
                          <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex items-center justify-center p-1">
                            {imageUrl ? (
                              <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                                <img
                                  src={imageUrl}
                                  alt={group.productName}
                                  className="w-full h-full object-contain drop-shadow-sm"
                                  onError={(e) => {
                                    try { e.target.onerror = null; } catch (err) {}
                                    e.target.src = placeholderDataUri(80, 80, 'Perfume');
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </RouterLink>
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <RouterLink
                            to={`/products/${group.productId}`}
                            className="text-lg font-medium text-gray-900 hover:text-indigo-600 block"
                          >
                            {group.productName}
                          </RouterLink>
                          <div className="mt-1 space-y-1">
                            {group.items.map((item, itemIndex) => (
                              <p key={itemIndex} className="text-sm text-gray-500">
                                {item.volume ? `${item.volume}ml` : 'Standard'} - Quantity: {item.quantity} - €{(item.price * item.quantity).toFixed(2)}
                              </p>
                            ))}
                          </div>
                        </div>
                        {/* Total Price */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            €{totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {/* Review Form - Only show once per product */}
                      {order.orderStatus === 'delivered' && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <ReviewForm
                            productId={group.productId}
                            orderId={id}
                            productName={group.productName}
                            existingReview={productReviews[group.productId]}
                            onReviewSubmitted={handleReviewSubmitted}
                            onReviewUpdated={handleReviewUpdated}
                          />
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <div className="text-gray-700">
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>€{order.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>Free</span>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>€{order.totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Payment Information</h3>
              <p className="text-sm text-gray-600">Method: {order.paymentInfo.method}</p>
              {order.paymentInfo.demo && (
                <p className="text-xs text-yellow-600 mt-2">
                  Demo transaction - No real payment processed
                </p>
              )}
            </div>

            {order.trackingNumber && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Tracking</h3>
                <p className="text-sm text-gray-600">{order.trackingNumber}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

