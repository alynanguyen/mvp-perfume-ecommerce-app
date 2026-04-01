import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl, placeholderDataUri } from '../../utils/imageUtils';

const Checkout = () => {
  const { cart, cartTotal, loadCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || '',
  });
  const [paymentMethod] = useState('card'); // Only card payment available
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [detectedCardType, setDetectedCardType] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    // Require authentication for checkout
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate, isAuthenticated]);

  const handleCouponApply = (e) => {
    e.preventDefault();
    setCouponError('');

    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    const code = couponCode.trim().toUpperCase();
    if (code === 'FREE') {
      setDiscount(cartTotal);
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code. Please use "FREE" for 100% discount.');
      setCouponApplied(false);
      setDiscount(0);
    }
  };

  const detectCardType = (cardNumber) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!cleaned) return null;

    // Visa: starts with 4
    if (cleaned.startsWith('4')) {
      return 'visa';
    }
    // Mastercard: starts with 5 (51-55)
    if (cleaned.startsWith('5') && cleaned.length >= 2) {
      const firstTwo = parseInt(cleaned.substring(0, 2));
      if (firstTwo >= 51 && firstTwo <= 55) {
        return 'mastercard';
      }
    }
    // American Express: starts with 3 (34 or 37)
    if (cleaned.startsWith('3') && cleaned.length >= 2) {
      const firstTwo = cleaned.substring(0, 2);
      if (firstTwo === '34' || firstTwo === '37') {
        return 'amex';
      }
    }
    return null;
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16) {
      value = value.match(/.{1,4}/g)?.join(' ') || value;
      setCardDetails({ ...cardDetails, cardNumber: value });
      // Detect card type
      const cardType = detectCardType(value);
      setDetectedCardType(cardType);
    }
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
      }
      setCardDetails({ ...cardDetails, expiryDate: value });
    }
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) {
      setCardDetails({ ...cardDetails, cvv: value });
    }
  };

  const validateShippingAddress = () => {
    if (!shippingAddress.street.trim()) {
      return 'Please enter street address';
    }
    if (!shippingAddress.city.trim()) {
      return 'Please enter city';
    }
    if (!shippingAddress.zipCode.trim()) {
      return 'Please enter zip code';
    }
    if (!shippingAddress.country.trim()) {
      return 'Please enter country';
    }
    return null;
  };

  const validateCardDetails = () => {
    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
      return 'Please enter a valid 16-digit card number';
    }
    if (!cardDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
      return 'Please enter a valid expiry date (MM/YY)';
    }
    const [month, year] = cardDetails.expiryDate.split('/');
    const expiryMonth = parseInt(month);
    const expiryYear = 2000 + parseInt(year);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return 'Card has expired';
    }
    if (!cardDetails.cvv || cardDetails.cvv.length !== 3) {
      return 'Please enter a valid 3-digit CVV';
    }
    if (!cardDetails.cardholderName || cardDetails.cardholderName.trim().length < 2) {
      return 'Please enter cardholder name';
    }
    return null;
  };

  const handleNext = () => {
    setError('');

    if (currentStep === 1) {
      // Validate shipping address
      const addressError = validateShippingAddress();
      if (addressError) {
        setError(addressError);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate coupon code
      if (!couponApplied || couponCode.trim().toUpperCase() !== 'FREE') {
        setError('You must apply the "FREE" coupon code to proceed.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevious = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setPaymentProcessing(false);
    setPaymentSuccess(false);

    // Validate coupon code
    if (!couponApplied || couponCode.trim().toUpperCase() !== 'FREE') {
      setError('You must apply the "FREE" coupon code to proceed. This ensures no real money is charged.');
      setLoading(false);
      return;
    }

    // Validate card details
    const cardValidationError = validateCardDetails();
    if (cardValidationError) {
      setError(cardValidationError);
      setLoading(false);
      return;
    }

    try {
      const finalTotal = cartTotal - discount;

      const orderData = {
        shippingAddress,
        paymentMethod: 'card',
        paymentIntentId: `demo-${Date.now()}`,
        couponCode: 'FREE',
        discount: discount,
        totalPrice: finalTotal,
        cardDetails: {
          last4: cardDetails.cardNumber.slice(-4).replace(/\s/g, ''),
          brand: detectedCardType || 'visa',
        }
      };

      // Show payment processing state
      setPaymentProcessing(true);

      // Simulate payment processing delay (1-2 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await ordersAPI.createOrder(orderData);
      if (response.data.success) {
        // Show payment success state
        setPaymentProcessing(false);
        setPaymentSuccess(true);

        await loadCart();
        // Trigger event to update Header unread notification count
        window.dispatchEvent(new Event('notificationUpdated'));

        // Wait a bit to show success message, then navigate to cart
        setTimeout(() => {
          navigate('/cart', {
            state: {
              success: true,
              message: 'Order placed successfully!',
              orderNumber: response.data.data.orderNumber
            }
          });
        }, 2000);
      }
    } catch (err) {
      setPaymentProcessing(false);
      setPaymentSuccess(false);
      setError(err.response?.data?.message || 'Failed to create order');
      setLoading(false);
    }
  };

  if (!cart || !cart.items || cart.items.length === 0) {
    return null;
  }

  const steps = [
    { number: 1, title: 'Shipping Address' },
    { number: 2, title: 'Coupon Code' },
    { number: 3, title: 'Payment Details' },
  ];

  return (
    <>
      {/* Payment Processing Overlay */}
      {(paymentProcessing || paymentSuccess) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            {paymentProcessing && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h3>
                <p className="text-gray-600">Please wait while we process your payment...</p>
              </div>
            )}
            {paymentSuccess && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600">Your order has been placed successfully.</p>
                <p className="text-sm text-gray-500 mt-2">Redirecting to cart...</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      {/* Step Indicator */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  {currentStep > step.number ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${currentStep >= step.number ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Shipping Address */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="State/Province (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.zipCode}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.country}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
          )}

          {/* Step 2: Coupon Code */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Coupon Code</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code (Use 'FREE' for 100% off)"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  if (couponApplied) {
                    setCouponApplied(false);
                    setDiscount(0);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={couponApplied}
              />
              <button
                type="button"
                onClick={handleCouponApply}
                disabled={couponApplied}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {couponApplied ? 'Applied' : 'Apply'}
              </button>
            </div>
            {couponError && (
              <p className="mt-2 text-sm text-red-600">{couponError}</p>
            )}
            {couponApplied && (
              <p className="mt-2 text-sm text-green-600 font-medium">
                ✓ Coupon "FREE" applied! 100% discount applied.
              </p>
            )}
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Required:</strong> You must apply the "FREE" coupon code before placing your order. This ensures no real money is charged.
              </p>
            </div>
          </div>
          )}

          {/* Step 3: Payment Details */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={cardDetails.cardholderName}
                  onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    className="w-full px-3 py-2 pr-24 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5">
                    {/* Visa Logo */}
                    <div className={`transition-all duration-200 ${detectedCardType === 'visa' ? 'opacity-100 scale-110' : detectedCardType === null ? 'opacity-40' : 'opacity-20'}`} title="Visa">
                      <div className="w-10 h-6 rounded bg-[#1434CB] flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold tracking-wider">VISA</span>
                      </div>
                    </div>
                    {/* Mastercard Logo */}
                    <div className={`transition-all duration-200 ${detectedCardType === 'mastercard' ? 'opacity-100 scale-110' : detectedCardType === null ? 'opacity-40' : 'opacity-20'}`} title="Mastercard">
                      <div className="w-10 h-6 rounded relative overflow-hidden bg-[#EB001B]">
                        <div className="absolute left-0 top-0 w-1/2 h-full bg-[#EB001B] rounded-l"></div>
                        <div className="absolute right-0 top-0 w-1/2 h-full bg-[#F79E1B] rounded-r"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full border-2 border-white"></div>
                        </div>
                      </div>
                    </div>
                    {/* American Express Logo */}
                    <div className={`transition-all duration-200 ${detectedCardType === 'amex' ? 'opacity-100 scale-110' : detectedCardType === null ? 'opacity-40' : 'opacity-20'}`} title="American Express">
                      <div className="w-10 h-6 rounded bg-[#006FCF] flex items-center justify-center">
                        <span className="text-white text-[7px] font-bold tracking-tight">AMEX</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={cardDetails.expiryDate}
                    onChange={handleExpiryChange}
                    maxLength={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={handleCvvChange}
                    maxLength={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Card details are collected for demonstration purposes. With the "FREE" coupon code applied, no real payment will be processed.
              </p>
            </div>
          </div>
          )}

          {/* Navigation Buttons */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !couponApplied}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Processing...' : 'Place Order (€0.00)'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-4 mb-4">
              {cart.items.map((item) => {
                const itemPrice = Array.isArray(item.price)
                  ? (item.price.length > 0 ? item.price[0] : 0)
                  : (item.price || 0);
                const itemVolume = item.volume || 0;
                const imageUrl = getImageUrl(item.product?.image_path);
                return (
                  <div key={item._id || item.product?._id} className="flex gap-3">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-16 h-16 bg-white rounded-lg overflow-hidden flex items-center justify-center p-1">
                      {imageUrl ? (
                        <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                          <img
                            src={imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-contain drop-shadow-sm"
                            onError={(e) => {
                              try { e.target.onerror = null; } catch (err) {}
                              e.target.src = placeholderDataUri(64, 64, 'Perfume');
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
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 font-medium">
                        {item.product.name} {itemVolume > 0 ? `- ${itemVolume}ml` : ''}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Quantity: {item.quantity}
                      </div>
                    </div>
                    {/* Price */}
                    <div className="flex-shrink-0 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        €{(itemPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>€{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping fee</span>
                <span>€0.00</span>
              </div>
              {couponApplied && discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount (FREE)</span>
                  <span>-€{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>€{(cartTotal - discount).toFixed(2)}</span>
              </div>
              {couponApplied && (
                <p className="text-xs text-green-600 font-medium text-center pt-2">
                  ✓ Order total: €0.00 (100% discount applied)
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {currentStep === 2 && !couponApplied && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Required:</strong> Please apply the "FREE" coupon code to continue.
                </p>
              </div>
            )}

            {currentStep === 3 && !couponApplied && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  <strong>Required:</strong> Please go back and apply the "FREE" coupon code.
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
    </>
  );
};

export default Checkout;


