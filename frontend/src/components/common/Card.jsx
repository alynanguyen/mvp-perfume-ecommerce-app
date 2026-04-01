/**
 * Card Component
 * Reusable card container component
 *
 * @param {string} padding - Padding size: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} shadow - Shadow size: 'sm', 'md', 'lg', 'xl' (default: 'md')
 * @param {boolean} sticky - Whether card should be sticky (default: false)
 * @param {string} className - Additional CSS classes
 * @param {ReactNode} children - Card content
 */
const Card = ({
  padding = 'md',
  shadow = 'md',
  sticky = false,
  className = '',
  children
}) => {
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const shadowStyles = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const baseStyles = 'bg-white rounded-lg';
  const stickyStyles = sticky ? 'sticky top-4' : '';

  return (
    <div className={`${baseStyles} ${shadowStyles[shadow]} ${paddingStyles[padding]} ${stickyStyles} ${className}`}>
      {children}
    </div>
  );
};

export default Card;

