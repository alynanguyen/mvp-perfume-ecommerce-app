const Product = require('../models/Product');

// Helper function to calculate Levenshtein distance (edit distance)
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

// Helper function to calculate similarity score (0-1, where 1 is exact match)
function calculateSimilarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLen);
}

// Helper function to find best fuzzy matches
function findFuzzyMatches(searchTerm, products, threshold = 0.6) {
  const searchLower = searchTerm.toLowerCase();
  const matches = [];

  products.forEach(product => {
    let maxScore = 0;
    let matchedField = '';

    // Check product name
    const nameScore = calculateSimilarity(searchLower, product.name.toLowerCase());
    if (nameScore > maxScore) {
      maxScore = nameScore;
      matchedField = 'name';
    }

    // Check brand
    const brandScore = calculateSimilarity(searchLower, (product.brand || '').toLowerCase());
    if (brandScore > maxScore) {
      maxScore = brandScore;
      matchedField = 'brand';
    }

    // Check if search term is contained in name or brand (partial match)
    if (product.name.toLowerCase().includes(searchLower) ||
        (product.brand && product.brand.toLowerCase().includes(searchLower))) {
      maxScore = Math.max(maxScore, 0.8);
    }

    if (maxScore >= threshold) {
      matches.push({
        product,
        score: maxScore,
        field: matchedField
      });
    }
  });

  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);

  return matches.map(m => m.product);
}

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { minPrice, maxPrice, brand, search, sort, gender, season, type, minLongevity, maxLongevity, availability, accord, page, limit } = req.query;

    // Pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 30;
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [];
    const matchConditions = [];

    // Brand filter - support multiple brands (comma-separated or array)
    if (brand) {
      const brandArray = Array.isArray(brand) ? brand : brand.split(',').map(b => b.trim()).filter(Boolean);
      if (brandArray.length > 0) {
        matchConditions.push({
          $or: brandArray.map(b => ({ brand: { $regex: b, $options: 'i' } }))
        });
      }
    }

    // Type filter
    if (type) {
      matchConditions.push({ type: { $regex: type, $options: 'i' } });
    }

    // Gender filter - support multiple genders (comma-separated or array)
    // Use exact match with word boundaries to avoid "Male" matching "Female"
    if (gender) {
      const genderArray = Array.isArray(gender) ? gender : gender.split(',').map(g => g.trim()).filter(Boolean);
      if (genderArray.length > 0) {
        matchConditions.push({
          $or: genderArray.map(g => ({
            gender: {
              $elemMatch: {
                $regex: `^${g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                $options: 'i'
              }
            }
          }))
        });
      }
    }

    // Season filter - support multiple seasons (comma-separated or array)
    if (season) {
      const seasonArray = Array.isArray(season) ? season : season.split(',').map(s => s.trim()).filter(Boolean);
      if (seasonArray.length > 0) {
        matchConditions.push({
          $or: seasonArray.map(s => ({ season: { $elemMatch: { $regex: s, $options: 'i' } } }))
        });
      }
    }

    // Accord filter - support multiple accords (comma-separated or array)
    // Map filter accord names to keywords that might appear in product accords
    if (accord) {
      const accordArray = Array.isArray(accord) ? accord : accord.split(',').map(a => a.trim()).filter(Boolean);
      if (accordArray.length > 0) {
        // Map filter accord names to search terms that appear in actual product data
        const accordMapping = {
          'Floral': ['Floral', 'Flower', 'Rose', 'Jasmine', 'Lily', 'Iris', 'White Floral', 'Oriental Floral', 'Chypre Floral', 'Tuberose'],
          'Fruity & Sweet': ['Fruity', 'Sweet', 'Fruit', 'Berry', 'Citrus', 'Oriental Fruity', 'Gourmand'],
          'Woody & Resinous': ['Woody', 'Wood', 'Resinous', 'Resin', 'Sandalwood', 'Cedar', 'Pine', 'Aromatic Woody', 'Oriental Woody'],
          'Spicy & Warm': ['Spicy', 'Spice', 'Warm', 'Cinnamon', 'Pepper', 'Clove', 'Cardamom', 'Incense'],
          'Fresh & Clean': ['Fresh', 'Clean', 'Crisp', 'Light', 'Aromatic'],
          'Green & Earthy': ['Green', 'Earthy', 'Earth', 'Moss', 'Vetiver', 'Grass', 'Patchouli'],
          'Aquatic & Marine': ['Aquatic', 'Marine', 'Water', 'Ocean', 'Sea', 'Salty', 'Metallic'],
          'Musky & Powdery': ['Musky', 'Musk', 'Powdery', 'Powder', 'Soft', 'Chypre'],
          'Oriental & Exotic': ['Oriental', 'Exotic', 'Amber', 'Incense', 'Balsamic', 'Vanilla', 'Oriental Floral', 'Oriental Fruity', 'Oriental Woody', 'Tobacco']
        };

        const searchTerms = [];
        accordArray.forEach(filterAccord => {
          const normalizedFilter = filterAccord.trim();
          if (accordMapping[normalizedFilter]) {
            // Add all mapped terms for this filter accord
            searchTerms.push(...accordMapping[normalizedFilter]);
          } else {
            // If no mapping found, try to extract keywords from the filter name
            // For "Fruity & Sweet", search for "Fruity" and "Sweet"
            const keywords = normalizedFilter.split(/[&\s]+/).filter(k => k.length > 0);
            searchTerms.push(...keywords);
          }
        });

        if (searchTerms.length > 0) {
          // Remove duplicates and create regex patterns
          const uniqueTerms = [...new Set(searchTerms)];
          matchConditions.push({
            $or: uniqueTerms.map(term => {
              // Escape special regex characters and create a pattern that matches the term
              const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              return { accords: { $elemMatch: { $regex: escapedTerm, $options: 'i' } } };
            })
          });
        }
      }
    }

    // Longevity filter - filter by longevity range
    if (minLongevity || maxLongevity) {
      const longevityMatch = {};
      if (minLongevity && maxLongevity) {
        // Product's longevity range should overlap with filter range
        // Product matches if: product.min <= filter.max AND product.max >= filter.min
        longevityMatch.$or = [
          {
            $and: [
              { 'longevity.min': { $exists: true, $lte: Number(maxLongevity) } },
              { 'longevity.max': { $exists: true, $gte: Number(minLongevity) } }
            ]
          },
          // Also match products where only min or max is set
          { 'longevity.min': { $exists: true, $gte: Number(minLongevity), $lte: Number(maxLongevity) } },
          { 'longevity.max': { $exists: true, $gte: Number(minLongevity), $lte: Number(maxLongevity) } }
        ];
      } else if (minLongevity) {
        longevityMatch.$or = [
          { 'longevity.max': { $exists: true, $gte: Number(minLongevity) } },
          { 'longevity.min': { $exists: true, $gte: Number(minLongevity) } }
        ];
      } else if (maxLongevity) {
        longevityMatch.$or = [
          { 'longevity.min': { $exists: true, $lte: Number(maxLongevity) } },
          { 'longevity.max': { $exists: true, $lte: Number(maxLongevity) } }
        ];
      }
      if (Object.keys(longevityMatch).length > 0) {
        matchConditions.push(longevityMatch);
      }
    }

    // Price filter - check if any price in array matches the range
    if (minPrice || maxPrice) {
      const priceMatch = {};
      if (minPrice && maxPrice) {
        priceMatch.price = { $elemMatch: { $gte: Number(minPrice), $lte: Number(maxPrice) } };
      } else if (minPrice) {
        priceMatch.price = { $elemMatch: { $gte: Number(minPrice) } };
      } else if (maxPrice) {
        priceMatch.price = { $elemMatch: { $lte: Number(maxPrice) } };
      }
      if (Object.keys(priceMatch).length > 0) {
        matchConditions.push(priceMatch);
      }
    }

    // Availability filter - support multiple options (comma-separated or array)
    if (availability) {
      const availabilityArray = Array.isArray(availability) ? availability : availability.split(',').map(a => a.trim()).filter(Boolean);
      if (availabilityArray.length > 0) {
        const availabilityConditions = [];
        availabilityArray.forEach(avail => {
          if (avail === 'onSale') {
            // Product is on sale if it has originalPrice
            availabilityConditions.push({ originalPrice: { $exists: true, $ne: [], $not: { $size: 0 } } });
          } else if (avail === 'bestSeller') {
            availabilityConditions.push({ bestSeller: true });
          } else if (avail === 'limitedEdition') {
            availabilityConditions.push({ limitedEdition: true });
          }
        });
        if (availabilityConditions.length > 0) {
          matchConditions.push({ $or: availabilityConditions });
        }
      }
    }

    // Apply all filter conditions
    if (matchConditions.length > 0) {
      pipeline.push({ $match: { $and: matchConditions } });
    }

    // Search - first try exact/partial match, then fuzzy match if no results
    let searchApplied = false;
    if (search && search.trim()) {
      const searchTerm = search.trim();
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { brand: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { accords: { $elemMatch: { $regex: searchTerm, $options: 'i' } } }
          ]
        }
      });
      searchApplied = true;
    }

    // Add minPrice field for sorting (but preserve original price array)
    // This calculates the minimum price from the price array, or uses 0 if no prices exist
    // IMPORTANT: $addFields preserves all existing fields, so price array will be included
    pipeline.push({
      $addFields: {
        minPrice: {
          $cond: {
            if: {
              $and: [
                { $isArray: '$price' },
                { $gt: [{ $size: { $ifNull: ['$price', []] } }, 0] }
              ]
            },
            then: { $min: '$price' },
            else: 0
          }
        }
      }
    });

    // Ensure price and volume arrays are always included in output
    // This projection step ensures all fields are preserved
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        brand: 1,
        country: 1,
        gender: 1,
        type: 1,
        accords: 1,
        notes: 1,
        description: 1,
        season: 1,
        weather: 1,
        price: 1, // Explicitly include price array
        originalPrice: 1, // Include originalPrice array for sale prices
        volume: 1, // Explicitly include volume array
        year: 1,
        reviews: 1,
        longevity: 1,
        sillage: 1,
        image_path: 1,
        stock: 1,
        onSale: 1,
        bestSeller: 1,
        limitedEdition: 1,
        createdAt: 1,
        minPrice: 1 // Include calculated minPrice for sorting
      }
    });

    // Sorting
    // Handle recommended sort (scent profile based) - must be done after getting products
    let sortByRecommended = false;
    if (sort === 'recommended' && req.user) {
      sortByRecommended = true;
      // We'll handle this after getting products
    } else if (sort === 'price_asc') {
      pipeline.push({ $sort: { minPrice: 1 } });
    } else if (sort === 'price_desc') {
      pipeline.push({ $sort: { minPrice: -1 } });
    } else if (sort === 'reviews') {
      pipeline.push({ $sort: { reviews: -1 } });
    } else if (sort === 'year') {
      pipeline.push({ $sort: { year: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Count total products before pagination
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });
    const countResult = await Product.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // For recommended sort, we need to get all products first, then sort and paginate
    let products;
    if (sortByRecommended && req.user) {
      // Get all products without pagination
      const allProductsPipeline = [...pipeline];
      const allProducts = await Product.aggregate(allProductsPipeline);

      // Handle recommended sort (scent profile based)
      const ScentProfile = require('../models/ScentProfile');
      const { calculateMatchScore } = require('../utils/quizAlgorithm');

      const scentProfile = await ScentProfile.findOne({ user: req.user._id });
      if (scentProfile && scentProfile.answers) {
        // Calculate suitability scores for all products
        const productsWithScores = allProducts.map(product => {
          const { score } = calculateMatchScore(scentProfile.answers, product);
          return {
            ...product,
            suitabilityScore: score
          };
        });

        // Sort by suitability score (descending)
        productsWithScores.sort((a, b) => (b.suitabilityScore || 0) - (a.suitabilityScore || 0));

        // Apply pagination manually
        products = productsWithScores.slice(skip, skip + limitNum);
      } else {
        // If no scent profile, fall back to default sort and apply pagination
        allProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        products = allProducts.slice(skip, skip + limitNum);
      }
    } else {
      // Normal flow: add pagination to pipeline
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limitNum });

      // Execute aggregation
      products = await Product.aggregate(pipeline);
    }

    // If search was applied but no results found, try fuzzy matching
    if (search && search.trim() && products.length === 0 && searchApplied) {
      // Create a new pipeline without the search filter for fuzzy matching
      const fuzzyPipeline = [];

      // Reapply all filter conditions (except search)
      if (matchConditions.length > 0) {
        fuzzyPipeline.push({ $match: { $and: matchConditions } });
      }

      // Add minPrice field
      fuzzyPipeline.push({
        $addFields: {
          minPrice: {
            $cond: {
              if: {
                $and: [
                  { $isArray: '$price' },
                  { $gt: [{ $size: { $ifNull: ['$price', []] } }, 0] }
                ]
              },
              then: { $min: '$price' },
              else: 0
            }
          }
        }
      });

      // Project all fields
      fuzzyPipeline.push({
        $project: {
          _id: 1,
          name: 1,
          brand: 1,
          country: 1,
          gender: 1,
          type: 1,
          accords: 1,
          notes: 1,
          description: 1,
          season: 1,
          weather: 1,
          price: 1,
          originalPrice: 1, // Include originalPrice array for sale prices
          volume: 1,
          year: 1,
          reviews: 1,
          longevity: 1,
          sillage: 1,
          image_path: 1,
          stock: 1,
          onSale: 1,
          bestSeller: 1,
          limitedEdition: 1,
          createdAt: 1,
          minPrice: 1
        }
      });

      // Get all products matching other filters (without search)
      const allProducts = await Product.aggregate(fuzzyPipeline);

      // Apply fuzzy search on the filtered products
      const fuzzyResults = findFuzzyMatches(search.trim(), allProducts, 0.5);

      // Apply sorting to fuzzy results
      if (sort === 'recommended' && req.user) {
        const ScentProfile = require('../models/ScentProfile');
        const { calculateMatchScore } = require('../utils/quizAlgorithm');

        const scentProfile = await ScentProfile.findOne({ user: req.user._id });
        if (scentProfile && scentProfile.answers) {
          // Calculate suitability scores and sort
          const fuzzyResultsWithScores = fuzzyResults.map(product => {
            const { score } = calculateMatchScore(scentProfile.answers, product);
            return {
              ...product,
              suitabilityScore: score
            };
          });
          fuzzyResultsWithScores.sort((a, b) => (b.suitabilityScore || 0) - (a.suitabilityScore || 0));
          products = fuzzyResultsWithScores;
        } else {
          // Fall back to default sort
          fuzzyResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          products = fuzzyResults;
        }
      } else if (sort === 'price_asc') {
        fuzzyResults.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
        products = fuzzyResults;
      } else if (sort === 'price_desc') {
        fuzzyResults.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));
        products = fuzzyResults;
      } else if (sort === 'reviews') {
        fuzzyResults.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        products = fuzzyResults;
      } else if (sort === 'year') {
        fuzzyResults.sort((a, b) => (b.year || 0) - (a.year || 0));
        products = fuzzyResults;
      } else {
        fuzzyResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        products = fuzzyResults;
      }

      // For fuzzy results, we need to handle pagination manually
      const fuzzyTotal = products.length;
      const startIndex = skip;
      const endIndex = skip + limitNum;
      products = products.slice(startIndex, endIndex);

      // Return paginated fuzzy results
      const totalPages = Math.ceil(fuzzyTotal / limitNum);
      return res.json({
        success: true,
        count: products.length,
        total: fuzzyTotal,
        page: pageNum,
        limit: limitNum,
        totalPages: totalPages,
        data: products
      });
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      count: products.length,
      total: total,
      page: pageNum,
      limit: limitNum,
      totalPages: totalPages,
      data: products
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Calculate suitability score if user is logged in and has a scent profile
    let suitabilityScore = null;
    if (req.user) {
      const ScentProfile = require('../models/ScentProfile');
      const { calculateMatchScore } = require('../utils/quizAlgorithm');

      const scentProfile = await ScentProfile.findOne({ user: req.user._id });
      if (scentProfile && scentProfile.answers) {
        const { score } = calculateMatchScore(scentProfile.answers, product);
        suitabilityScore = score;
      }
    }

    res.json({
      success: true,
      data: product,
      suitabilityScore: suitabilityScore !== null ? `${suitabilityScore}%` : null
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create product (Admin)
// @route   POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    // Get the old product to check stock change
    const oldProduct = await Product.findById(req.params.id);
    const oldStock = oldProduct ? oldProduct.stock : 0;

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if stock went from 0 (or less) to positive - notify subscribed users
    if (oldStock <= 0 && product.stock > 0) {
      const { notifyStockRestored } = require('./stockNotificationController');
      await notifyStockRestored(product._id);
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
  // Note: review endpoints removed because schema stores 'reviews' as an average number.