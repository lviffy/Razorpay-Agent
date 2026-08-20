import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm',
        brand:
          'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-sm',
        danger:
          'border-transparent bg-red-500/10 text-red-600 hover:bg-red-500/20',
        outline: 'text-foreground hover:bg-accent/50',
        success:
          'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
        warning:
          'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
        info:
          'border-transparent bg-blue-500/10 text-blue-600 hover:bg-blue-500/20',
        glass:
          'border-white/10 bg-white/5 text-gray-300 backdrop-blur-md hover:bg-white/10 hover:border-white/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
