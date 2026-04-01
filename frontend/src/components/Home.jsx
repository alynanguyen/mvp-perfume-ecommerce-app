import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../services/api';
import ProductCard from './products/ProductCard';
import MaterialIcon from './common/MaterialIcon';

// Import all brand logos using Vite's glob import
const brandLogoModules = import.meta.glob('../assets/imgs/home/brands_logo/*.png', { eager: true });

// Mapping from logo filename (without extension) to brand name in database
const brandLogoMap = {
  'amouage': 'Amouage',
  'by_kilian': 'By Kilian',
  'byredo': 'Byredo',
  'clive_christian': 'Clive Christian',
  'creed': 'Creed',
  'diptyque': 'Diptyque',
  'etat_libre_dorange': 'Etat Libre d\'Orange',
  'francesca_bianchi': 'Francesca Bianchi',
  'frederic_malle': 'Frédéric Malle',
  'gallivant': 'Gallivant',
  'initio_parfums': 'Initio Parfums',
  'juliette_has_a_gun': 'Juliette Has a Gun',
  'le_labo': 'Le Labo',
  'liquides_imaginaires': 'Liquides Imaginaires',
  'm_micallef': 'M. Micallef',
  'maison_francis_kurkdjian': 'Maison Francis Kurkdjian',
  'mancera': 'Mancera',
  'meo_fusciuni': 'Meo Fusciuni',
  'nishane': 'Nishane',
  'ormonde_jayne': 'Ormonde Jayne',
  'parfums_de_marly': 'Parfums de Marly',
  'serge_lutens': 'Serge Lutens',
  'tiziana_terenzi': 'Tiziana Terenzi',
  'zoologist': 'Zoologist'
};

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(true);
  const sliderRef = useRef(null);
  const newArrivalsSliderRef = useRef(null);
  const brandsSliderRef = useRef(null);
  const autoSlideIntervalRef = useRef(null);

  // Get all brand logos with proper image paths (defined early for use in useEffect)
  const brandLogos = Object.keys(brandLogoMap).map((logoKey) => {
    const logoPath = `../assets/imgs/home/brands_logo/${logoKey}.png`;
    const imageModule = brandLogoModules[logoPath];
    const imagePath = imageModule?.default || imageModule || '';

    return {
      logoKey,
      brandName: brandLogoMap[logoKey],
      imagePath
    };
  }).filter(brand => brand.imagePath); // Filter out brands without images

  useEffect(() => {
    const loadBestSellers = async () => {
      try {
        setLoading(true);
        const response = await productsAPI.getProducts({ availability: 'bestSeller', limit: 8 });
        setBestSellers(response.data.data || []);
      } catch (error) {
        console.error('Error loading best sellers:', error);
        setBestSellers([]);
      } finally {
        setLoading(false);
      }
    };
    loadBestSellers();
  }, []);

  useEffect(() => {
    const loadNewArrivals = async () => {
      try {
        setLoadingNewArrivals(true);
        // Fetch a larger set of products to randomly select from
        const response = await productsAPI.getProducts({ limit: 50 });
        const allProducts = response.data.data || [];

        // Randomly select 8 products
        const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 8);
        setNewArrivals(selected);
      } catch (error) {
        console.error('Error loading new arrivals:', error);
        setNewArrivals([]);
      } finally {
        setLoadingNewArrivals(false);
      }
    };
    loadNewArrivals();
  }, []);

  // Auto-slide for brand slider
  useEffect(() => {
    if (brandLogos.length > 0 && brandsSliderRef.current) {
      // Clear any existing interval
      if (autoSlideIntervalRef.current) {
        clearInterval(autoSlideIntervalRef.current);
      }

      // Set up auto-slide every 3 seconds
      autoSlideIntervalRef.current = setInterval(() => {
        if (brandsSliderRef.current) {
          const container = brandsSliderRef.current;
          const logoWidth = container.querySelector('.flex-shrink-0')?.offsetWidth || 150;
          const gap = 32;
          const scrollAmount = logoWidth + gap;
          const maxScroll = container.scrollWidth - container.clientWidth;
          const currentScroll = container.scrollLeft;

          // If we've reached the end, scroll back to the beginning
          if (currentScroll + scrollAmount >= maxScroll) {
            container.scrollTo({
              left: 0,
              behavior: 'smooth'
            });
          } else {
            container.scrollBy({
              left: scrollAmount,
              behavior: 'smooth'
            });
          }
        }
      }, 3000); // Auto-slide every 3 seconds
    }

    // Cleanup interval on unmount
    return () => {
      if (autoSlideIntervalRef.current) {
        clearInterval(autoSlideIntervalRef.current);
      }
    };
  }, [brandLogos.length]);

  const scrollSlider = (direction, ref) => {
    if (ref.current) {
      const container = ref.current;
      const cardWidth = container.querySelector('.flex-shrink-0')?.offsetWidth || 320;
      const gap = 24; // gap-6 = 1.5rem = 24px
      const scrollAmount = cardWidth + gap;
      const currentScroll = container.scrollLeft;
      const newScroll = direction === 'next'
        ? currentScroll + scrollAmount
        : currentScroll - scrollAmount;

      container.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  const scrollBrandsSlider = (direction) => {
    if (brandsSliderRef.current) {
      const container = brandsSliderRef.current;
      const logoWidth = container.querySelector('.flex-shrink-0')?.offsetWidth || 150;
      const gap = 32; // gap-8 = 2rem = 32px
      const scrollAmount = logoWidth + gap;
      const currentScroll = container.scrollLeft;
      const newScroll = direction === 'next'
        ? currentScroll + scrollAmount
        : currentScroll - scrollAmount;

      container.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover Your Perfect Scent
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-indigo-100">
              Explore our curated collection of premium perfumes
            </p>
            <p className="text-lg md:text-xl mb-8 text-indigo-200">
              🚚 Free shipping on orders over €90
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="bg-white text-indigo-600 px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors"
              >
                Shop Now
              </Link>
              <Link
                to={isAuthenticated ? "/quiz" : "/login?redirect=/quiz"}
                className="bg-indigo-700 text-white px-8 py-3 rounded-md font-semibold hover:bg-indigo-800 transition-colors"
              >
                Take Perfume Quiz
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Best Sellers Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Best Sellers</h2>
              <p className="text-gray-600">Our most popular fragrances, loved by customers</p>
            </div>
            {!loading && bestSellers.length > 0 && (
              <Link
                to="/products?availability=bestSeller"
                className="hidden md:block text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                View All →
              </Link>
            )}
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : bestSellers.length > 0 ? (
            <>
              <div className="relative px-8 md:px-12">
                {/* Previous Button */}
                {bestSellers.length > 1 && (
                  <button
                    onClick={() => scrollSlider('prev', sliderRef)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors hidden md:block"
                    aria-label="Previous products"
                  >
                    <MaterialIcon icon="chevron_left" size={24} className="text-indigo-600" />
                  </button>
                )}

                {/* Slider Container */}
                <div
                  ref={sliderRef}
                  className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 snap-x snap-mandatory"
                >
                  {bestSellers.map((product) => (
                    <div key={product._id} className="flex-shrink-0 w-full sm:w-80 snap-start">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {/* Next Button */}
                {bestSellers.length > 1 && (
                  <button
                    onClick={() => scrollSlider('next', sliderRef)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors hidden md:block"
                    aria-label="Next products"
                  >
                    <MaterialIcon icon="chevron_right" size={24} className="text-indigo-600" />
                  </button>
                )}
              </div>

              {/* View All Link */}
              <div className="mt-8 text-center">
                <Link
                  to="/products?availability=bestSeller"
                  className="inline-block text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  View All Best Sellers →
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No best sellers available at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Arrivals Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">New Arrivals</h2>
              <p className="text-gray-600">Discover our latest additions to the collection</p>
            </div>
            {!loadingNewArrivals && newArrivals.length > 0 && (
              <Link
                to="/products"
                className="hidden md:block text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                View All →
              </Link>
            )}
          </div>
          {loadingNewArrivals ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : newArrivals.length > 0 ? (
            <>
              <div className="relative px-8 md:px-12">
                {/* Previous Button */}
                {newArrivals.length > 1 && (
                  <button
                    onClick={() => scrollSlider('prev', newArrivalsSliderRef)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors hidden md:block"
                    aria-label="Previous products"
                  >
                    <MaterialIcon icon="chevron_left" size={24} className="text-indigo-600" />
                  </button>
                )}

                {/* Slider Container */}
                <div
                  ref={newArrivalsSliderRef}
                  className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 snap-x snap-mandatory"
                >
                  {newArrivals.map((product) => (
                    <div key={product._id} className="flex-shrink-0 w-full sm:w-80 snap-start">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {/* Next Button */}
                {newArrivals.length > 1 && (
                  <button
                    onClick={() => scrollSlider('next', newArrivalsSliderRef)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors hidden md:block"
                    aria-label="Next products"
                  >
                    <MaterialIcon icon="chevron_right" size={24} className="text-indigo-600" />
                  </button>
                )}
              </div>

              {/* View All Link */}
              <div className="mt-8 text-center">
                <Link
                  to="/products"
                  className="inline-block text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  View All Products →
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No new arrivals available at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Brand Slider Section */}
      <div className="bg-gray-50 py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Shop by Brand</h2>
            <p className="text-gray-600 text-center">Explore our premium fragrance collections</p>
          </div>
          <div className="relative px-8 md:px-12">
            {/* Previous Button */}
            {brandLogos.length > 1 && (
              <button
                onClick={() => scrollBrandsSlider('prev')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors hidden md:block border border-gray-200"
                aria-label="Previous brands"
              >
                <MaterialIcon icon="chevron_left" size={24} className="text-indigo-600" />
              </button>
            )}

            {/* Brands Slider Container */}
            <div
              ref={brandsSliderRef}
              className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4 snap-x snap-mandatory"
              onMouseEnter={() => {
                // Pause auto-slide on hover
                if (autoSlideIntervalRef.current) {
                  clearInterval(autoSlideIntervalRef.current);
                }
              }}
              onMouseLeave={() => {
                // Resume auto-slide when mouse leaves
                if (brandLogos.length > 0 && brandsSliderRef.current) {
                  autoSlideIntervalRef.current = setInterval(() => {
                    if (brandsSliderRef.current) {
                      const container = brandsSliderRef.current;
                      const logoWidth = container.querySelector('.flex-shrink-0')?.offsetWidth || 150;
                      const gap = 32;
                      const scrollAmount = logoWidth + gap;
                      const maxScroll = container.scrollWidth - container.clientWidth;
                      const currentScroll = container.scrollLeft;

                      if (currentScroll + scrollAmount >= maxScroll) {
                        container.scrollTo({
                          left: 0,
                          behavior: 'smooth'
                        });
                      } else {
                        container.scrollBy({
                          left: scrollAmount,
                          behavior: 'smooth'
                        });
                      }
                    }
                  }, 3000);
                }
              }}
            >
              {brandLogos.map((brand) => (
                <Link
                  key={brand.logoKey}
                  to={`/products?brand=${encodeURIComponent(brand.brandName)}`}
                  className="flex-shrink-0 snap-start group"
                >
                  <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center hover:border-indigo-300 hover:shadow-md transition-all duration-200">
                    {brand.imagePath ? (
                      <img
                        src={brand.imagePath}
                        alt={brand.brandName}
                        className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.nextSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="hidden items-center justify-center text-gray-400 text-xs text-center p-2">
                      {brand.brandName}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Next Button */}
            {brandLogos.length > 1 && (
              <button
                onClick={() => scrollBrandsSlider('next')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors hidden md:block border border-gray-200"
                aria-label="Next brands"
              >
                <MaterialIcon icon="chevron_right" size={24} className="text-indigo-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Shop by Gender Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Shop by Gender</h2>
            <p className="text-gray-600">Find the perfect fragrance for you</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* For Men */}
            <Link
              to="/products?gender=Male"
              className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col items-center justify-center p-8 text-white">
                <MaterialIcon icon="person" size={64} className="mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-2xl font-bold mb-2">For Men</h3>
                <p className="text-blue-100 text-center">Discover masculine fragrances</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-semibold">Shop Now →</span>
                </div>
              </div>
            </Link>

            {/* For Women */}
            <Link
              to="/products?gender=Female"
              className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-pink-500 to-pink-700 flex flex-col items-center justify-center p-8 text-white">
                <MaterialIcon icon="person" size={64} className="mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-2xl font-bold mb-2">For Women</h3>
                <p className="text-pink-100 text-center">Explore feminine fragrances</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-semibold">Shop Now →</span>
                </div>
              </div>
            </Link>

            {/* For All (Unisex) */}
            <Link
              to="/products?gender=Unisex"
              className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-purple-500 to-purple-700 flex flex-col items-center justify-center p-8 text-white">
                <MaterialIcon icon="group" size={64} className="mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-2xl font-bold mb-2">For All</h3>
                <p className="text-purple-100 text-center">Unisex fragrances for everyone</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-semibold">Shop Now →</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MaterialIcon icon="verified" size={32} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium Quality</h3>
            <p className="text-gray-600">Only the finest fragrances from renowned brands</p>
          </div>
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MaterialIcon icon="schedule" size={32} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Free Shipping</h3>
            <p className="text-gray-600">Free shipping on orders over €90. Quick and secure delivery to your doorstep</p>
          </div>
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MaterialIcon icon="lightbulb" size={32} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Personalized Recommendations</h3>
            <p className="text-gray-600">Find your perfect match with our scent quiz</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

