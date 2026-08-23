import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, LayoutTemplate, ImageIcon, BarChart3, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const CARD_ROTATIONS = [-9, -3, 4, 10];
const CARD_LABELS = ['Title', 'Market opportunity', 'Roadmap', 'Thank you'];

const FLOATING_ICONS = [
  { Icon: LayoutTemplate, className: 'left-[6%] top-[18%]', delay: 0 },
  { Icon: ImageIcon, className: 'right-[8%] top-[10%]', delay: 1.2 },
  { Icon: BarChart3, className: 'left-[10%] bottom-[16%]', delay: 2.1 },
  { Icon: Wand2, className: 'right-[4%] bottom-[22%]', delay: 0.6 },
];

export function Hero() {
  return (
    <section className="app-mesh-bg relative overflow-hidden px-4 pb-24 pt-20 sm:pt-28">
      <div className="pointer-events-none absolute -left-32 top-0 -z-10 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl animate-glow-pulse" />
      <div
        className="pointer-events-none absolute -right-32 top-40 -z-10 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl animate-glow-pulse"
        style={{ animationDelay: '1.5s' }}
      />

      {FLOATING_ICONS.map(({ Icon, className, delay }, i) => (
        <motion.div
          key={i}
          className={`pointer-events-none absolute hidden h-11 w-11 items-center justify-center rounded-xl2 lg:flex ${className} glass shadow-glass`}
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay }}
        >
          <Icon className="h-5 w-5 text-violet-500" />
        </motion.div>
      ))}

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-ink-soft"
          >
            <Sparkles className="h-3.5 w-3.5 text-citrine-600" />
            Gemini-powered generation
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-balance font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]"
          >
            Type a topic.
            <br />
            Get a deck worth{' '}
            <span className="bg-gradient-violet-cyan bg-clip-text text-transparent">presenting</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-5 max-w-md text-balance text-lg text-ink-faint"
          >
            PresentAI writes the narrative, picks the layouts, sources the visuals, and hands you an
            editable deck — export to PowerPoint or PDF whenever it's ready.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link to="/signup">
              <Button size="lg" variant="accent">
                Start generating free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline">
                See how it works
              </Button>
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-5 font-mono text-xs text-ink-faint"
          >
            No credit card · 5 free presentations
          </motion.p>
        </div>

        <div className="relative mx-auto h-[22rem] w-full max-w-md sm:h-[26rem]">
          {CARD_LABELS.map((label, i) => (
            <motion.div
              key={label}
              className="glass-strong absolute left-1/2 top-1/2 flex h-56 w-44 -translate-x-1/2 -translate-y-1/2 flex-col justify-between rounded-xl2 p-4 shadow-lift sm:h-72 sm:w-56"
              style={
                {
                  '--rot-from': `${CARD_ROTATIONS[i] * 1.6}deg`,
                  '--rot-to': `${CARD_ROTATIONS[i]}deg`,
                  transformOrigin: 'bottom center',
                  zIndex: i,
                } as React.CSSProperties
              }
              initial={{ opacity: 0, y: 24, rotate: CARD_ROTATIONS[i] * 1.6 }}
              animate={{ opacity: 1, y: 0, rotate: CARD_ROTATIONS[i] }}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -10, scale: 1.02, transition: { duration: 0.2 } }}
            >
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                {String(i + 1).padStart(2, '0')} / 04
              </span>
              <div className="space-y-2">
                <div className="h-2 w-3/4 rounded-full bg-gradient-violet-cyan opacity-60" />
                <div className="h-2 w-1/2 rounded-full bg-ink/10" />
              </div>
              <p className="font-display text-sm font-semibold text-ink">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
