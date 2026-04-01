const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateProfile, forgotPassword, verifyResetCode, resetPassword, changePassword, setResetCode, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/set-reset-code', protect, setResetCode);
router.delete('/account', protect, deleteAccount);

module.exports = router;
