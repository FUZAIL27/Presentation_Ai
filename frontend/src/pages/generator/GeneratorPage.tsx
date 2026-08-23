import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Image as ImageIcon, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import * as presentationsApi from '@/api/presentations';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/api/client';
import { useState } from 'react';

const schema = z.object({
  topic: z.string().min(3, 'Give it at least 3 characters').max(300),
  audience: z.string().min(2).max(120),
  language: z.string().min(2).max(40),
  style: z.enum(['Professional', 'Creative', 'Minimalist', 'Academic', 'Startup', 'Corporate']),
  numSlides: z.coerce.number().int().min(3).max(30),
  theme: z.enum(['midnight', 'aurora', 'emerald', 'sunset', 'monochrome']),
  purpose: z.enum(['Inform', 'Persuade', 'Pitch', 'Educate', 'Report', 'Sell']),
  tone: z.enum(['Professional', 'Creative', 'Technical', 'Business', 'Casual', 'Formal']),
  includeImages: z.boolean(),
  includeCharts: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const THEMES: { id: FormValues['theme']; label: string; swatch: string }[] = [
  { id: 'midnight', label: 'Midnight', swatch: 'bg-[#0F172A]' },
  { id: 'aurora', label: 'Aurora', swatch: 'bg-[#EEF1FC] border border-ink/10' },
  { id: 'emerald', label: 'Emerald', swatch: 'bg-[#0B4A3F]' },
  { id: 'sunset', label: 'Sunset', swatch: 'bg-[#3B0F35]' },
  { id: 'monochrome', label: 'Monochrome', swatch: 'bg-[#0A0A0A]' },
];

export default function GeneratorPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      audience: 'General audience',
      language: 'English',
      style: 'Professional',
      numSlides: 10,
      theme: 'midnight',
      purpose: 'Inform',
      tone: 'Professional',
      includeImages: true,
      includeCharts: true,
    },
  });

  const selectedTheme = watch('theme');

  async function onSubmit(values: FormValues) {
    setGenerating(true);
    try {
      const presentation = await presentationsApi.generatePresentation(values);
      toast('success', 'Your presentation is ready!');
      navigate(`/editor/${presentation._id}`);
    } catch (err) {
      toast('error', getErrorMessage(err));
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <div className="app-mesh-bg flex h-[70vh] flex-col items-center justify-center gap-6 rounded-xl2 text-center">
        <div className="relative h-16 w-16">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="glass absolute inset-0 rounded-xl2 border-2 border-violet-500/40 shadow-glow"
              style={{ transformOrigin: 'bottom center' }}
              animate={{ rotate: [0, (i - 1) * 14, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
          <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-violet-600" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-ink">Building your deck…</p>
          <p className="mt-1 text-sm text-ink-faint">Writing content, picking layouts, sourcing visuals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-ink">New presentation</h1>
        <p className="mt-1 text-sm text-ink-faint">
          Describe what you need — PresentAI will write, structure, and design the deck.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <Input
              label="Topic"
              placeholder="e.g. Q3 product roadmap for the growth team"
              error={errors.topic?.message}
              {...register('topic')}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Audience" placeholder="Investors, students…" {...register('audience')} />
              <Input label="Language" placeholder="English" {...register('language')} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Style" {...register('style')}>
              <option>Professional</option>
              <option>Creative</option>
              <option>Minimalist</option>
              <option>Academic</option>
              <option>Startup</option>
              <option>Corporate</option>
            </Select>
            <Select label="Tone" {...register('tone')}>
              <option>Professional</option>
              <option>Creative</option>
              <option>Technical</option>
              <option>Business</option>
              <option>Casual</option>
              <option>Formal</option>
            </Select>
            <Select label="Purpose" {...register('purpose')}>
              <option>Inform</option>
              <option>Persuade</option>
              <option>Pitch</option>
              <option>Educate</option>
              <option>Report</option>
              <option>Sell</option>
            </Select>
            <Input
              label="Number of slides"
              type="number"
              min={3}
              max={30}
              error={errors.numSlides?.message}
              {...register('numSlides')}
            />
          </div>
        </Card>

        <Card className="p-6">
          <p className="mb-3 text-sm font-medium text-ink-soft">Theme</p>
          <div className="flex flex-wrap gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setValue('theme', t.id)}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-2 transition ${
                  selectedTheme === t.id ? 'border-violet-600' : 'border-transparent hover:border-ink/10'
                }`}
              >
                <span className={`h-10 w-14 rounded-md ${t.swatch}`} />
                <span className="text-xs text-ink-faint">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2.5 border-t border-ink/10 pt-5">
            <label className="flex items-center gap-2.5 text-sm text-ink-soft">
              <input type="checkbox" className="h-4 w-4 rounded border-ink/20" {...register('includeImages')} />
              <ImageIcon className="h-4 w-4" /> Include AI-selected images
            </label>
            <label className="flex items-center gap-2.5 text-sm text-ink-soft">
              <input type="checkbox" className="h-4 w-4 rounded border-ink/20" {...register('includeCharts')} />
              <BarChart3 className="h-4 w-4" /> Include charts where relevant
            </label>
          </div>
        </Card>

        <Button type="submit" size="lg" variant="accent" className="w-full">
          <Sparkles className="h-4 w-4" />
          Generate presentation
        </Button>
      </form>
    </div>
  );
}
