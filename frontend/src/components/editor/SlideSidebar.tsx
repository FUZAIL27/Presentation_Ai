import { useState } from 'react';
import { Reorder } from 'framer-motion';
import { GripVertical, Copy, Trash2, Plus } from 'lucide-react';
import { Slide } from '@/types';
import { cn } from '@/lib/utils';

const LAYOUT_LABELS: Record<string, string> = {
  title: 'Title',
  agenda: 'Agenda',
  bullets: 'Bullets',
  content: 'Content',
  twoColumn: 'Two column',
  image: 'Image',
  quote: 'Quote',
  chart: 'Chart',
  timeline: 'Timeline',
  swot: 'SWOT',
  comparison: 'Comparison',
  conclusion: 'Conclusion',
  thankYou: 'Thank you',
};

export function SlideSidebar({
  slides,
  activeSlideId,
  onSelect,
  onReorder,
  onDuplicate,
  onDelete,
  onAddSlide,
}: {
  slides: Slide[];
  activeSlideId: string | null;
  onSelect: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSlide: () => void;
}) {
  const [items, setItems] = useState(slides);

  if (items.length !== slides.length || items.some((s, i) => s._id !== slides[i]?._id)) {
    setItems(slides);
  }

  function handleReorder(newOrder: Slide[]) {
    setItems(newOrder);
    onReorder(newOrder.map((s) => s._id));
  }

  return (
    // Mobile (<md): horizontal scrolling strip along the top, since a full-height side column
    // has no room to exist on a narrow phone. Desktop (md+): the original vertical sidebar.
    <div className="glass flex w-full shrink-0 flex-col md:h-full md:w-64">
      <div className="scrollbar-thin flex-1 overflow-x-auto overflow-y-hidden p-3 md:overflow-x-hidden md:overflow-y-auto">
        <Reorder.Group
          axis="x"
          values={items}
          onReorder={handleReorder}
          className="flex flex-row gap-2 md:flex-col"
        >
          {items.map((slide, index) => (
            <Reorder.Item
              key={slide._id}
              value={slide}
              className="group relative w-40 shrink-0 list-none md:w-auto"
            >
              <button
                onClick={() => onSelect(slide._id)}
                className={cn(
                  'flex w-full items-start gap-2 rounded-lg border p-2.5 text-left transition',
                  activeSlideId === slide._id
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-ink/10 bg-surface hover:border-ink/20',
                )}
              >
                <GripVertical className="mt-0.5 hidden h-3.5 w-3.5 shrink-0 cursor-grab text-ink-faint md:block" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-ink-faint">{String(index + 1).padStart(2, '0')}</span>
                    <span className="rounded bg-paper-dim px-1.5 py-0.5 font-mono text-[9px] uppercase text-ink-faint">
                      {LAYOUT_LABELS[slide.layout] ?? slide.layout}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs font-medium text-ink">{slide.title || 'Untitled'}</p>
                </div>
              </button>
              {/* Always visible, not hover-only - hover doesn't exist on touch devices.
                  Positioned bottom-right so it doesn't collide with the layout badge up top. */}
              <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(slide._id);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded bg-surface/90 text-ink-faint hover:text-ink"
                  aria-label="Duplicate slide"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(slide._id);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded bg-surface/90 text-ember-500 hover:text-ember-600"
                  aria-label="Delete slide"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      <div className="border-t border-ink/10 p-3">
        <button
          onClick={onAddSlide}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ink/20 text-sm font-medium text-ink-soft transition hover:border-violet-400 hover:text-violet-600"
        >
          <Plus className="h-4 w-4" /> Add slide
        </button>
      </div>
    </div>
  );
}
