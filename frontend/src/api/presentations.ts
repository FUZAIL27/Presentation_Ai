import { api } from './client';
import { GenerateFormValues, Pagination, Presentation, SlideLayout } from '@/types';

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  folder?: string;
  favorite?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export async function generatePresentation(payload: GenerateFormValues): Promise<Presentation> {
  const res = await api.post<{ data: { presentation: Presentation } }>('/presentations/generate', payload);
  return res.data.data.presentation;
}

export async function listPresentations(
  params: ListParams,
): Promise<{ presentations: Presentation[]; pagination: Pagination }> {
  const res = await api.get<{ data: { presentations: Presentation[]; pagination: Pagination } }>(
    '/presentations',
    { params },
  );
  return res.data.data;
}

export async function getPresentation(id: string): Promise<Presentation> {
  const res = await api.get<{ data: { presentation: Presentation } }>(`/presentations/${id}`);
  return res.data.data.presentation;
}

export async function updatePresentationMeta(
  id: string,
  payload: Partial<Pick<Presentation, 'title' | 'folder' | 'tags' | 'isFavorite'>>,
): Promise<Presentation> {
  const res = await api.patch<{ data: { presentation: Presentation } }>(`/presentations/${id}`, payload);
  return res.data.data.presentation;
}

export async function deletePresentation(id: string): Promise<void> {
  await api.delete(`/presentations/${id}`);
}

export async function duplicatePresentation(id: string): Promise<Presentation> {
  const res = await api.post<{ data: { presentation: Presentation } }>(`/presentations/${id}/duplicate`);
  return res.data.data.presentation;
}

export async function reorderSlides(id: string, order: string[]): Promise<Presentation> {
  const res = await api.post<{ data: { presentation: Presentation } }>(`/presentations/${id}/reorder`, {
    order,
  });
  return res.data.data.presentation;
}

export async function addSlide(
  id: string,
  payload: { layout: SlideLayout; title: string; afterOrder?: number },
): Promise<Presentation> {
  const res = await api.post<{ data: { presentation: Presentation } }>(`/presentations/${id}/slides`, payload);
  return res.data.data.presentation;
}

export async function updateSlide(
  presentationId: string,
  slideId: string,
  payload: {
    title?: string;
    subtitle?: string;
    bullets?: string[];
    bodyText?: string;
    speakerNotes?: string;
    imageUrl?: string;
  },
): Promise<Presentation> {
  const res = await api.patch<{ data: { presentation: Presentation } }>(
    `/presentations/${presentationId}/slides/${slideId}`,
    payload,
  );
  return res.data.data.presentation;
}

export async function deleteSlide(presentationId: string, slideId: string): Promise<Presentation> {
  const res = await api.delete<{ data: { presentation: Presentation } }>(
    `/presentations/${presentationId}/slides/${slideId}`,
  );
  return res.data.data.presentation;
}

export async function duplicateSlide(presentationId: string, slideId: string): Promise<Presentation> {
  const res = await api.post<{ data: { presentation: Presentation } }>(
    `/presentations/${presentationId}/slides/${slideId}/duplicate`,
  );
  return res.data.data.presentation;
}

export async function regenerateSlide(presentationId: string, slideId: string): Promise<Presentation> {
  const res = await api.post<{ data: { presentation: Presentation } }>(
    `/presentations/${presentationId}/slides/${slideId}/regenerate`,
  );
  return res.data.data.presentation;
}

export async function rewriteSlide(
  presentationId: string,
  slideId: string,
  field: 'bodyText' | 'bullets' | 'speakerNotes',
  instruction: string,
): Promise<Presentation> {
  const res = await api.post<{ data: { presentation: Presentation } }>(
    `/presentations/${presentationId}/slides/${slideId}/rewrite?field=${field}`,
    { instruction },
  );
  return res.data.data.presentation;
}

async function downloadBlob(url: string, filename: string): Promise<void> {
  const res = await api.get(url, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function exportPptx(id: string, title: string): Promise<void> {
  await downloadBlob(`/export/${id}/pptx`, `${title || 'presentation'}.pptx`);
}

export async function exportPdf(id: string, title: string): Promise<void> {
  await downloadBlob(`/export/${id}/pdf`, `${title || 'presentation'}.pdf`);
}
