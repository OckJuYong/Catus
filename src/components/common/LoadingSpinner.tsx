import type { CSSProperties } from 'react';

type SpinnerSize = 'small' | 'medium' | 'large';

interface SpinnerSizeStyle {
  width: string;
  height: string;
  borderWidth: string;
}

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: string;
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

function LoadingSpinner({
  size = 'medium',
  color = '#5F6F52',
  text,
  fullScreen = false,
  className = ''
}: LoadingSpinnerProps) {
  // 크기에 따른 스피너 크기
  const sizeMap: Record<SpinnerSize, SpinnerSizeStyle> = {
    small: { width: '24px', height: '24px', borderWidth: '2px' },
    medium: { width: '40px', height: '40px', borderWidth: '3px' },
    large: { width: '60px', height: '60px', borderWidth: '4px' }
  };

  const spinnerSize = sizeMap[size] || sizeMap.medium;

  const containerStyle: CSSProperties = fullScreen ? {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#fef9f1',
    zIndex: 1000,
    gap: '16px'
  } : {
    gap: '16px'
  };

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      style={containerStyle}
    >
      <style>{`
        @keyframes spinner-rotate {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div
        style={{
          width: spinnerSize.width,
          height: spinnerSize.height,
          border: `${spinnerSize.borderWidth} solid rgba(0, 0, 0, 0.1)`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spinner-rotate 0.8s linear infinite'
        }}
      ></div>
      {text && (
        <p
          className="text-[#333]"
          style={{
            fontSize: '13px',
            opacity: 0.7,
            margin: 0
          }}
        >
          {text}
        </p>
      )}
    </div>
  );
}

export default LoadingSpinner;
