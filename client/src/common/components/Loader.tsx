import React from 'react';

interface LoaderProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const Loader = ({ className = "", size = "medium" }: LoaderProps) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-4',
    large: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`}></div>
    </div>
  );
};

export default Loader;
