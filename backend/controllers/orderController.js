const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

/**
 * DEMO-ONLY ORDER CONTROLLER
 *
 * ⚠️ WARNING: This is a demonstration/practice application.
 * Orders are created for demonstration purposes only.
 * NO REAL PAYMENTS ARE PROCESSED.
 */

// @desc    Create order (DEMO ONLY - No real payment processing)
// @route   POST /api/orders
// @access  Private
//
// This endpoint creates an order with a simulated payment.
// Payment processing is handled separately via the payment controller (demo mode).
// Stock is updated and cart is cleared, but no real money is charged.
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, paymentIntentId, couponCode, discount, totalPrice, cardDetails } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Validate coupon code - must be "FREE" for 100% discount
    if (!couponCode || couponCode.toUpperCase() !== 'FREE') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing coupon code. You must use the "FREE" coupon code to proceed. This ensures no real money is charged.'
      });
    }

    // Validate discount matches cart total (100% discount)
    const expectedDiscount = cart.totalPrice;
    if (!discount || discount !== expectedDiscount) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discount amount. The "FREE" coupon must provide 100% discount.'
      });
    }

    // Validate final total is 0
    const finalTotal = totalPrice || (cart.totalPrice - discount);
    if (finalTotal !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Order total must be $0.00 with the FREE coupon code applied.'
      });
    }

    // Check stock availability
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}`
        });
      }
    }

    // DEMO MODE: Generate a mock transaction ID
    // No real payment is processed - this is for demonstration only
    const demoTransactionId = paymentIntentId
      ? `DEMO-TXN-${paymentIntentId}`
      : `DEMO-TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;


      // Create order - normalize price and include volume
      const orderItems = cart.items.map(item => {
        // normalize price: if price is an array, use the first value; else use the numeric value
        const price = Array.isArray(item.price)
          ? (item.price.length > 0 ? Number(item.price[0]) : 0)
          : Number(item.price || 0);

        // determine volume: prefer item.volume, fall back to populated product volume, default to 0
        const volume = Number(item.volume ?? item.product?.volume ?? 0);

        return {
          product: item.product._id,
          name: item.product.name,
          quantity: item.quantity,
          price,
          volume
        };
      });

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentInfo: {
        method: paymentMethod || 'card',
        transactionId: demoTransactionId,
        status: 'completed', // Demo payment always succeeds
        demo: true, // Mark as demo transaction
        note: 'This is a demonstration order. No real payment was processed. FREE coupon code applied for 100% discount.',
        cardDetails: cardDetails || null
      },
      totalPrice: finalTotal, // Use discounted total (should be 0)
      couponCode: couponCode.toUpperCase(),
      discount: discount
    });

    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    // Create notification for order placement
    await Notification.create({
      user: req.user._id,
      type: 'order_placed',
      title: 'Order Placed Successfully',
      message: `Your order #${order.orderNumber} has been placed successfully.`,
      relatedId: order._id,
      relatedModel: 'Order'
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
      demo: true,
      warning: 'This is a demonstration order. No real payment was charged.'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get user orders (or all orders if admin)
// @route   GET /api/orders
exports.getOrders = async (req, res) => {
  try {
    // If admin, return all orders; otherwise return only user's orders
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };

    const orders = await Order.find(query)
      .populate('items.product', 'name images')
      .populate('user', 'name email')
      .sort('-createdAt');

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    order.updatedAt = Date.now();

    await order.save();

    // Create notification for status change
    if (oldStatus !== status) {
      const statusMessages = {
        'processing': 'Your order is being processed',
        'confirmed': 'Your order has been confirmed',
        'shipped': 'Your order has been shipped',
        'delivered': 'Your order has been delivered',
        'cancelled': 'Your order has been cancelled'
      };

      await Notification.create({
        user: order.user,
        type: 'order_status',
        title: `Order #${order.orderNumber} Status Updated`,
        message: `${statusMessages[status] || `Your order status has been updated to ${status}`}.${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`,
        relatedId: order._id,
        relatedModel: 'Order'
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Cancel order (User)
// @route   PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Only allow cancellation if order is in processing status
    if (order.orderStatus !== 'processing') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order. Order status is ${order.orderStatus}. Only orders with "processing" status can be cancelled.`
      });
    }

    // Restore product stock and check for stock restoration notifications
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      const oldStock = product ? product.stock : 0;

      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });

      // Check if stock went from 0 (or less) to positive - notify subscribed users
      if (oldStock <= 0 && product && (oldStock + item.quantity) > 0) {
        const { notifyStockRestored } = require('./stockNotificationController');
        await notifyStockRestored(item.product);
      }
    }

    // Update order status
    order.orderStatus = 'cancelled';
    order.updatedAt = Date.now();
    await order.save();

    // Create notification for cancellation
    await Notification.create({
      user: req.user._id,
      type: 'order_cancelled',
      title: 'Order Cancelled',
      message: `Your order #${order.orderNumber} has been cancelled.`,
      relatedId: order._id,
      relatedModel: 'Order'
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

