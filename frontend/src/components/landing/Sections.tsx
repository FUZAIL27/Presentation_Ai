import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Wand2,
  LayoutTemplate,
  ImageIcon,
  FileDown,
  History,
  Users,
  Presentation as PresentationIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FEATURES = [
  {
    icon: Wand2,
    title: 'AI-written content',
    desc: 'Every slide — bullets, body copy, speaker notes — written to match your audience and tone.',
  },
  {
    icon: LayoutTemplate,
    title: '13 layout types',
    desc: 'Timelines, SWOT grids, comparison tables, charts — not just bullet points on repeat.',
  },
  {
    icon: ImageIcon,
    title: 'Sourced visuals',
    desc: 'Relevant stock photography selected per slide, or bring your own.',
  },
  {
    icon: History,
    title: 'Full edit history',
    desc: 'Rewrite, regenerate, or hand-edit any slide — every version is recoverable.',
  },
  {
    icon: FileDown,
    title: 'Real exports',
    desc: 'Download a genuine, editable .pptx or a print-ready .pdf — not a screenshot.',
  },
  {
    icon: Users,
    title: 'Built for teams',
    desc: 'Folders, favorites, and a shared library so decks are easy to find later.',
  },
];

const STEPS = [
  { label: 'Describe', desc: 'Give PresentAI a topic, audience, and tone — takes about 15 seconds.' },
  { label: 'Generate', desc: 'The full deck is written, structured, and illustrated in under a minute.' },
  { label: 'Refine', desc: 'Edit any slide by hand, or ask AI to rewrite, expand, or regenerate it.' },
  { label: 'Export', desc: 'Download as PowerPoint or PDF, ready to present.' },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    tagline: 'Try the full workflow',
    features: ['5 presentations', 'All slide layouts', 'PPTX & PDF export', 'Community support'],
  },
  {
    name: 'Pro',
    price: '$19',
    tagline: 'For regular use',
    highlighted: true,
    features: ['Unlimited presentations', 'Priority generation', 'Custom themes', 'Email support'],
  },
  {
    name: 'Business',
    price: '$49',
    tagline: 'For teams',
    features: ['Everything in Pro', 'Shared team library', 'Admin controls', 'Priority support'],
  },
];

const FAQS = [
  {
    q: 'Which AI model writes the content?',
    a: 'Generation runs on Gemini by default, with optional OpenAI and Claude fallback if you configure those providers — so generation keeps working even if one provider has an outage.',
  },
  {
    q: 'Can I edit the deck after it\'s generated?',
    a: 'Yes — every field on every slide is editable by hand, plus you can ask AI to rewrite, expand, shorten, or regenerate any individual slide.',
  },
  {
    q: 'What formats can I export to?',
    a: 'Both PowerPoint (.pptx, fully editable in PowerPoint, Keynote, or Google Slides) and PDF.',
  },
  {
    q: 'Is there a limit on free presentations?',
    a: 'The free plan includes 5 generated presentations. Upgrade any time for unlimited generation.',
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-ink/10 bg-surface px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Features" title="Everything a deck needs, generated at once" />
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group rounded-xl2 border border-ink/10 p-6 transition hover:border-violet-300 hover:shadow-glow"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 transition-transform duration-300 group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm text-ink-faint">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Process" title="From topic to deck in four steps" />
        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative"
            >
              <span className="font-mono text-3xl font-semibold text-ink/10">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 font-display font-semibold text-ink">{s.label}</h3>
              <p className="mt-1.5 text-sm text-ink-faint">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-ink/10 bg-surface px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading eyebrow="Pricing" title="Simple pricing, cancel anytime" />
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl2 border p-6 ${
                plan.highlighted ? 'border-violet-500 shadow-lift' : 'border-ink/10'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-6 rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-medium text-white">
                  Most popular
                </span>
              )}
              <p className="font-display font-semibold text-ink">{plan.name}</p>
              <p className="mt-1 text-sm text-ink-faint">{plan.tagline}</p>
              <p className="mt-4 font-display text-3xl font-semibold text-ink">
                {plan.price}
                <span className="text-sm font-normal text-ink-faint">/mo</span>
              </p>
              <ul className="mt-6 flex flex-col gap-2.5 text-sm text-ink-soft">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-violet-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="mt-6 block">
                <Button variant={plan.highlighted ? 'accent' : 'outline'} className="w-full">
                  Get started
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section id="faq" className="px-4 py-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-10 flex flex-col divide-y divide-ink/10 border-t border-ink/10">
          {FAQS.map((item, i) => (
            <div key={item.q}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between py-5 text-left"
              >
                <span className="font-medium text-ink">{item.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-ink-faint transition-transform ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === i && <p className="pb-5 text-sm text-ink-faint">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Cta() {
  return (
    <section className="px-4 pb-24">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-xl2 bg-gradient-navy-violet px-8 py-16 text-center shadow-glow">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh-dark opacity-60" />
        <h2 className="relative font-display text-3xl font-semibold text-white">
          Your next deck is one topic away
        </h2>
        <p className="relative mx-auto mt-3 max-w-md text-white/70">
          Free to start. No credit card. Export whenever you're happy with it.
        </p>
        <Link to="/signup" className="relative mt-8 inline-block">
          <Button size="lg" variant="accent">
            Start generating free
          </Button>
        </Link>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ink/10 px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand text-white shadow-glow">
            <PresentationIcon className="h-3.5 w-3.5" />
          </div>
          <span className="font-display font-semibold">PresentAI</span>
        </div>
        <p className="text-sm text-ink-faint">© {new Date().getFullYear()} PresentAI. All rights reserved.</p>
      </div>
    </footer>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-xl">
      <span className="font-mono text-xs uppercase tracking-widest text-violet-600">{eyebrow}</span>
      <h2 className="mt-2 text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}
