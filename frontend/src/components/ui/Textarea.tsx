import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-soft">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-ink/15 bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint',
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
Textarea.displayName = 'Textarea';
