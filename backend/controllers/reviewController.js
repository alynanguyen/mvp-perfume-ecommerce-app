const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Helper function to update product average rating
const updateProductRating = async (productId) => {
  try {
    const reviews = await Review.find({ product: productId });
    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, { reviews: 0 });
      return;
    }

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, { reviews: Math.round(averageRating * 10) / 10 });
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!productId || !orderId || !rating) {
      return res.status(400).json({ success: false, message: 'Product ID, Order ID, and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Check if order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this order' });
    }

    // Check if order is delivered
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'You can only review products from delivered orders'
      });
    }

    // Check if product is in the order (any volume)
    const productInOrder = order.items.find(item => item.product.toString() === productId);
    if (!productInOrder) {
      return res.status(400).json({ success: false, message: 'Product not found in this order' });
    }

    // Check if review already exists for this user, product, and order
    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
      order: orderId
    });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product for this order' });
    }

    // Create review
    const review = await Review.create({
      user: userId,
      product: productId,
      order: orderId,
      rating,
      comment: comment || ''
    });

    // Update product average rating
    await updateProductRating(productId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product for this order' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Review.countDocuments({ product: productId });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's review for a product in an order
// @route   GET /api/reviews/order/:orderId/product/:productId
// @access  Private
exports.getUserReview = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const userId = req.user._id;

    const review = await Review.findOne({
      user: userId,
      product: productId,
      order: orderId
    }).populate('user', 'name email');

    if (!review) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();

    // Update product average rating
    await updateProductRating(review.product);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    const productId = review.product;
    await review.deleteOne();

    // Update product average rating
    await updateProductRating(productId);

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

