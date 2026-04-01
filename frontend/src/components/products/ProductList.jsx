import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { productsAPI, quizAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProductCard from './ProductCard';

// Import all brand logos using Vite's glob import
const brandLogoModules = import.meta.glob('../../assets/imgs/home/brands_logo/*.png', { eager: true });

// Mapping from logo filename (without extension) to brand name in database
const brandLogoMap = {
  'amouage': 'Amouage',
  'by_kilian': 'By Kilian',
  'byredo': 'Byredo',
  'clive_christian': 'Clive Christian',
  'creed': 'Creed',
  'diptyque': 'Diptyque',
  'etat_libre_dorange': 'Etat Libre d\u2019Orange', // Using Unicode for curly apostrophe
  'francesca_bianchi': 'Francesca Bianchi',
  'frederic_malle': 'Frederic Malle',
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
  'xerjoff': 'Xerjoff',
  'zoologist': 'Zoologist'
};

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [hasScentProfile, setHasScentProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });

  // Get URL params - use useMemo to create new arrays when URL changes
  const urlBrand = searchParams.get('brand') || '';
  const urlGender = searchParams.get('gender') || '';
  const urlSearch = searchParams.get('search') || '';
  const urlAvailability = searchParams.get('availability') || '';
  const urlPage = parseInt(searchParams.get('page')) || 1;

  const urlBrands = useMemo(() => urlBrand ? [urlBrand] : [], [urlBrand]);
  const urlGenders = useMemo(() => urlGender ? [urlGender] : [], [urlGender]);
  const urlAvailabilities = useMemo(() => urlAvailability ? urlAvailability.split(',').map(a => a.trim()).filter(Boolean) : [], [urlAvailability]);

  const [filters, setFilters] = useState({
    search: urlSearch,
    brands: urlBrands,
    genders: urlGenders,
    seasons: [],
    availability: urlAvailabilities, // onSale, bestSeller, limitedEdition
    accords: [],
    priceRange: [], // Changed from minPrice/maxPrice to array of selected price ranges
    longevity: [], // Changed from minLongevity/maxLongevity to array of selected longevity options
    sort: '',
  });
  const [searchDebounce, setSearchDebounce] = useState(urlSearch);

  // Check if user has a scent profile
  useEffect(() => {
    const checkScentProfile = async () => {
      if (!isAuthenticated) {
        setHasScentProfile(false);
        return;
      }

      try {
        setCheckingProfile(true);
        const response = await quizAPI.getProfile();
        if (response.data.success && response.data.data) {
          setHasScentProfile(true);
        } else {
          setHasScentProfile(false);
        }
      } catch (error) {
        // 404 means no profile found
        if (error.response?.status === 404) {
          setHasScentProfile(false);
        } else {
          console.error('Error checking scent profile:', error);
          setHasScentProfile(false);
        }
      } finally {
        setCheckingProfile(false);
      }
    };

    checkScentProfile();
  }, [isAuthenticated]);

  // Gender and Season options
  // UI labels mapped to backend values (database uses 'Male', 'Female', 'Unisex')
  const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Unisex', value: 'Unisex' }
  ];
  const seasonOptions = ['Spring', 'Summer', 'Autumn', 'Winter', 'All-year'];

  // Price range options
  const priceRangeOptions = [
    { label: 'Below €100', value: 'below_100', min: 0, max: 99 },
    { label: '€100 - €300', value: '100_300', min: 100, max: 300 },
    { label: 'Above €300', value: 'above_300', min: 301, max: Infinity }
  ];

  // Longevity options matching the quiz
  const longevityOptions = [
    { label: 'Soft / Moderate', value: 'soft_moderate', range: [0, 6] },
    { label: 'Moderate / Strong', value: 'moderate_strong', range: [6, 10] },
    { label: 'Very Strong', value: 'very_strong', range: [10, 24] }
  ];
  const availabilityOptions = [
    { label: 'On Sale', value: 'onSale' },
    { label: 'Best Seller', value: 'bestSeller' },
    { label: 'Limited Edition', value: 'limitedEdition' }
  ];

  // Accord options matching the quiz
  const accordOptions = [
    'Floral',
    'Fruity & Sweet',
    'Woody & Resinous',
    'Spicy & Warm',
    'Fresh & Clean',
    'Green & Earthy',
    'Aquatic & Marine',
    'Musky & Powdery',
    'Oriental & Exotic'
  ];

  // Update filters from URL params when location.search changes
  useEffect(() => {
    const newBrands = urlBrand ? [urlBrand] : [];
    const newGenders = urlGender ? [urlGender] : [];
    const newAvailabilities = urlAvailability ? urlAvailability.split(',').map(a => a.trim()).filter(Boolean) : [];

    setFilters(prev => ({
      ...prev,
      search: urlSearch,
      brands: newBrands,
      genders: newGenders,
      availability: newAvailabilities,
    }));
    setSearchDebounce(urlSearch);
  }, [location.search, urlBrand, urlGender, urlSearch, urlAvailability]);

  // Load brands for filter
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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(filters.search);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);



  // Reset to page 1 when filters change (except page itself)
  useEffect(() => {
    const currentPage = parseInt(searchParams.get('page')) || 1;
    if (currentPage !== 1) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', '1');
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchDebounce,
    filters.brands.join(','),
    filters.genders.join(','),
    filters.seasons.join(','),
    filters.availability.join(','),
    filters.accords.join(','),
    filters.priceRange.join(','),
    filters.longevity.join(','),
    filters.sort,
  ]);

  // Load products when filters or page change
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchDebounce,
    filters.brands.join(','), // Convert to string for reliable comparison
    filters.genders.join(','), // Convert to string for reliable comparison
    filters.seasons.join(','), // Convert to string for reliable comparison
    filters.availability.join(','), // Convert to string for reliable comparison
    filters.accords.join(','), // Convert to string for reliable comparison
    filters.priceRange.join(','), // Convert to string for reliable comparison
    filters.longevity.join(','), // Convert to string for reliable comparison
    filters.sort,
    urlPage, // Add page dependency
    location.search // Also depend on location.search to catch URL changes
  ]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchDebounce) params.search = searchDebounce;
      if (filters.brands.length > 0) params.brand = filters.brands.join(',');
      if (filters.genders.length > 0) params.gender = filters.genders.join(',');
      if (filters.seasons.length > 0) params.season = filters.seasons.join(',');
      if (filters.availability.length > 0) params.availability = filters.availability.join(',');
      if (filters.accords.length > 0) params.accord = filters.accords.join(',');
      // Handle price range filter - convert selected options to min/max ranges
      if (filters.priceRange.length > 0) {
        const allRanges = filters.priceRange.map(option => {
          const priceOption = priceRangeOptions.find(opt => opt.value === option);
          return priceOption ? { min: priceOption.min, max: priceOption.max } : null;
        }).filter(Boolean);

        if (allRanges.length > 0) {
          // Use the minimum of all min values and maximum of all max values
          const minPrice = Math.min(...allRanges.map(r => r.min));
          const maxPrice = Math.max(...allRanges.map(r => r.max === Infinity ? 999999 : r.max));
          params.minPrice = minPrice;
          params.maxPrice = maxPrice;
        }
      }
      // Handle longevity filter - convert selected options to min/max ranges
      if (filters.longevity.length > 0) {
        const allRanges = filters.longevity.map(option => {
          const longevityOption = longevityOptions.find(opt => opt.value === option);
          return longevityOption ? longevityOption.range : null;
        }).filter(Boolean);

        if (allRanges.length > 0) {
          // Use the minimum of all min values and maximum of all max values
          const minLongevity = Math.min(...allRanges.map(r => r[0]));
          const maxLongevity = Math.max(...allRanges.map(r => r[1]));
          params.minLongevity = minLongevity;
          params.maxLongevity = maxLongevity;
        }
      }
      if (filters.sort) params.sort = filters.sort;
      params.page = urlPage; // Add page parameter
      params.limit = 30; // Set limit to 30

      const response = await productsAPI.getProducts(params);
      setProducts(response.data.data || []);

      // Update pagination state
      if (response.data) {
        setPagination({
          currentPage: response.data.page || 1,
          totalPages: response.data.totalPages || 1,
          total: response.data.total || 0,
        });
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMultiSelectChange = (filterKey, value, checked) => {
    setFilters((prev) => {
      const currentArray = prev[filterKey] || [];
      if (checked) {
        return { ...prev, [filterKey]: [...currentArray, value] };
      } else {
        return { ...prev, [filterKey]: currentArray.filter(item => item !== value) };
      }
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      brands: [],
      genders: [],
      seasons: [],
      availability: [],
      accords: [],
      priceRange: [],
      longevity: [],
      sort: '',
    });
    setSearchDebounce('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('search');
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    if (newPage === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', newPage.toString());
    }
    setSearchParams(newParams);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const FilterSidebar = () => (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <button
          onClick={clearFilters}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          Clear All
        </button>
      </div>

      {/* Brand Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Brand</label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={(e) => handleMultiSelectChange('brands', brand, e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Gender Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Gender</label>
        <div className="space-y-2">
          {genderOptions.map((gender) => (
            <label key={gender.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.genders.includes(gender.value)}
                onChange={(e) => handleMultiSelectChange('genders', gender.value, e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{gender.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Season Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Season</label>
        <div className="space-y-2">
          {seasonOptions.map((season) => (
            <label key={season} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.seasons.includes(season)}
                onChange={(e) => handleMultiSelectChange('seasons', season, e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{season}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
        <div className="space-y-2">
          {priceRangeOptions.map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.priceRange.includes(option.value)}
                onChange={(e) => handleMultiSelectChange('priceRange', option.value, e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Accords Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Accords</label>
        <div className="space-y-2">
          {accordOptions.map((accord) => (
            <label key={accord} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.accords.includes(accord)}
                onChange={(e) => handleMultiSelectChange('accords', accord, e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{accord}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Longevity Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Longevity</label>
        <div className="space-y-2">
          {longevityOptions.map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.longevity.includes(option.value)}
                onChange={(e) => handleMultiSelectChange('longevity', option.value, e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Availability</label>
        <div className="space-y-2">
          {availabilityOptions.map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.availability.includes(option.value)}
                onChange={(e) => handleMultiSelectChange('availability', option.value, e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Get active brand for header display (when only one brand is selected)
  const activeBrand = filters.brands.length === 1 ? filters.brands[0] : null;
  const activeGenderValue = filters.genders.length === 1 ? filters.genders[0] : null;
  // Map backend values to display labels
  const activeGender = activeGenderValue
    ? genderOptions.find(g => g.value === activeGenderValue)?.label || activeGenderValue
    : null;

  // Get brand logo for active brand
  const getBrandLogo = (brandName) => {
    // Find the logo key that matches the brand name
    const logoKey = Object.keys(brandLogoMap).find(
      key => brandLogoMap[key] === brandName
    );

    if (logoKey) {
      // Try the path format that matches the glob import
      const logoPath = `../../assets/imgs/home/brands_logo/${logoKey}.png`;
      let imageModule = brandLogoModules[logoPath];

      // If not found, search through all keys (Vite might normalize paths differently)
      if (!imageModule) {
        const allKeys = Object.keys(brandLogoModules);
        const matchingKey = allKeys.find(key =>
          key.includes(logoKey) || key.endsWith(`${logoKey}.png`)
        );
        if (matchingKey) {
          imageModule = brandLogoModules[matchingKey];
        }
      }

      return imageModule?.default || imageModule || null;
    }
    return null;
  };

  const brandLogo = activeBrand ? getBrandLogo(activeBrand) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Brand Header - Show when a single brand is selected */}
      {activeBrand && (
        <div className="bg-white rounded-lg shadow-lg mb-8 py-8 px-8 border border-gray-200">
          <div className="flex items-center justify-center">
            {brandLogo ? (
              <div className="flex items-center justify-center">
                <div className="w-48 h-24 md:w-64 md:h-32 flex items-center justify-center">
                  <img
                    src={brandLogo}
                    alt={activeBrand}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      e.target.style.display = 'none';
                      const fallback = e.target.nextSibling;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                </div>
                <div className="hidden text-4xl md:text-5xl font-bold text-gray-900">
                  {activeBrand}
                </div>
              </div>
            ) : (
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">{activeBrand}</h1>
            )}
          </div>
        </div>
      )}

      {!activeBrand && (
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {activeGender ? `${activeGender} Perfumes` : 'Our Perfumes'}
          </h1>
          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <FilterSidebar />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Sort Section */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Sort By</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="reviews">Highest Rated</option>
                {hasScentProfile && (
                  <option value="recommended">Recommended for You</option>
                )}
              </select>
            </div>
          </div>

          {/* Results Count */}
          {!loading && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {pagination.total === 0 ? (
                  'No products found'
                ) : (
                  <>
                    Showing <span className="font-semibold text-gray-900">
                      {((pagination.currentPage - 1) * 30) + 1}
                    </span>
                    {' - '}
                    <span className="font-semibold text-gray-900">
                      {Math.min(pagination.currentPage * 30, pagination.total)}
                    </span>
                    {' of '}
                    <span className="font-semibold text-gray-900">{pagination.total}</span> products
                  </>
                )}
              </p>
            </div>
          )}

          {/* Products Grid */}
          {loading && products.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className={`px-4 py-2 rounded-md border ${
                      pagination.currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    }`}
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage =
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1);

                      if (!showPage) {
                        // Show ellipsis
                        if (pageNum === pagination.currentPage - 2 || pageNum === pagination.currentPage + 2) {
                          return (
                            <span key={pageNum} className="px-2 text-gray-500">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-md border ${
                            pageNum === pagination.currentPage
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`px-4 py-2 rounded-md border ${
                      pagination.currentPage === pagination.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileFilters(false)}
          />
          {/* Filter Panel */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-96 bg-white shadow-xl flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <FilterSidebar />
            </div>
            {/* Apply Filter Button - Sticky at bottom */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 z-10">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
