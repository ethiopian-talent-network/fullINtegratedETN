import React from 'react';
import { Badge } from './badge';
import { CheckCircle } from 'lucide-react';

interface VerifiedBadgeProps {
  verified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  verified = false,
  size = 'sm',
  showText = true,
  className = ''
}) => {
  if (!verified) return null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <Badge 
      variant="secondary" 
      className={`
        bg-blue-100 text-blue-800 border-blue-200 
        hover:bg-blue-200 transition-colors
        inline-flex items-center gap-1
        ${sizeClasses[size]} 
        ${className}
      `}
    >
      <CheckCircle size={iconSizes[size]} className="text-blue-600" />
      {showText && <span>Verified</span>}
    </Badge>
  );
};

export default VerifiedBadge;