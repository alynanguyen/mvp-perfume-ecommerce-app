/**
 * Alert Component
 * Reusable alert/message component for success, error, warning, and info messages
 *
 * @param {string} type - Alert type: 'success', 'error', 'warning', 'info' (default: 'info')
 * @param {string} message - The message to display
 * @param {string} className - Additional CSS classes
 * @param {function} onClose - Optional close handler
 */
const Alert = ({ type = 'info', message, className = '', onClose }) => {
  const typeStyles = {
    success: 'bg-green-50 text-green-700',
    error: 'bg-red-50 text-red-700',
    warning: 'bg-yellow-50 text-yellow-700',
    info: 'bg-blue-50 text-blue-700'
  };

  if (!message) return null;

  return (
    <div className={`p-3 rounded-md text-sm ${typeStyles[type]} ${className}`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-current opacity-70 hover:opacity-100"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;

