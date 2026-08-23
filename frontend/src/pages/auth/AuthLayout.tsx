import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Presentation as PresentationIcon } from 'lucide-react';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="app-mesh-bg relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand text-white shadow-glow">
            <PresentationIcon className="h-4.5 w-4.5" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">PresentAI</span>
        </Link>

        <div className="glass-strong rounded-xl2 p-6 shadow-glass sm:p-8">
          <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-faint">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && <p className="mt-6 text-center text-sm text-ink-faint">{footer}</p>}
      </motion.div>
    </div>
  );
}
