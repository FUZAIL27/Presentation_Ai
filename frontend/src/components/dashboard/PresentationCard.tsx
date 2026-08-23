import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  MoreHorizontal,
  Copy,
  Trash2,
  Download,
  Pencil,
  Eye,
  Loader2,
  FileText,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Presentation } from '@/types';
import { cn } from '@/lib/utils';

const THEME_GRADIENTS: Record<string, string> = {
  midnight: 'from-[#0F172A] to-[#1E293B]',
  aurora: 'from-[#EEF1FC] to-[#DCE3F9]',
  emerald: 'from-[#052E27] to-[#0B4A3F]',
  sunset: 'from-[#1F0A1E] to-[#3B0F35]',
  monochrome: 'from-[#0A0A0A] to-[#1A1A1A]',
};

interface PresentationCardProps {
  presentation: Presentation;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  onExportPptx: () => void;
  onExportPdf: () => void;
}

export function PresentationCard({
  presentation,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  onRename,
  onExportPptx,
  onExportPdf,
}: PresentationCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(presentation.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu();
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);

  function commitRename() {
    setRenaming(false);
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== presentation.title) onRename(trimmed);
    else setTitleDraft(presentation.title);
  }

  const gradient = THEME_GRADIENTS[presentation.theme] ?? THEME_GRADIENTS.midnight;
  const isGenerating = presentation.status === 'generating';
  const editorPath = `/editor/${presentation._id}`;
  const updatedLabel = new Date(presentation.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="group relative z-card flex flex-col rounded-xl2 border border-ink/10 bg-surface shadow-card transition-shadow hover:shadow-lift"
    >
      {/* overflow-hidden lives ONLY on the thumbnail wrapper (rounded-t only), never on the
          card root, so the dropdown menu below is never clipped by this container. */}
      <Link
        to={isGenerating ? '#' : editorPath}
        onClick={(e) => isGenerating && e.preventDefault()}
        className="relative block overflow-hidden rounded-t-xl2"
      >
        <div
          className={cn(
            'relative flex h-32 flex-col justify-between bg-gradient-to-br p-3.5 transition-transform duration-300 group-hover:scale-[1.03] sm:h-36 sm:p-4',
            gradient,
          )}
        >
          <div className="flex items-center justify-between">
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-black/25 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-white/85">
              {isGenerating && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
              {isGenerating ? 'Generating…' : presentation.style}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite();
              }}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full bg-black/25 transition hover:bg-black/40',
                presentation.isFavorite ? 'text-citrine-400' : 'text-white/70',
              )}
              aria-label={presentation.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={cn('h-3.5 w-3.5', presentation.isFavorite && 'fill-citrine-400')} />
            </button>
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-white line-clamp-2">{presentation.title}</p>
          </div>
        </div>
        {!isGenerating && (
          <span className="glass absolute bottom-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-white shadow-glass">
            <Eye className="h-3 w-3" /> View
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 px-3.5 py-3 sm:px-4">
        <div>
          {renaming ? (
            <input
              ref={renameInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') {
                  setTitleDraft(presentation.title);
                  setRenaming(false);
                }
              }}
              className="w-full rounded border border-violet-500 bg-surface px-1.5 py-0.5 text-sm text-ink outline-none"
              aria-label="Presentation title"
            />
          ) : (
            <p className="truncate text-sm font-medium text-ink" title={presentation.topic}>
              {presentation.topic}
            </p>
          )}
          <p className="mt-0.5 text-xs text-ink-faint">
            {presentation.slides.length} slides · Updated {updatedLabel}
          </p>
        </div>

        {/* Primary actions — View / Edit / Delete are always visible with labels at every screen
            size, never hover-only, so they work on touch devices. Duplicate/Rename/Download/
            Favorite live in the menu, keeping this row to 3 buttons wide enough to stay legible
            on a 320px phone without collapsing to unlabeled icons. */}
        <div className="mt-auto flex items-center gap-1.5 border-t border-ink/10 pt-3">
          <button
            onClick={() => navigate(editorPath)}
            disabled={isGenerating}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-ink-soft transition hover:bg-paper-dim disabled:opacity-40"
            aria-label="View presentation"
          >
            <Eye className="h-4 w-4 shrink-0" />
            <span>View</span>
          </button>
          <button
            onClick={() => navigate(editorPath)}
            disabled={isGenerating}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-ink-soft transition hover:bg-paper-dim disabled:opacity-40"
            aria-label="Edit presentation"
          >
            <Pencil className="h-4 w-4 shrink-0" />
            <span>Edit</span>
          </button>
          <button
            onClick={onDelete}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-ember-500 transition hover:bg-ember-500/10"
            aria-label="Delete presentation"
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            <span>Delete</span>
          </button>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              ref={menuButtonRef}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-ink-faint transition hover:bg-paper-dim"
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                aria-label="Presentation actions"
                className="glass-strong absolute bottom-11 right-0 z-dropdown w-48 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg py-1 shadow-lift"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    navigate(editorPath);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper-dim"
                >
                  <Eye className="h-3.5 w-3.5" /> View presentation
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    setRenaming(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper-dim"
                >
                  <Pencil className="h-3.5 w-3.5" /> Rename
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    onDuplicate();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper-dim"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    onExportPptx();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper-dim"
                >
                  <Download className="h-3.5 w-3.5" /> Download PPTX
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    onExportPdf();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper-dim"
                >
                  <FileText className="h-3.5 w-3.5" /> Download PDF
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    onToggleFavorite();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper-dim"
                >
                  <Star className={cn('h-3.5 w-3.5', presentation.isFavorite && 'fill-citrine-500 text-citrine-500')} />
                  {presentation.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                </button>
                <div className="my-1 border-t border-ink/10" />
                <button
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ember-500 hover:bg-ember-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete presentation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
