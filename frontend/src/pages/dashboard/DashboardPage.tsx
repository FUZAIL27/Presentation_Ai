import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Presentation as PresentationIcon, Plus } from 'lucide-react';
import * as presentationsApi from '@/api/presentations';
import { PresentationCard } from '@/components/dashboard/PresentationCard';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState, PageSpinner } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const UNDO_WINDOW_MS = 10000;

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const favoriteOnly = searchParams.get('favorite') === 'true';
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [confirmTarget, setConfirmTarget] = useState<{ id: string; title: string; slideCount: number } | null>(
    null,
  );
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());
  const pendingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['presentations', { favoriteOnly, search: debouncedSearch }],
    queryFn: () =>
      presentationsApi.listPresentations({
        favorite: favoriteOnly || undefined,
        search: debouncedSearch || undefined,
        limit: 24,
      }),
  });

  // Lightweight count-only query so the stats row is accurate regardless of the current filter/search.
  const { data: favoritesData } = useQuery({
    queryKey: ['presentations-favorites-count'],
    queryFn: () => presentationsApi.listPresentations({ favorite: true, limit: 1 }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['presentations'] });
  const invalidateAll = () => {
    invalidate();
    queryClient.invalidateQueries({ queryKey: ['presentations-favorites-count'] });
  };

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      presentationsApi.updatePresentationMeta(id, { isFavorite }),
    onSuccess: invalidateAll,
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => presentationsApi.duplicatePresentation(id),
    onSuccess: () => {
      invalidateAll();
      toast('success', 'Presentation duplicated');
    },
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => presentationsApi.deletePresentation(id),
    onSuccess: invalidateAll,
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  function requestDelete(id: string, title: string, slideCount: number) {
    setConfirmTarget({ id, title, slideCount });
  }

  function confirmDelete() {
    if (!confirmTarget) return;
    const { id, title } = confirmTarget;
    setConfirmTarget(null);

    setPendingDeleteIds((prev) => new Set(prev).add(id));

    toast('info', `"${title}" deleted`, {
      durationMs: UNDO_WINDOW_MS + 200,
      action: {
        label: 'Undo',
        onClick: () => {
          const timer = pendingTimers.current.get(id);
          if (timer) clearTimeout(timer);
          pendingTimers.current.delete(id);
          setPendingDeleteIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
      },
    });

    const timer = setTimeout(() => {
      pendingTimers.current.delete(id);
      deleteMutation.mutate(id);
    }, UNDO_WINDOW_MS);
    pendingTimers.current.set(id, timer);
  }

  const presentations = useMemo(
    () => (data?.presentations ?? []).filter((p) => !pendingDeleteIds.has(p._id)),
    [data, pendingDeleteIds],
  );

  return (
    <div>
      <DashboardStats
        totalPresentations={data?.pagination.total ?? 0}
        favoritesCount={favoritesData?.pagination.total ?? 0}
        user={user}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {favoriteOnly ? 'Favorite decks' : 'All decks'}
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            {data?.pagination.total ?? 0} presentation{data?.pagination.total === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input
              placeholder="Search decks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => navigate('/generate')} className="shrink-0">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {isLoading && <PageSpinner label="Loading your decks…" />}

      {isError && (
        <div className="rounded-xl2 border border-ember-500/20 bg-ember-500/5 p-6 text-sm text-ember-500">
          {getErrorMessage(error)}
        </div>
      )}

      {!isLoading && !isError && presentations.length === 0 && (
        <EmptyState
          icon={PresentationIcon}
          title={favoriteOnly ? 'No favorites yet' : 'No presentations yet'}
          description={
            favoriteOnly
              ? 'Star a deck to pin it here for quick access.'
              : 'Generate your first AI-powered presentation to get started.'
          }
          action={
            !favoriteOnly && (
              <Button onClick={() => navigate('/generate')}>
                <Plus className="h-4 w-4" />
                Create a presentation
              </Button>
            )
          }
        />
      )}

      <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {presentations.map((p) => (
            <PresentationCard
              key={p._id}
              presentation={p}
              onToggleFavorite={() =>
                toggleFavoriteMutation.mutate({ id: p._id, isFavorite: !p.isFavorite })
              }
              onDuplicate={() => duplicateMutation.mutate(p._id)}
              onDelete={() => requestDelete(p._id, p.title, p.slides.length)}
              onRename={(newTitle) =>
                presentationsApi
                  .updatePresentationMeta(p._id, { title: newTitle })
                  .then(invalidate)
                  .catch((err) => toast('error', getErrorMessage(err)))
              }
              onExportPptx={async () => {
                try {
                  await presentationsApi.exportPptx(p._id, p.title);
                } catch (err) {
                  toast('error', getErrorMessage(err));
                }
              }}
              onExportPdf={async () => {
                try {
                  await presentationsApi.exportPdf(p._id, p.title);
                } catch (err) {
                  toast('error', getErrorMessage(err));
                }
              }}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete this presentation?"
        description={
          confirmTarget
            ? `"${confirmTarget.title}" contains ${confirmTarget.slideCount} slide${
                confirmTarget.slideCount === 1 ? '' : 's'
              }. You'll have ${UNDO_WINDOW_MS / 1000} seconds to undo after deleting.`
            : ''
        }
        confirmLabel="Delete presentation"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
