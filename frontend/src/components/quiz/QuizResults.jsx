import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quizAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl, placeholderDataUri } from '../../utils/imageUtils';

const QuizResults = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated, navigate]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getProfile();
      setProfile(response.data.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error.response?.status === 404) {
        navigate('/quiz');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile || !profile.recommendations || profile.recommendations.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No recommendations found. Please complete the quiz.</p>
          <Link
            to="/quiz"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
          >
            Take Quiz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Scent Profile</h1>
        <p className="text-gray-600">Based on your preferences, here are our recommendations:</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profile.recommendations.map((rec, index) => {
          const product = rec.product;
          const minPrice = product.price && product.price.length > 0
            ? Math.min(...product.price)
            : 0;
          const maxPrice = product.price && product.price.length > 0
            ? Math.max(...product.price)
            : 0;
          const displayPrice = minPrice === maxPrice
            ? `$${minPrice.toFixed(2)}`
            : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

          return (
            <div
              key={product._id || index}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <Link to={`/products/${product._id}`}>
                <div className="aspect-square w-full overflow-hidden bg-gray-200">
                  {getImageUrl(product.image_path) ? (
                    <img
                      src={getImageUrl(product.image_path)}
                      alt={product.name}
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        try { e.target.onerror = null; } catch (err) {}
                        e.target.src = placeholderDataUri(400, 400, 'Perfume');
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      Match: {rec.matchScore?.toFixed(0) || 'N/A'}%
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                  <p className="text-lg font-semibold text-indigo-600">{displayPrice}</p>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/products"
          className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
        >
          Browse All Products
        </Link>
      </div>
    </div>
  );
};

export default QuizResults;

