/**
 * StatusBadge Component
 * Reusable status badge component for order statuses and other status indicators
 *
 * @param {string} status - The status value (e.g., 'processing', 'delivered', 'cancelled')
 * @param {string} size - Badge size: 'sm', 'md' (default: 'md')
 * @param {string} className - Additional CSS classes
 */
const StatusBadge = ({ status, size = 'md', className = '' }) => {
  const statusColors = {
    processing: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    // Default fallback
    default: 'bg-gray-100 text-gray-800'
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const colorClass = statusColors[status] || statusColors.default;
  const formattedStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : '';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeStyles[size]} ${className}`}>
      {formattedStatus}
    </span>
  );
};

export default StatusBadge;

