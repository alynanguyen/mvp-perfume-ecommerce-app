import { useState } from 'react';
import MaterialIcon from './MaterialIcon';

const PasswordInput = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  className = '',
  label,
  labelClassName = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div>
      {label && (
        <label htmlFor={id} className={labelClassName || 'block text-sm font-medium text-gray-700 mb-2'}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`${className} pr-10`}
          {...props}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePasswordVisibility();
          }}
          onMouseDown={(e) => {
            // Prevent input from losing focus when clicking the button
            e.preventDefault();
          }}
          className="absolute inset-y-0 right-0 flex items-center justify-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none z-10 w-10 cursor-pointer"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <MaterialIcon icon={showPassword ? 'visibility_off' : 'visibility'} size={20} />
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;

