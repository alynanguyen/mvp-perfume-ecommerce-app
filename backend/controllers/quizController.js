const ScentProfile = require('../models/ScentProfile');
const Product = require('../models/Product');
const User = require('../models/User');
const { getRecommendations } = require('../utils/quizAlgorithm');
const quizData = require('../data/quiz.json');

/**
 * @desc    Get quiz questions
 * @route   GET /api/quiz/questions
 * @access  Private (logged in users only)
 */
exports.getQuizQuestions = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        quiz_name: quizData.quiz_name,
        questions: quizData.questions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Submit quiz and get recommendations
 * @route   POST /api/quiz/submit
 * @access  Private (logged in users only)
 */
exports.submitQuiz = async (req, res) => {
  try {
    const answers = req.body;

    // Validate required fields
    const requiredFields = ['gender', 'vibe', 'occasion', 'season', 'longevity_category', 'accords', 'liked_notes', 'price'];
    const missingFields = requiredFields.filter(field => !answers[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate and normalize price structure
    if (!answers.price) {
      return res.status(400).json({
        success: false,
        message: 'Price is required'
      });
    }

    // Handle both formats: { label: "Budget", range: [0, 100] } or just the object
    if (answers.price.range && Array.isArray(answers.price.range) && answers.price.range.length === 2) {
      // Already in correct format
    } else if (Array.isArray(answers.price) && answers.price.length === 2) {
      // If price is directly an array, wrap it
      answers.price = { range: answers.price };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Price must have a range array [min, max]'
      });
    }

    // Normalize longevity_category if object is sent
    if (answers.longevity_category && typeof answers.longevity_category === 'object') {
      if (answers.longevity_category.label) {
        answers.longevity_category = answers.longevity_category.label;
      }
    }

    // Get all products from database
    const products = await Product.find({ stock: { $gt: 0 } }); // Only products in stock

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products available for recommendations'
      });
    }

    // Calculate recommendations
    const recommendations = getRecommendations(answers, products, 3);

    // Create or update scent profile
    let scentProfile = await ScentProfile.findOne({ user: req.user._id });

    if (scentProfile) {
      // Update existing profile
      scentProfile.answers = answers;
      scentProfile.recommendations = recommendations;
      scentProfile.updatedAt = new Date();
      await scentProfile.save();
      console.log('ScentProfile updated:', scentProfile._id);
    } else {
      // Create new profile
      try {
        scentProfile = await ScentProfile.create({
          user: req.user._id,
          answers,
          recommendations
        });
        console.log('ScentProfile created:', scentProfile._id);

        // Update user's scent profile reference
        await User.findByIdAndUpdate(req.user._id, { scentProfile: scentProfile._id });
        console.log('User updated with scentProfile reference');
      } catch (createError) {
        console.error('Error creating ScentProfile:', createError);
        throw createError;
      }
    }

    // Populate product details in recommendations
    await scentProfile.populate({
      path: 'recommendations.product',
      select: 'name brand description image_path price volume accords notes season weather longevity reviews'
    });

    res.json({
      success: true,
      message: 'Quiz submitted successfully. Your scent profile has been created.',
      data: {
        profileId: scentProfile._id,
        profile: scentProfile,
        recommendations: scentProfile.recommendations,
        collectionName: 'scentprofiles' // MongoDB collection name (Mongoose pluralizes)
      }
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get user's scent profile
 * @route   GET /api/quiz/profile
 * @access  Private (logged in users only)
 */
exports.getScentProfile = async (req, res) => {
  try {
    const scentProfile = await ScentProfile.findOne({ user: req.user._id })
      .populate({
        path: 'recommendations.product',
        select: 'name brand description image_path price volume accords notes season weather longevity reviews'
      });

    if (!scentProfile) {
      return res.status(404).json({
        success: false,
        message: 'No scent profile found. Please complete the quiz first.'
      });
    }

    res.json({
      success: true,
      data: scentProfile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update user's scent profile
 * @route   PUT /api/quiz/profile
 * @access  Private (logged in users only)
 */
exports.updateScentProfile = async (req, res) => {
  try {
    const updates = req.body;

    let scentProfile = await ScentProfile.findOne({ user: req.user._id });

    if (!scentProfile) {
      return res.status(404).json({
        success: false,
        message: 'No scent profile found. Please complete the quiz first.'
      });
    }

    // Update answers (partial update allowed)
    if (updates.answers) {
      // Only update fields that are actually provided (not undefined or null)
      // Also handle empty arrays for optional fields
      const validUpdates = {};
      for (const [key, value] of Object.entries(updates.answers)) {
        // Skip undefined and null values
        if (value === undefined || value === null) {
          continue;
        }
        // For arrays, allow empty arrays only if the field is optional
        if (Array.isArray(value) && value.length === 0) {
          // Check if this is an optional field (disliked_notes, secondary_accords)
          if (key === 'disliked_notes' || key === 'secondary_accords') {
            validUpdates[key] = value;
          }
          // Skip empty arrays for required fields
          continue;
        }
        validUpdates[key] = value;
      }
      // Merge only valid updates, preserving existing values for fields not being updated
      scentProfile.answers = { ...scentProfile.answers, ...validUpdates };
    }

    // If answers were updated, recalculate recommendations
    if (updates.answers) {
      const products = await Product.find({ stock: { $gt: 0 } });
      if (products.length > 0) {
        const recommendations = getRecommendations(scentProfile.answers, products, 3);
        scentProfile.recommendations = recommendations;
      }
    }

    scentProfile.updatedAt = new Date();
    await scentProfile.save();

    // Populate product details
    await scentProfile.populate({
      path: 'recommendations.product',
      select: 'name brand description image_path price volume accords notes season weather longevity reviews'
    });

    res.json({
      success: true,
      message: 'Scent profile updated successfully',
      data: scentProfile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

