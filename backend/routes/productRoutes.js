const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const {
  subscribeStockNotification,
  unsubscribeStockNotification,
  checkSubscription
} = require('../controllers/stockNotificationController');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');

router.route('/')
  .get(optionalAuth, getProducts)
  .post(protect, authorize('admin'), createProduct);

router.route('/:id')
  .get(optionalAuth, getProduct)
  .put(protect, authorize('admin'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

// Stock notification routes
router.route('/:id/notify-stock')
  .get(protect, checkSubscription)
  .post(protect, subscribeStockNotification)
  .delete(protect, unsubscribeStockNotification);

// Note: review endpoint removed — product schema now stores `reviews` as an average number

module.exports = router;