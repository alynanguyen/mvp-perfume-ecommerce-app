import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsAPI, reviewsAPI } from '../../services/api';
import MaterialIcon from '../common/MaterialIcon';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl, placeholderDataUri } from '../../utils/imageUtils';
import ProductCard from './ProductCard';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import Button from '../common/Button';
import QuantityInput from '../common/QuantityInput';

// Helper function to convert note name to image file name
// "Orange Blossom" -> "orange_blossom.png"
// "Ylang-ylang" -> "ylang-ylang.png"
const getNoteImagePath = (noteName) => {
  if (!noteName) return null;
  // Convert to lowercase, replace spaces with underscores, keep hyphens
  const imageName = noteName.toLowerCase().replace(/\s+/g, '_');
  return `imgs/notes/${imageName}.png`;
};

// Get the full URL for a note image
const getNoteImageUrl = (noteName) => {
  const imagePath = getNoteImagePath(noteName);
  if (!imagePath) return null;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace('/api', '');
  return `${baseUrl}/${imagePath}`;
};

// Get color for season pill
const getSeasonColor = (season) => {
  const seasonColors = {
    'Spring': 'bg-pink-200 text-pink-800 border-pink-300',
    'Summer': 'bg-yellow-200 text-yellow-800 border-yellow-300',
    'Autumn': 'bg-orange-200 text-orange-800 border-orange-300',
    'Fall': 'bg-orange-200 text-orange-800 border-orange-300', // Fall is same as Autumn
    'Winter': 'bg-blue-200 text-blue-800 border-blue-300',
    'All-year': 'bg-green-200 text-green-800 border-green-300'
  };
  return seasonColors[season] || 'bg-gray-200 text-gray-800 border-gray-300';
};

// Accord categories mapping
const accordCategories = {
  "Floral": [
    "Floral",
    "White Floral",
    "Rose",
    "Jasmine",
    "Tuberose",
    "Fig",
    "Chypre Floral",
    "Oriental Floral"
  ],
  "Fruity & Sweet": [
    "Fruity",
    "Sweet",
    "Vanilla",
    "Coconut",
    "Honey",
    "Gourmand",
    "Sparkling",
    "Oriental Fruity"
  ],
  "Woody & Resinous": [
    "Woody",
    "Aromatic Woody",
    "Resinous",
    "Balsamic",
    "Amber",
    "Patchouli",
    "Vetiver",
    "Oud",
    "Incense",
    "Oriental Woody"
  ],
  "Spicy & Warm": [
    "Spicy",
    "Warm",
    "Tobacco",
    "Leather",
    "Smoky",
    "Boozy"
  ],
  "Fresh & Clean": [
    "Fresh",
    "Citrus",
    "Clean",
    "Minimal",
    "Sparkling"
  ],
  "Green & Earthy": [
    "Green",
    "Herbal",
    "Earthy",
    "Dry",
    "Tea"
  ],
  "Aquatic & Marine": [
    "Aquatic",
    "Marine",
    "Salty"
  ],
  "Musky & Powdery": [
    "Musky",
    "Powdery",
    "Animalic"
  ],
  "Oriental & Exotic": [
    "Chypre",
    "Metallic"
  ]
};

// Category colors
const categoryColors = {
  "Floral": 'bg-pink-200 text-pink-800 border-pink-300',
  "Fruity & Sweet": 'bg-yellow-200 text-yellow-800 border-yellow-300',
  "Woody & Resinous": 'bg-amber-200 text-amber-900 border-amber-300',
  "Spicy & Warm": 'bg-orange-200 text-orange-800 border-orange-300',
  "Fresh & Clean": 'bg-cyan-50 text-cyan-800 border-cyan-200',
  "Green & Earthy": 'bg-green-200 text-green-800 border-green-300',
  "Aquatic & Marine": 'bg-blue-200 text-blue-800 border-blue-300',
  "Musky & Powdery": 'bg-purple-200 text-purple-800 border-purple-300',
  "Oriental & Exotic": 'bg-gray-800 text-gray-100 border-gray-700'
};

