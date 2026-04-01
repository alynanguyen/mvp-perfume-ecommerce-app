const mongoose = require('mongoose');

const stockNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  notified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate notifications for same user-product pair
stockNotificationSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('StockNotification', stockNotificationSchema);

