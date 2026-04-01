import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { quizAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ScentProfile from './ScentProfile';

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const location = useLocation();
  const justSubmitted = location.state?.justSubmitted;
  const [hasProfile, setHasProfile] = useState(justSubmitted || false);
  const [checkingProfile, setCheckingProfile] = useState(!justSubmitted);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const retake = searchParams.get('retake') === 'true';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/quiz');
      return;
    }
    // If we just submitted, skip the loading check and go straight to profile
    if (justSubmitted) {
      setHasProfile(true);
      setCheckingProfile(false);
      setLoading(false);
      setAnalyzing(false);
    } else if (!hasProfile && !analyzing && !justSubmitted) {
      checkProfile();
    }
  }, [isAuthenticated, navigate, retake, justSubmitted]);

  // Reset scroll position when question changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestion]);

  const checkProfile = async () => {
    try {
      setCheckingProfile(true);
      const response = await quizAPI.getProfile();
      if (response.data.success && response.data.data && !retake) {
        // User has a profile and not retaking
        setHasProfile(true);
        setLoading(false);
      } else {
        // User doesn't have a profile or is retaking
        setHasProfile(false);
        setQuizStarted(false); // Reset quiz started state when loading questions
        loadQuestions();
      }
    } catch (error) {
      // No profile found or error - show quiz
      if (error.response?.status === 404 || retake) {
        setHasProfile(false);
        setQuizStarted(false); // Reset quiz started state
        loadQuestions();
      } else {
        console.error('Error checking profile:', error);
        setHasProfile(false);
        setQuizStarted(false); // Reset quiz started state
        loadQuestions();
      }
    } finally {
      setCheckingProfile(false);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getQuestions();
      setQuestions(response.data.data.questions || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      setError('Failed to load quiz questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (value) => {
    const question = questions[currentQuestion];
    const field = question.field;

    // Single-select fields (should be strings, not arrays)
    const singleSelectFields = ['gender', 'vibe', 'longevity_category', 'price'];

    // For price field, store the entire object (with range)
    if (field === 'price' && typeof value === 'object') {
      setAnswers({
        ...answers,
        [field]: value,
      });
      return;
    }

    // Handle single-select fields (gender, vibe, longevity_category)
    if (singleSelectFields.includes(field) && field !== 'price') {
      // For longevity_category, extract label if it's an object
      if (field === 'longevity_category' && typeof value === 'object' && value.label) {
        setAnswers({
          ...answers,
          [field]: value.label,
        });
      } else {
        // For gender and vibe, store as string
        setAnswers({
          ...answers,
          [field]: typeof value === 'string' ? value : String(value),
        });
      }
      return;
    }

    // Handle multiple-select fields (arrays)
    if (question.type === 'multiple') {
      if (Array.isArray(answers[field])) {
        // Check if value is already in array (handle both objects and primitives)
        const isSelected = answers[field].some((v) => {
          if (typeof v === 'object' && typeof value === 'object') {
            return JSON.stringify(v) === JSON.stringify(value);
          }
          return v === value;
        });

        if (isSelected) {
          setAnswers({
            ...answers,
            [field]: answers[field].filter((v) => {
              if (typeof v === 'object' && typeof value === 'object') {
                return JSON.stringify(v) !== JSON.stringify(value);
              }
              return v !== value;
            }),
          });
        } else {
          setAnswers({
            ...answers,
            [field]: [...answers[field], value],
          });
        }
      } else {
        setAnswers({
          ...answers,
          [field]: [value],
        });
      }
    } else {
      setAnswers({
        ...answers,
        [field]: value,
      });
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    // Reset scroll position to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // Format answers according to backend expectations
      const formattedAnswers = { ...answers };

      // Single-select fields that should be strings, not arrays
      const singleSelectFields = ['gender', 'vibe', 'longevity_category'];

      // Extract single values from arrays if they were stored as arrays
      singleSelectFields.forEach(field => {
        if (Array.isArray(formattedAnswers[field])) {
          const value = formattedAnswers[field][0];
          if (field === 'longevity_category' && typeof value === 'object' && value.label) {
            formattedAnswers[field] = value.label;
          } else {
            formattedAnswers[field] = typeof value === 'string' ? value : String(value);
          }
        } else if (formattedAnswers[field] && typeof formattedAnswers[field] === 'object') {
          // Handle longevity_category object
          if (field === 'longevity_category' && formattedAnswers[field].label) {
            formattedAnswers[field] = formattedAnswers[field].label;
          }
        }
      });

      // Handle price range format
      if (formattedAnswers.price) {
        if (Array.isArray(formattedAnswers.price)) {
          // If price is an array, extract the first element if it's an object
          const priceValue = formattedAnswers.price[0];
          if (typeof priceValue === 'object' && priceValue.range) {
            formattedAnswers.price = priceValue;
          } else {
            formattedAnswers.price = { range: formattedAnswers.price };
          }
        } else if (typeof formattedAnswers.price === 'object') {
          if (!formattedAnswers.price.range) {
            // If price object doesn't have range, it might be invalid
            formattedAnswers.price = { range: [0, 100] }; // Default
          }
        }
      }

      // Show analyzing state
      setSubmitting(false);
      setAnalyzing(true);

      // Start timer for minimum 10 seconds
      const startTime = Date.now();
      const minDisplayTime = 5000; // 5 seconds
      const maxDisplayTime = 10000; // 10 seconds

      const response = await quizAPI.submitQuiz(formattedAnswers);
      if (response.data.success) {
        // Calculate remaining time to ensure minimum display time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, Math.min(maxDisplayTime, minDisplayTime) - elapsedTime);

        // Wait for remaining time if needed
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        // Clear analyzing state and set profile before navigation
        setAnalyzing(false);
        setHasProfile(true);
        setCheckingProfile(false);
        setLoading(false);

        // Navigate to scent profile with state to skip loading check
        navigate('/quiz', {
          replace: true,
          state: { justSubmitted: true }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz');
      setAnalyzing(false);
      setSubmitting(false);
    }
  };

  const isQuestionAnswered = () => {
    const question = questions[currentQuestion];
    if (!question) return false;

    const field = question.field;
    const answer = answers[field];

    if (question.optional) return true;
    if (!answer) return false;

    // Single-select fields (should be strings, not arrays)
    const singleSelectFields = ['gender', 'vibe', 'longevity_category', 'price'];
    if (singleSelectFields.includes(field)) {
      // For single-select fields, check if it's a valid string or object
      if (field === 'price') {
        return typeof answer === 'object' && answer !== null && (answer.range || answer.label);
      }
      if (field === 'longevity_category') {
        return (typeof answer === 'string' && answer !== '') ||
               (typeof answer === 'object' && answer !== null && answer.label);
      }
      return typeof answer === 'string' && answer !== '';
    }

    // Multiple-select fields (should be arrays)
    if (Array.isArray(answer)) return answer.length > 0;
    return answer !== null && answer !== undefined && answer !== '';
  };

  const canProceed = () => {
    return isQuestionAnswered();
  };

  if (checkingProfile || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show analyzing state after quiz submission
  if (analyzing) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Preferences</h2>
        <p className="text-gray-600">We're calculating your perfect scent matches...</p>
      </div>
    );
  }

  // If user has a profile and not retaking, show profile view
  if (hasProfile && !retake) {
    return <ScentProfile />;
  }

  // Show intro screen before quiz starts
  if (!quizStarted && questions.length > 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 text-center">
          <div className="mb-8">
            <div className="inline-block p-4 bg-indigo-100 rounded-full mb-6">
              <svg className="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Perfect Scent</h1>
            <p className="text-lg text-gray-600 mb-6">
              Take our personalized quiz to discover fragrances that match your unique preferences and style.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What to Expect</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Answer a few quick questions about your preferences</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Get personalized fragrance recommendations</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Discover scents tailored to your personality and lifestyle</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Takes approximately {Math.ceil(questions.length * 0.5)} minutes to complete</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              setQuizStarted(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors text-lg font-semibold"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-500">No questions available</p>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const answer = answers[question.field];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{question.question}</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3 mb-8">
          {question.options.map((option, index) => {
            const optionValue = typeof option === 'object' ? option : option;
            const optionLabel = typeof option === 'object' ? option.label || option.value : option;

            // Single-select fields (should be strings, not arrays)
            const singleSelectFields = ['gender', 'vibe', 'longevity_category', 'price'];
            const isSingleSelect = singleSelectFields.includes(question.field);

            // Check if option should be disabled (for disliked_notes, disable if selected in liked_notes)
            let isDisabled = false;
            if (question.field === 'disliked_notes' && answers.liked_notes) {
              const likedNotes = Array.isArray(answers.liked_notes) ? answers.liked_notes : [answers.liked_notes];
              isDisabled = likedNotes.some((likedNote) => {
                if (typeof likedNote === 'string' && typeof optionValue === 'string') {
                  return likedNote === optionValue;
                }
                return false;
              });
            }

            // Check if option is selected (handle both objects and primitives)
            let isSelected = false;

            if (isSingleSelect) {
              // For single-select fields, answer should be a string or object, not an array
              if (question.field === 'longevity_category') {
                // For longevity_category, compare label if answer is object
                if (typeof answer === 'object' && answer !== null && answer.label) {
                  isSelected = answer.label === (optionValue.label || optionValue);
                } else if (typeof answer === 'string') {
                  isSelected = answer === (optionValue.label || optionValue);
                }
              } else if (question.field === 'price') {
                // For price, compare objects
                if (typeof answer === 'object' && answer !== null && typeof optionValue === 'object') {
                  isSelected = answer.label === optionValue.label ||
                              JSON.stringify(answer) === JSON.stringify(optionValue);
                }
              } else {
                // For gender and vibe, compare strings
                const answerStr = typeof answer === 'string' ? answer : String(answer);
                const optionStr = typeof optionValue === 'string' ? optionValue : String(optionValue);
                isSelected = answerStr === optionStr;
              }
            } else if (Array.isArray(answer)) {
              // Multiple-select fields (arrays)
              isSelected = answer.some((a) => {
                if (typeof a === 'object' && typeof optionValue === 'object') {
                  return JSON.stringify(a) === JSON.stringify(optionValue);
                }
                return a === optionValue;
              });
            } else {
              // Fallback for non-array answers
              if (typeof answer === 'object' && typeof optionValue === 'object') {
                isSelected = JSON.stringify(answer) === JSON.stringify(optionValue);
              } else {
                isSelected = answer === optionValue;
              }
            }

            return (
              <button
                key={index}
                onClick={() => !isDisabled && handleAnswer(optionValue)}
                disabled={isDisabled}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  isDisabled
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                    : isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                }`}
                title={isDisabled ? 'This note is already selected in "Notes you love"' : ''}
              >
                {optionLabel}
                {isDisabled && (
                  <span className="ml-2 text-xs text-gray-400">(Already in liked notes)</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;

