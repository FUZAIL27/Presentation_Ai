import { useEffect, useState } from 'react';
import { Sparkles, Wand2, Plus, X } from 'lucide-react';
import { Slide } from '@/types';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Card';

interface SlideEditorPanelProps {
  slide: Slide;
  onSave: (payload: {
    title?: string;
    subtitle?: string;
    bullets?: string[];
    bodyText?: string;
    speakerNotes?: string;
  }) => Promise<void>;
  onRegenerate: () => Promise<void>;
  onRewrite: (field: 'bodyText' | 'bullets' | 'speakerNotes', instruction: string) => Promise<void>;
  isRegenerating: boolean;
  isRewriting: boolean;
}

const REWRITE_OPTIONS = [
  { value: 'expand', label: 'Expand' },
  { value: 'shorten', label: 'Shorten' },
  { value: 'professional', label: 'Professional tone' },
  { value: 'creative', label: 'Creative tone' },
  { value: 'technical', label: 'Technical tone' },
  { value: 'grammar', label: 'Fix grammar' },
];

export function SlideEditorPanel({
  slide,
  onSave,
  onRegenerate,
  onRewrite,
  isRegenerating,
  isRewriting,
}: SlideEditorPanelProps) {
  const [title, setTitle] = useState(slide.title);
  const [subtitle, setSubtitle] = useState(slide.subtitle ?? '');
  const [bullets, setBullets] = useState<string[]>(slide.bullets ?? []);
  const [bodyText, setBodyText] = useState(slide.bodyText ?? '');
  const [speakerNotes, setSpeakerNotes] = useState(slide.speakerNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setTitle(slide.title);
    setSubtitle(slide.subtitle ?? '');
    setBullets(slide.bullets ?? []);
    setBodyText(slide.bodyText ?? '');
    setSpeakerNotes(slide.speakerNotes ?? '');
    setDirty(false);
  }, [slide]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ title, subtitle, bullets, bodyText, speakerNotes });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  const hasBullets = slide.layout === 'bullets' || slide.layout === 'agenda' || slide.layout === 'conclusion';
  const hasBody = slide.layout === 'content' || slide.layout === 'image' || slide.layout === 'quote';

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-paper-dim px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          {slide.layout}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRegenerate} loading={isRegenerating}>
            <Sparkles className="h-3.5 w-3.5" /> Regenerate
          </Button>
          {dirty && (
            <Button size="sm" onClick={handleSave} loading={saving}>
              Save changes
            </Button>
          )}
        </div>
      </div>

      <div>
        <Input
          label="Slide title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
        />
      </div>

      {slide.layout === 'title' || slide.layout === 'thankYou' ? (
        <Input
          label="Subtitle"
          value={subtitle}
          onChange={(e) => {
            setSubtitle(e.target.value);
            setDirty(true);
          }}
        />
      ) : null}

      {hasBullets && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-ink-soft">Bullet points</label>
            <RewriteMenu
              onSelect={(instruction) => onRewrite('bullets', instruction)}
              loading={isRewriting}
            />
          </div>
          <div className="flex flex-col gap-2">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={b}
                  onChange={(e) => {
                    const next = [...bullets];
                    next[i] = e.target.value;
                    setBullets(next);
                    setDirty(true);
                  }}
                />
                <button
                  onClick={() => {
                    setBullets(bullets.filter((_, idx) => idx !== i));
                    setDirty(true);
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-ember-500/10 hover:text-ember-500"
                  aria-label="Remove bullet"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                setBullets([...bullets, 'New point']);
                setDirty(true);
              }}
              className="flex items-center gap-1.5 self-start text-xs font-medium text-violet-600 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add bullet
            </button>
          </div>
        </div>
      )}

      {hasBody && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-ink-soft">Body text</label>
            <RewriteMenu
              onSelect={(instruction) => onRewrite('bodyText', instruction)}
              loading={isRewriting}
            />
          </div>
          <Textarea
            rows={5}
            value={bodyText}
            onChange={(e) => {
              setBodyText(e.target.value);
              setDirty(true);
            }}
          />
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-sm font-medium text-ink-soft">Speaker notes</label>
          <RewriteMenu
            onSelect={(instruction) => onRewrite('speakerNotes', instruction)}
            loading={isRewriting}
          />
        </div>
        <Textarea
          rows={3}
          value={speakerNotes}
          onChange={(e) => {
            setSpeakerNotes(e.target.value);
            setDirty(true);
          }}
        />
      </div>

      {slide.imageUrl && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-soft">Slide image</p>
          <img src={slide.imageUrl} alt="" className="h-40 w-full rounded-lg object-cover" />
        </div>
      )}
    </div>
  );
}

function RewriteMenu({ onSelect, loading }: { onSelect: (instruction: string) => void; loading: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-500/10 disabled:opacity-50"
      >
        {loading ? <Spinner className="h-3 w-3" /> : <Wand2 className="h-3 w-3" />}
        AI rewrite
      </button>
      {open && (
        <div className="glass-strong absolute right-0 top-7 z-dropdown w-44 overflow-hidden rounded-lg py-1 shadow-lift">
          {REWRITE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setOpen(false);
                onSelect(opt.value);
              }}
              className="block w-full px-3 py-1.5 text-left text-xs text-ink-soft hover:bg-paper-dim"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
