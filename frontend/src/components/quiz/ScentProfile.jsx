import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { quizAPI } from '../../services/api';
import { getImageUrl, placeholderDataUri } from '../../utils/imageUtils';

const ScentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

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


  const handleRetakeQuiz = () => {
    navigate('/quiz?retake=true');
  };

  const getFieldLabel = (field) => {
    const labels = {
      gender: 'Gender Preference',
      vibe: 'Vibe or Personality',
      occasion: 'Occasion',
      season: 'Season',
      longevity_category: 'Longevity',
      accords: 'Accords',
      liked_notes: 'Liked Notes',
      disliked_notes: 'Disliked Notes',
      secondary_accords: 'Secondary Accords',
      price: 'Price Range'
    };
    return labels[field] || field;
  };

  const formatValue = (value) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      if (value.label) return value.label;
      if (value.range) return `${value.range[0]} - ${value.range[1]}`;
      return JSON.stringify(value);
    }
    return value;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile || !profile.answers) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No profile found. Please complete the quiz.</p>
          <button
            onClick={handleRetakeQuiz}
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
          >
            Take Quiz
          </button>
        </div>
      </div>
    );
  }

  const { answers } = profile;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Scent Profile</h1>
          <p className="text-gray-600">View your scent preferences. Re-take the quiz to update your profile.</p>
        </div>
        <button
          onClick={handleRetakeQuiz}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Re-take Quiz
        </button>
      </div>

      {/* Profile Answers */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(answers).map(([field, value]) => (
            <div key={field} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">{getFieldLabel(field)}</h3>
              <p className="text-gray-700">{formatValue(value) || 'Not set'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {profile.recommendations && profile.recommendations.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommended Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.recommendations
              .filter(rec => rec.product) // Filter out null products
              .map((rec, index) => {
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
                            <path fillRule="evenodd" d="M4 3a2 2 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
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
        </div>
      ) : (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No recommendations available. Try updating your preferences or re-taking the quiz.</p>
        </div>
      )}

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

export default ScentProfile;

