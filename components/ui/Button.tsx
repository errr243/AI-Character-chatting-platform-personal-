import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-300 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none relative overflow-hidden';

  const variantStyles = {
    primary: 'bg-[var(--bg-glass)] backdrop-blur-lg border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)] hover:border-[var(--border-hover)] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-[var(--bg-tertiary)] backdrop-blur-md border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:-translate-y-0.5 active:translate-y-0',
    outline: 'border-2 border-[var(--border-color)] text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-glass)] hover:border-[var(--accent-primary)] hover:-translate-y-0.5 active:translate-y-0',
    ghost: 'text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-glass)] hover:-translate-y-0.5 active:translate-y-0',
    accent: 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white border-0 shadow-[0_4px_16px_var(--accent-glow)] hover:shadow-[0_6px_24px_var(--accent-glow)] hover:-translate-y-1 active:translate-y-0',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-[15px]',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          처리 중...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

