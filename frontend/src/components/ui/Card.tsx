import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, type LucideIcon } from 'lucide-react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl2 border border-ink/10 bg-surface shadow-card transition-shadow hover:shadow-lift',
        className,
      )}
      {...props}
    />
  );
}

export function GradientCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-xl2 bg-gradient-violet-cyan p-[1.5px] shadow-glow', className)}>
      <div className="h-full w-full rounded-[calc(theme(borderRadius.xl2)-1.5px)] bg-surface" {...props} />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-violet-600', className)} />;
}

export function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-ink-faint">
      <Spinner className="h-8 w-8" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-ink/15 bg-surface/50 px-8 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-faint">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
