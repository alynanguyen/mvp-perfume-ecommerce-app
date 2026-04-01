const StockNotification = require('../models/StockNotification');
const Notification = require('../models/Notification');
const Product = require('../models/Product');

// @desc    Subscribe to stock notification
// @route   POST /api/products/:id/notify-stock
// @access  Private
exports.subscribeStockNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if product is already in stock
    if (product.stock > 0) {
      return res.status(400).json({
        success: false,
        message: 'Product is already in stock'
      });
    }

    // Check if user already subscribed
    const existing = await StockNotification.findOne({
      user: req.user._id,
      product: id
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'You are already subscribed to notifications for this product',
        data: existing
      });
    }

    // Create subscription
    const stockNotification = await StockNotification.create({
      user: req.user._id,
      product: id
    });

    res.status(201).json({
      success: true,
      message: 'You will be notified when this product is back in stock',
      data: stockNotification
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Unsubscribe from stock notification
// @route   DELETE /api/products/:id/notify-stock
// @access  Private
exports.unsubscribeStockNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const stockNotification = await StockNotification.findOneAndDelete({
      user: req.user._id,
      product: id
    });

    if (!stockNotification) {
      return res.status(404).json({
        success: false,
        message: 'Stock notification subscription not found'
      });
    }

    res.json({
      success: true,
      message: 'Unsubscribed from stock notifications'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Check if user is subscribed to stock notifications for a product
// @route   GET /api/products/:id/notify-stock
// @access  Private
exports.checkSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const stockNotification = await StockNotification.findOne({
      user: req.user._id,
      product: id
    });

    res.json({
      success: true,
      subscribed: !!stockNotification,
      data: stockNotification
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Helper function to notify users when product comes back in stock
// This should be called when product stock is updated from 0 to > 0
exports.notifyStockRestored = async (productId) => {
  try {
    const product = await Product.findById(productId);
    if (!product || product.stock <= 0) return;

    // Find all users who subscribed to notifications for this product and haven't been notified yet
    const subscriptions = await StockNotification.find({
      product: productId,
      notified: false
    }).populate('user');

    if (subscriptions.length === 0) return;

    // Create notifications for all subscribed users
    const notifications = subscriptions.map(sub => ({
      user: sub.user._id,
      type: 'stock_restored',
      title: 'Product Back in Stock',
      message: `${product.name} is now back in stock!`,
      relatedId: productId,
      relatedModel: null
    }));

    await Notification.insertMany(notifications);

    // Mark all subscriptions as notified
    await StockNotification.updateMany(
      { product: productId, notified: false },
      { notified: true }
    );

    console.log(`Sent stock restoration notifications to ${subscriptions.length} users for product ${product.name}`);
  } catch (error) {
    console.error('Error notifying users about stock restoration:', error);
  }
};

module.exports = exports;

