import { motion } from 'framer-motion';
import { Presentation as PresentationIcon, Star, Sparkles, type LucideIcon } from 'lucide-react';
import { User } from '@/types';

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
  delay,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
  accent: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass rounded-xl2 p-4 shadow-card"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold text-ink">{value}</p>
          <p className="truncate text-xs text-ink-faint">{label}</p>
        </div>
      </div>
      {sublabel && <p className="mt-2 text-xs text-ink-faint">{sublabel}</p>}
    </motion.div>
  );
}

export function DashboardStats({
  totalPresentations,
  favoritesCount,
  user,
}: {
  totalPresentations: number;
  favoritesCount: number;
  user: User | null;
}) {
  const used = user?.subscription.presentationsGenerated ?? 0;
  const limit = user?.subscription.presentationsLimit ?? 0;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        icon={PresentationIcon}
        label="Total presentations"
        value={String(totalPresentations)}
        accent="bg-violet-500/10 text-violet-600"
        delay={0}
      />
      <StatCard
        icon={Star}
        label="Favorites"
        value={String(favoritesCount)}
        accent="bg-citrine-400/15 text-citrine-600"
        delay={0.05}
      />
      <StatCard
        icon={Sparkles}
        label={`${user?.subscription.plan ?? 'free'} plan usage`}
        value={`${used}/${limit}`}
        sublabel={`${pct}% of your generation limit used`}
        accent="bg-cyan-500/10 text-cyan-600"
        delay={0.1}
      />
    </div>
  );
}
