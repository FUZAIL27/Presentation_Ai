import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, FileText, Presentation as PresentationIcon, Trash2 } from 'lucide-react';
import * as presentationsApi from '@/api/presentations';
import { SlideSidebar } from '@/components/editor/SlideSidebar';
import { SlideEditorPanel } from '@/components/editor/SlideEditorPanel';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/api/client';
import { Input } from '@/components/ui/Input';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [exporting, setExporting] = useState<'pptx' | 'pdf' | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: presentation, isLoading } = useQuery({
    queryKey: ['presentation', id],
    queryFn: () => presentationsApi.getPresentation(id!),
    enabled: !!id,
  });

  const activeSlide =
    presentation?.slides.find((s) => s._id === activeSlideId) ?? presentation?.slides[0] ?? null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['presentation', id] });

  const updateMetaMutation = useMutation({
    mutationFn: (title: string) => presentationsApi.updatePresentationMeta(id!, { title }),
    onSuccess: invalidate,
  });

  const updateSlideMutation = useMutation({
    mutationFn: (payload: {
      title?: string;
      subtitle?: string;
      bullets?: string[];
      bodyText?: string;
      speakerNotes?: string;
    }) => presentationsApi.updateSlide(id!, activeSlide!._id, payload),
    onSuccess: () => {
      invalidate();
      toast('success', 'Slide saved');
    },
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => presentationsApi.regenerateSlide(id!, activeSlide!._id),
    onSuccess: () => {
      invalidate();
      toast('success', 'Slide regenerated');
    },
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  const rewriteMutation = useMutation({
    mutationFn: ({ field, instruction }: { field: 'bodyText' | 'bullets' | 'speakerNotes'; instruction: string }) =>
      presentationsApi.rewriteSlide(id!, activeSlide!._id, field, instruction),
    onSuccess: () => {
      invalidate();
      toast('success', 'Rewritten with AI');
    },
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  const reorderMutation = useMutation({
    mutationFn: (order: string[]) => presentationsApi.reorderSlides(id!, order),
    onSuccess: invalidate,
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  const addSlideMutation = useMutation({
    mutationFn: () =>
      presentationsApi.addSlide(id!, {
        layout: 'bullets',
        title: 'New slide',
        afterOrder: presentation?.slides.length ?? 0,
      }),
    onSuccess: (updated) => {
      invalidate();
      const newSlide = updated.slides[updated.slides.length - 1];
      if (newSlide) setActiveSlideId(newSlide._id);
    },
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  const duplicateSlideMutation = useMutation({
    mutationFn: (slideId: string) => presentationsApi.duplicateSlide(id!, slideId),
    onSuccess: invalidate,
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  const deleteSlideMutation = useMutation({
    mutationFn: (slideId: string) => presentationsApi.deleteSlide(id!, slideId),
    onSuccess: () => {
      invalidate();
      setActiveSlideId(null);
    },
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  const deletePresentationMutation = useMutation({
    mutationFn: () => presentationsApi.deletePresentation(id!),
    onSuccess: () => {
      toast('success', 'Presentation deleted');
      queryClient.invalidateQueries({ queryKey: ['presentations'] });
      navigate('/dashboard');
    },
    onError: (err) => {
      toast('error', getErrorMessage(err));
      setDeleteConfirmOpen(false);
    },
  });

  if (isLoading || !presentation) return <PageSpinner label="Loading presentation…" />;

  async function handleExport(format: 'pptx' | 'pdf') {
    setExporting(format);
    try {
      if (format === 'pptx') await presentationsApi.exportPptx(presentation!._id, presentation!.title);
      else await presentationsApi.exportPdf(presentation!._id, presentation!.title);
      toast('success', `Exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast('error', getErrorMessage(err));
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-paper">
      <header className="glass flex h-14 shrink-0 items-center justify-between gap-2 px-3 sm:h-16 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-paper-dim"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Link
            to="/dashboard"
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-brand text-white shadow-glow sm:flex"
          >
            <PresentationIcon className="h-4 w-4" />
          </Link>
          {editingTitle ? (
            <Input
              autoFocus
              defaultValue={presentation.title}
              className="h-9 w-full max-w-[240px] sm:max-w-xs"
              onBlur={(e) => {
                setEditingTitle(false);
                if (e.target.value && e.target.value !== presentation.title) {
                  updateMetaMutation.mutate(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="min-w-0 truncate text-left font-display text-sm font-semibold text-ink hover:text-violet-600 sm:text-base"
            >
              {presentation.title}
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={exporting === 'pdf'}
            onClick={() => handleExport('pdf')}
            className="!px-2.5 sm:!px-3"
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button
            size="sm"
            loading={exporting === 'pptx'}
            onClick={() => handleExport('pptx')}
            className="!px-2.5 sm:!px-3"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export PPTX</span>
            <span className="sm:hidden">PPTX</span>
          </Button>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            aria-label="Delete presentation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ember-500 transition hover:bg-ember-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <SlideSidebar
          slides={presentation.slides}
          activeSlideId={activeSlide?._id ?? null}
          onSelect={setActiveSlideId}
          onReorder={(order) => reorderMutation.mutate(order)}
          onDuplicate={(slideId) => duplicateSlideMutation.mutate(slideId)}
          onDelete={(slideId) => {
            if (presentation.slides.length <= 1) {
              toast('error', 'A presentation needs at least one slide');
              return;
            }
            deleteSlideMutation.mutate(slideId);
          }}
          onAddSlide={() => addSlideMutation.mutate()}
        />

        <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-10">
          {activeSlide && (
            <SlideEditorPanel
              key={activeSlide._id}
              slide={activeSlide}
              onSave={async (payload) => {
                await updateSlideMutation.mutateAsync(payload);
              }}
              onRegenerate={async () => {
                await regenerateMutation.mutateAsync();
              }}
              onRewrite={async (field, instruction) => {
                await rewriteMutation.mutateAsync({ field, instruction });
              }}
              isRegenerating={regenerateMutation.isPending}
              isRewriting={rewriteMutation.isPending}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete this presentation?"
        description={`"${presentation.title}" contains ${presentation.slides.length} slide${
          presentation.slides.length === 1 ? '' : 's'
        }. This can't be undone once confirmed.`}
        confirmLabel="Delete presentation"
        loading={deletePresentationMutation.isPending}
        onConfirm={() => deletePresentationMutation.mutate()}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
