import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
  { value: 'system' as const, icon: Monitor, label: 'System' },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();

  return (
    <div className={cn('flex items-center gap-0.5 rounded-lg bg-paper-dim p-0.5', className)}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setMode(opt.value)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition',
            mode === opt.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-faint hover:text-ink',
          )}
          aria-label={`${opt.label} theme`}
          title={`${opt.label} theme`}
        >
          <opt.icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
