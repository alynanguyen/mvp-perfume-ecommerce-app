const User = require('../models/User');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const ScentProfile = require('../models/ScentProfile');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'scentProfile',
        populate: {
          path: 'recommendations.product',
          select: 'name brand description image_path price volume accords'
        }
      });

    // Check if user has reset code set (without exposing the actual code)
    const userWithResetCode = await User.findById(req.user._id).select('+resetCode');
    const hasResetCode = !!userWithResetCode?.resetCode;

    const userData = user.toObject();
    userData.hasResetCode = hasResetCode;

    res.json({ success: true, data: userData });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address
    };

    const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password - Step 1: Verify email (doesn't generate token yet)
// @route   POST /api/auth/forgotpassword
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('+resetCode');

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, you can proceed to enter your reset code.'
      });
    }

    // Check if user has set up a reset code
    if (!user.resetCode) {
      return res.status(400).json({
        success: false,
        message: 'You have not set up a reset code. Please contact support or set up your reset code in account settings.'
      });
    }

    // Email is valid and has reset code, proceed to code verification step
    res.json({
      success: true,
      message: 'Please enter your 6-digit reset code.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

// @desc    Verify reset code and generate reset token
// @route   POST /api/auth/verify-reset-code
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Reset code must be exactly 6 digits'
      });
    }

    const user = await User.findOne({ email }).select('+resetCode');

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(401).json({
        success: false,
        message: 'Invalid code. Please contact support.'
      });
    }

    // Check if user has set up a reset code
    if (!user.resetCode) {
      return res.status(401).json({
        success: false,
        message: 'Invalid code. Please contact support.'
      });
    }

    // Verify reset code
    const isCodeValid = await user.compareResetCode(code);
    if (!isCodeValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid code. Please contact support.'
      });
    }

    // Code is valid, generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Code verified successfully',
      resetToken: resetToken,
      resetUrl: `/resetpassword/${resetToken}`
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    // Get user (code was already verified before token was generated)
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Set or update reset code
// @route   PUT /api/auth/set-reset-code
// @access  Private
exports.setResetCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Reset code must be exactly 6 digits'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Set the reset code (will be hashed by pre-save hook)
    user.resetCode = code;
    await user.save();

    res.json({
      success: true,
      message: 'Reset code set successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check for ongoing orders (processing, confirmed, shipped - not delivered or cancelled)
    const ongoingOrders = await Order.find({
      user: userId,
      orderStatus: { $in: ['processing', 'confirmed', 'shipped'] }
    });

    if (ongoingOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account. You have ongoing orders. Please wait until all orders are delivered or cancelled before deleting your account.'
      });
    }

    // Delete user's related data
    await Cart.deleteOne({ user: userId });
    await ScentProfile.deleteOne({ user: userId });
    await Notification.deleteMany({ user: userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};