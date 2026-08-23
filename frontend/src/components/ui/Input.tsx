import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-soft">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-11 w-full rounded-lg border border-ink/15 bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint',
            'focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20',
            error && 'border-ember-500 focus:border-ember-500 focus:ring-ember-500/20',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-ember-500">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