// Get color for accord pill based on category
const getAccordColor = (accord) => {
  // Find which category this accord belongs to
  for (const [category, accords] of Object.entries(accordCategories)) {
    if (accords.includes(accord)) {
      return categoryColors[category];
    }
  }
  // Default color if accord not found in any category
  return 'bg-gray-200 text-gray-800 border-gray-300';
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [selectedVolume, setSelectedVolume] = useState(null);
  const [suitabilityScore, setSuitabilityScore] = useState(null);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);

  const loadReviews = async () => {
    if (!id) return;
    try {
      setLoadingReviews(true);
      const response = await reviewsAPI.getProductReviews(id, { page: reviewsPage, limit: 10 });
      if (response.data.success) {
        setReviews(response.data.data);
        setReviewsTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadProduct();
      loadReviews();
    }
  }, [id, reviewsPage]);

  useEffect(() => {
    if (product) {
      loadRelatedProducts();
      if (isAuthenticated && product.stock === 0) {
        checkSubscription();
      } else if (product.stock > 0) {
        setIsSubscribed(false); // Reset subscription state when product is in stock
      }
    }
  }, [product, isAuthenticated]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProduct(id);
      setProduct(response.data.data);
      setSuitabilityScore(response.data.suitabilityScore);
      if (response.data.data.price && response.data.data.price.length > 0) {
        setSelectedPrice(response.data.data.price[0]);
        setSelectedVolume(response.data.data.volume?.[0] || null);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    setMessage('');

    // Find the index of the selected price in the price array
    let priceIndex = 0;
    if (product.price && product.price.length > 1) {
      priceIndex = product.price.findIndex(p => p === selectedPrice);
      if (priceIndex === -1) priceIndex = 0;
    }

    const result = await addToCart(id, quantity, priceIndex);
    if (result.success) {
      setMessage('Added to cart successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage(result.message || 'Failed to add to cart');
    }
    setAddingToCart(false);
  };

  const handleBuyNow = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

    setAddingToCart(true);
    setMessage('');

    // Find the index of the selected price in the price array
    let priceIndex = 0;
    if (product.price && product.price.length > 1) {
      priceIndex = product.price.findIndex(p => p === selectedPrice);
      if (priceIndex === -1) priceIndex = 0;
    }

    const result = await addToCart(id, quantity, priceIndex);
    if (result.success) {
      // Navigate to checkout
      navigate('/checkout');
    } else {
      setMessage(result.message || 'Failed to add to cart');
      setAddingToCart(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const response = await productsAPI.checkStockSubscription(id);
      setIsSubscribed(response.data.subscribed || false);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSubscribeStock = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + window.location.pathname);
      return;
    }

    try {
      setSubscribing(true);
      if (isSubscribed) {
        await productsAPI.unsubscribeStockNotification(id);
        setIsSubscribed(false);
        setMessage('Unsubscribed from stock notifications');
      } else {
        await productsAPI.subscribeStockNotification(id);
        setIsSubscribed(true);
        setMessage('You will be notified when this product is back in stock');
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update subscription');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSubscribing(false);
    }
  };

  const loadRelatedProducts = async () => {
    if (!product) return;

    try {
      setLoadingRelated(true);
      // Try to fetch products from the same brand first
      const params = {
        brand: product.brand,
        limit: 4,
      };

      const response = await productsAPI.getProducts(params);
      let products = response.data.data || [];

      // Filter out the current product
      products = products.filter(p => p._id !== product._id);

      // If we don't have enough products from the same brand, try same gender or type
      if (products.length < 4 && product.gender && product.gender.length > 0) {
        const genderParams = {
          gender: product.gender[0],
          limit: 8,
        };
        const genderResponse = await productsAPI.getProducts(genderParams);
        const genderProducts = (genderResponse.data.data || [])
          .filter(p => p._id !== product._id && !products.find(existing => existing._id === p._id));
        products = [...products, ...genderProducts].slice(0, 4);
      }

      // If still not enough, try same type
      if (products.length < 4 && product.type) {
        const typeParams = {
          type: product.type,
          limit: 8,
        };
        const typeResponse = await productsAPI.getProducts(typeParams);
        const typeProducts = (typeResponse.data.data || [])
          .filter(p => p._id !== product._id && !products.find(existing => existing._id === p._id));
        products = [...products, ...typeProducts].slice(0, 4);
      }

      setRelatedProducts(products.slice(0, 4));
    } catch (error) {
      console.error('Error loading related products:', error);
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-500">Product not found</p>
      </div>
    );
  }

  const minPrice = product.price && product.price.length > 0
    ? Math.min(...product.price)
    : 0;
  const maxPrice = product.price && product.price.length > 0
    ? Math.max(...product.price)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square w-full overflow-hidden bg-gray-200 rounded-lg flex items-center justify-center p-4">
          {getImageUrl(product.image_path) ? (
            <img
              src={getImageUrl(product.image_path)}
              alt={product.name}
              className="h-full w-full object-contain drop-shadow-lg"
              onError={(e) => {
                try { e.target.onerror = null; } catch (err) {}
                e.target.src = placeholderDataUri(600, 600, 'Perfume');
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
              <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {/* Brand Name - Clickable */}
          {product.brand && (
            <Link
              to={`/products?brand=${encodeURIComponent(product.brand)}`}
              className="text-lg text-indigo-600 hover:text-indigo-800 hover:underline mb-2 inline-block"
            >
              {product.brand}
            </Link>
          )}

          {/* Perfume Name */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {/* Type of Perfume */}
          {product.type && (
            <p className="text-lg text-gray-600 mb-3">{product.type}</p>
          )}

          {/* Rating */}
          {product.reviews > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const rating = product.reviews;
                  const filled = star <= Math.round(rating);
                  return (
                    <MaterialIcon
                      key={star}
                      icon="star"
                      size={20}
                      filled={true}
                      className={filled ? 'text-yellow-400' : 'text-gray-300'}
                    />
                  );
                })}
              </div>
              <span className="text-gray-600">{product.reviews.toFixed(1)}</span>
            </div>
          )}

          {suitabilityScore && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-800">
                <span className="font-semibold">Match Score: {suitabilityScore}</span> - Based on your scent profile
              </p>
            </div>
          )}

          <div className="mb-4">
            {product.originalPrice && product.originalPrice.length > 0 && (() => {
              const priceIndex = product.price?.findIndex(p => p === selectedPrice) ?? 0;
              const originalPrice = product.originalPrice[priceIndex] || product.originalPrice[0];
              const currentPrice = selectedPrice;
              const discountPercent = originalPrice && currentPrice
                ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
                : 0;
              return discountPercent > 0 ? (
                <span className="inline-block bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded mb-2">
                  -{discountPercent}%
                </span>
              ) : null;
            })()}
            <div className="flex items-center gap-3">
              {product.originalPrice && product.originalPrice.length > 0 && (() => {
                const priceIndex = product.price?.findIndex(p => p === selectedPrice) ?? 0;
                const originalPrice = product.originalPrice[priceIndex] || product.originalPrice[0];
                return originalPrice ? (
                  <p className="text-xl text-gray-400 line-through">
                    €{originalPrice.toFixed(2)}
                  </p>
                ) : null;
              })()}
              <p className={`text-2xl font-bold ${product.originalPrice && product.originalPrice.length > 0 ? 'text-red-600' : 'text-indigo-600'}`}>
                {product.price && product.price.length > 0
                  ? `€${selectedPrice.toFixed(2)}`
                  : 'Price not available'}
              </p>
              {/* show volume even when only one price exists */}
              {selectedVolume ? (
                <span className="text-sm text-gray-600">{selectedVolume}ml</span>
              ) : null}
            </div>
            {product.price && product.price.length > 1 && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Volume & Price:
                </label>
                <div className="space-y-2">
                  {product.price.map((price, index) => {
                    const originalPrice = product.originalPrice?.[index];
                    const isOnSale = originalPrice && originalPrice > price;
                    return (
                      <label key={index} className="flex items-center">
                        <input
                          type="radio"
                          name="price"
                          value={price}
                          checked={selectedPrice === price}
                          onChange={() => {
                            setSelectedPrice(price);
                            setSelectedVolume(product.volume?.[index] || null);
                          }}
                          className="mr-2"
                        />
                        <span className="flex items-center gap-2">
                          {product.volume?.[index] ? `${product.volume[index]}ml` : 'Standard'} -
                          {isOnSale && (
                            <span className="text-gray-400 line-through mr-1">
                              €{originalPrice.toFixed(2)}
                            </span>
                          )}
                          <span className={isOnSale ? 'text-red-600 font-semibold' : ''}>
                            €{price.toFixed(2)}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Add to Cart */}
          <div className="border-t border-gray-200 pt-6">
            {product.stock === 0 ? (
              <>
                <p className="text-red-600 font-medium mb-4">Out of Stock</p>
                {message && (
                  <div className={`mb-4 p-3 rounded-md ${message.includes('success') || message.includes('notified') || message.includes('Unsubscribed') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message}
                  </div>
                )}
                <button
                  onClick={handleSubscribeStock}
                  disabled={subscribing}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {subscribing ? 'Processing...' : isSubscribed ? 'Unsubscribe from Stock Notifications' : 'Notify me when it is back in stock'}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center mb-4">
                  <label className="mr-4 text-sm font-medium text-gray-700">Quantity:</label>
                  <QuantityInput
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    max={product.stock}
                  />
                  <span className="ml-4 text-sm text-gray-500">
                    {product.stock > 4 ? 'In stock' : `Only ${product.stock} left`}
                  </span>
                </div>
                {message && (
                  <Alert
                    type={message.includes('success') || message.includes('notified') || message.includes('Unsubscribed') ? 'success' : 'error'}
                    message={message}
                    className="mb-4"
                  />
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={addingToCart || product.stock === 0}
                    fullWidth
                    size="lg"
                    className="flex-1"
                  >
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={addingToCart || product.stock === 0}
                    fullWidth
                    size="lg"
                    className="flex-1 bg-gray-900 hover:bg-gray-800 focus:ring-gray-500"
                  >
                    {addingToCart ? 'Adding...' : 'Buy Now'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description and Product Details - Below the grid */}
      <div className="mt-8">
        {/* Description */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
          <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
        </div>

        {/* Product Details */}
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Product Details</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {product.type && (
              <>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="text-sm text-gray-900">{product.type}</dd>
              </>
            )}
            {product.gender && product.gender.length > 0 && (
              <>
                <dt className="text-sm font-medium text-gray-500">Gender</dt>
                <dd className="text-sm text-gray-900">{product.gender.join(', ')}</dd>
              </>
            )}
            {product.season && product.season.length > 0 && (
              <>
                <dt className="text-sm font-medium text-gray-500">Season</dt>
                <dd className="text-sm text-gray-900">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {product.season.map((season, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeasonColor(season)}`}
                      >
                        {season}
                      </span>
                    ))}
                  </div>
                </dd>
              </>
            )}
            {product.accords && product.accords.length > 0 && (
              <>
                <dt className="text-sm font-medium text-gray-500">Accords</dt>
                <dd className="text-sm text-gray-900">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {product.accords.map((accord, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getAccordColor(accord)}`}
                      >
                        {accord}
                      </span>
                    ))}
                  </div>
                </dd>
              </>
            )}
          </dl>

          {product.notes && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Fragrance Notes</h4>

              {/* Top Notes */}
              {product.notes.top_notes && product.notes.top_notes.length > 0 && (
                <div className="mb-6">
                  <span className="text-sm font-medium text-gray-500 block mb-2">Top Notes</span>
                  <div className="flex flex-wrap gap-3">
                    {product.notes.top_notes.map((note, index) => {
                      const noteImageUrl = getNoteImageUrl(note);
                      return (
                        <div key={index} className="flex flex-col items-center">
                          {noteImageUrl && (
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center mb-1">
                              <img
                                src={noteImageUrl}
                                alt={note}
                                className="w-full h-full object-contain p-2"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const fallback = e.target.nextSibling;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div className="hidden items-center justify-center text-gray-400 text-xs p-2">
                                {note.charAt(0).toUpperCase()}
                              </div>
                            </div>
                          )}
                          <span className="text-xs text-gray-700 text-center max-w-[80px]">{note}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Middle Notes */}
              {product.notes.middle_notes && product.notes.middle_notes.length > 0 && (
                <div className="mb-6">
                  <span className="text-sm font-medium text-gray-500 block mb-2">Middle Notes</span>
                  <div className="flex flex-wrap gap-3">
                    {product.notes.middle_notes.map((note, index) => {
                      const noteImageUrl = getNoteImageUrl(note);
                      return (
                        <div key={index} className="flex flex-col items-center">
                          {noteImageUrl && (
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center mb-1">
                              <img
                                src={noteImageUrl}
                                alt={note}
                                className="w-full h-full object-contain p-2"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const fallback = e.target.nextSibling;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div className="hidden items-center justify-center text-gray-400 text-xs p-2">
                                {note.charAt(0).toUpperCase()}
                              </div>
                            </div>
                          )}
                          <span className="text-xs text-gray-700 text-center max-w-[80px]">{note}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Base Notes */}
              {product.notes.base_notes && product.notes.base_notes.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-500 block mb-2">Base Notes</span>
                  <div className="flex flex-wrap gap-3">
                    {product.notes.base_notes.map((note, index) => {
                      const noteImageUrl = getNoteImageUrl(note);
                      return (
                        <div key={index} className="flex flex-col items-center">
                          {noteImageUrl && (
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center mb-1">
                              <img
                                src={noteImageUrl}
                                alt={note}
                                className="w-full h-full object-contain p-2"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const fallback = e.target.nextSibling;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div className="hidden items-center justify-center text-gray-400 text-xs p-2">
                                {note.charAt(0).toUpperCase()}
                              </div>
                            </div>
                          )}
                          <span className="text-xs text-gray-700 text-center max-w-[80px]">{note}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h3>
          {loadingReviews ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Not yet rated</p>
            </div>
          ) : (
            <>
              <div className="space-y-6 mb-6">
                {reviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <MaterialIcon
                              key={star}
                              icon="star"
                              size={20}
                              filled={true}
                              className={
                                star <= review.rating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {review.user?.name || 'Anonymous'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 mt-2">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
              {reviewsTotalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setReviewsPage(prev => Math.max(1, prev - 1))}
                    disabled={reviewsPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Page {reviewsPage} of {reviewsTotalPages}
                  </span>
                  <button
                    onClick={() => setReviewsPage(prev => Math.min(reviewsTotalPages, prev + 1))}
                    disabled={reviewsPage === reviewsTotalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delivery and Returns */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Delivery and Returns</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Shipping Information</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Free shipping on orders over $100</li>
                <li>Standard shipping: 3-5 business days</li>
                <li>Express shipping: 1-2 business days (additional fee)</li>
                <li>International shipping available</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Returns Policy</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>30-day return policy for unopened items</li>
                <li>Items must be in original packaging</li>
                <li>Return shipping costs are the responsibility of the customer</li>
                <li>Refunds will be processed within 5-7 business days</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Contact Support</h4>
              <p className="text-gray-700">
                For any questions about delivery or returns, please contact our customer service team.
              </p>
            </div>
          </div>
        </div>

        {/* Maybe you will also like */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Maybe you will also like</h3>
            {loadingRelated ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct._id} product={relatedProduct} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;

