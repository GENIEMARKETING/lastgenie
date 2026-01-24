import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-primary text-white hover:bg-primary/90',
      secondary: 'bg-secondary text-white hover:bg-secondary/90',
      destructive: 'bg-error text-white hover:bg-error/90',
      outline: 'border border-border-default bg-transparent text-text-primary hover:bg-background',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-colors',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';