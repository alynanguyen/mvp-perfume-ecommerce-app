const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user cart
// @route   GET /api/cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name brand image_path price volume _id'
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, priceIndex } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    // Validate price index and get corresponding price and volume
    if (!Array.isArray(product.price) || !Array.isArray(product.volume) ||
        product.price.length === 0 || product.volume.length === 0 ||
        product.price.length !== product.volume.length) {
      return res.status(400).json({ success: false, message: 'Invalid product price/volume configuration' });
    }

    if (priceIndex === undefined || priceIndex < 0 || priceIndex >= product.price.length) {
      return res.status(400).json({ success: false, message: 'Invalid price selection' });
    }

    const itemPrice = product.price[priceIndex];
    const itemVolume = product.volume[priceIndex];

    if (!itemPrice || !itemVolume) {
      return res.status(400).json({ success: false, message: 'Invalid price/volume selection' });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{
          product: productId,
          quantity,
          price: itemPrice,
          volume: itemVolume,
          priceIndex
        }]
      });
    } else {
      // Find item with same product AND volume/price selection
      const itemIndex = cart.items.findIndex(item =>
        item.product.toString() === productId &&
        item.priceIndex === priceIndex
      );

      if (itemIndex > -1) {
        // Update quantity if same product and volume
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Add as new item if different volume or new product
        cart.items.push({
          product: productId,
          quantity,
          price: itemPrice,
          volume: itemVolume,
          priceIndex
        });
      }

      await cart.save();
    }

    cart = await cart.populate('items.product');
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      item.remove();
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product');

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
    await cart.save();
    await cart.populate('items.product');

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};