import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { useEffect } from 'react';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-dialog flex items-end justify-center bg-navy-900/50 backdrop-blur-sm sm:items-center sm:px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          {/* Mobile: slides up as a bottom sheet, full-width, safe-area aware.
              Desktop (sm+): centered card, like before. Same content, two layouts. */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full rounded-t-xl3 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-lift sm:max-w-sm sm:rounded-xl2 sm:pb-6"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/15 sm:hidden" />
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${
                danger ? 'bg-ember-500/10 text-ember-500' : 'bg-violet-500/10 text-violet-600'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 id="confirm-dialog-title" className="font-display text-lg font-semibold text-ink">
              {title}
            </h2>
            <p id="confirm-dialog-description" className="mt-1.5 text-sm text-ink-faint">
              {description}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading} className="sm:w-auto">
                Cancel
              </Button>
              <Button
                variant={danger ? 'danger' : 'primary'}
                size="sm"
                onClick={onConfirm}
                loading={loading}
                className="sm:w-auto"
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
