import React from 'react';
import { cn } from '@/lib/utils';
import { Button as ShadcnButton, buttonVariants } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const mapVariant = () => {
    switch (variant) {
      case 'primary':
        return 'default';
      case 'danger':
        return 'destructive';
      case 'secondary':
        return 'secondary';
      case 'outline':
        return 'outline';
      case 'ghost':
        return 'ghost';
      case 'success':
        return 'default';
      default:
        return 'default';
    }
  };

  const mapSize = () => {
    switch (size) {
      case 'sm':
        return 'sm';
      case 'lg':
        return 'lg';
      case 'md':
      default:
        return 'default';
    }
  };

  const customVariantClass = variant === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : '';

  return (
    <ShadcnButton
      variant={mapVariant()}
      size={mapSize()}
      className={cn('gap-2 font-medium tracking-normal', customVariantClass, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </ShadcnButton>
  );
};
