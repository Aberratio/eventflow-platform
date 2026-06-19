import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const primaryButtonClasses =
  'bg-[linear-gradient(135deg,hsl(var(--color-brand-navy-dark)),hsl(var(--color-brand-navy-light)))] text-white border border-white/[0.12] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_20px_rgba(38,116,217,0.18)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_6px_28px_rgba(38,116,217,0.32)] hover:brightness-110 active:brightness-90 active:scale-[0.98]';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-brand-navy-light))] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: primaryButtonClasses,
        primary: primaryButtonClasses,
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98]',
        outline:
          'border border-[color:var(--glass-border)] bg-[var(--glass-bg)] text-foreground hover:border-[color:var(--glass-border-strong)] hover:bg-[var(--glass-bg-hover)] active:scale-[0.98] backdrop-blur-sm',
        secondary:
          'bg-[#1A1D22] text-[#E7E9ED] border border-white/[0.08] font-medium hover:bg-[#23272E] hover:border-white/[0.12] hover:text-white active:bg-[#15171B] active:border-white/[0.06] active:scale-[0.98] disabled:bg-[#13161A] disabled:border-white/[0.05] disabled:text-[#707780]',
        ghost: 'text-muted-foreground hover:bg-[var(--glass-bg-hover)] hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-xl px-7 text-sm',
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
