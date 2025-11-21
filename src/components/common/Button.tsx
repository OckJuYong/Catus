import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

function Button({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  style,
  children,
  ...props
}: ButtonProps) {
  // 기본 스타일
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 border-0 cursor-pointer';

  // variant 스타일
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-[#5F6F52] text-white hover:opacity-90 active:scale-95',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95',
    outline: 'bg-transparent border-2 border-[#5F6F52] text-[#5F6F52] hover:bg-[#5F6F52] hover:text-white active:scale-95'
  };

  // size 스타일
  const sizeStyles: Record<ButtonSize, string> = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  // fullWidth 스타일
  const widthStyle = fullWidth ? 'w-full' : '';

  // disabled/loading 스타일
  const disabledStyle = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : '';

  const buttonClass = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    widthStyle,
    disabledStyle,
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  return (
    <button
      className={buttonClass}
      onClick={handleClick}
      disabled={disabled || loading}
      style={style}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
