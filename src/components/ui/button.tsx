import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_0_0_1px_hsl(var(--primary-glow)/0.30),0_4px_16px_hsl(var(--primary)/0.25)] hover:bg-[hsl(var(--primary-glow))] active:bg-[hsl(var(--primary-dark))] active:scale-[0.98]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98]',
        outline:
          'border border-[color:var(--glass-border)] bg-[var(--glass-bg)] text-foreground hover:border-[color:var(--glass-border-strong)] hover:bg-[var(--glass-bg-hover)] active:scale-[0.98] backdrop-blur-sm',
        secondary:
          'border border-[color:var(--glass-border)] bg-[var(--glass-bg-hover)] text-foreground hover:bg-white/10 active:scale-[0.98]',
        ghost: 'text-muted-foreground hover:bg-[var(--glass-bg-hover)] hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
