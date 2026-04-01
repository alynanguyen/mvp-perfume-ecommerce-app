import { useState, useEffect } from 'react';
import { reviewsAPI } from '../../services/api';
import MaterialIcon from '../common/MaterialIcon';
import Alert from '../common/Alert';
import Button from '../common/Button';

const ReviewForm = ({ productId, orderId, productName, existingReview, onReviewSubmitted, onReviewUpdated }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
      setIsEditMode(false); // Reset to read-only mode when review changes
    } else {
      setIsEditMode(true); // New review starts in edit mode
    }
  }, [existingReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (existingReview) {
        // Update existing review
        const response = await reviewsAPI.updateReview(existingReview._id, { rating, comment });
        if (response.data.success) {
          setSuccess('Review updated successfully');
          if (onReviewUpdated) onReviewUpdated(response.data.data);
          setIsEditMode(false); // Switch back to read-only mode after update
        }
      } else {
        // Create new review
        const response = await reviewsAPI.createReview({
          productId,
          orderId,
          rating,
          comment
        });
        if (response.data.success) {
          setSuccess('Review submitted successfully');
          if (onReviewSubmitted) onReviewSubmitted(response.data.data);
          setIsEditMode(false); // Switch to read-only mode after submission
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    // Reset to original review values
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
    setIsEditMode(false);
    setError('');
    setSuccess('');
  };

  // If review exists and not in edit mode, show read-only view
  if (existingReview && !isEditMode) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Rating for {productName}
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialIcon
                key={star}
                icon="star"
                size={28}
                filled={true}
                className={
                  star <= rating
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }
              />
            ))}
            <span className="ml-2 text-sm text-gray-600">{rating} / 5</span>
          </div>
        </div>

        {comment && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Comment
            </label>
            <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700 whitespace-pre-wrap">
              {comment}
            </div>
          </div>
        )}

        {success && (
          <Alert type="success" message={success} />
        )}

        <Button
          type="button"
          onClick={handleEdit}
          fullWidth
        >
          Edit Review
        </Button>
      </div>
    );
  }

  // Edit mode or new review - show editable form
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating for {productName}
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <MaterialIcon
                icon="star"
                size={28}
                filled={true}
                className={
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-600">{rating} / 5</span>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Comment (optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Share your thoughts about this product..."
        />
        <p className="mt-1 text-xs text-gray-500">{comment.length} / 1000 characters</p>
      </div>

              {error && (
                <Alert type="error" message={error} />
              )}

              {success && (
                <Alert type="success" message={success} />
              )}

              <div className="flex gap-2">
                {existingReview && (
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="secondary"
                    fullWidth
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={submitting || rating === 0}
                  fullWidth={!existingReview}
                  className={existingReview ? 'flex-1' : 'w-full'}
                >
                  {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
                </Button>
              </div>
    </form>
  );
};

export default ReviewForm;

