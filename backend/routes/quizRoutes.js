const express = require('express');
const router = express.Router();
const {
  getQuizQuestions,
  submitQuiz,
  getScentProfile,
  updateScentProfile
} = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');

// All quiz routes require authentication
router.get('/questions', protect, getQuizQuestions);
router.post('/submit', protect, submitQuiz);
router.get('/profile', protect, getScentProfile);
router.put('/profile', protect, updateScentProfile);

module.exports = router;

