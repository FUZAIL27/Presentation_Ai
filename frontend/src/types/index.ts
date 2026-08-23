export type SlideLayout =
  | 'title'
  | 'agenda'
  | 'content'
  | 'bullets'
  | 'twoColumn'
  | 'image'
  | 'quote'
  | 'chart'
  | 'timeline'
  | 'swot'
  | 'comparison'
  | 'conclusion'
  | 'thankYou';

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  labels: string[];
  datasets: { label: string; data: number[] }[];
}

export interface Slide {
  _id: string;
  order: number;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  bullets?: string[];
  bodyText?: string;
  speakerNotes?: string;
  imageQuery?: string;
  imageUrl?: string;
  chart?: ChartData;
  timelineItems?: { label: string; description: string }[];
  swot?: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  comparison?: { headers: string[]; rows: string[][] };
  columns?: { heading: string; text: string }[];
}

export interface Presentation {
  _id: string;
  owner: string;
  title: string;
  topic: string;
  audience: string;
  language: string;
  style: string;
  theme: string;
  tone: string;
  purpose: string;
  numSlides: number;
  slides: Slide[];
  status: 'generating' | 'ready' | 'failed';
  aiProvider: string;
  isFavorite: boolean;
  folder?: string;
  tags: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  subscription: {
    plan: 'free' | 'pro' | 'business';
    presentationsGenerated: number;
    presentationsLimit: number;
  };
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GenerateFormValues {
  topic: string;
  audience: string;
  language: string;
  style: 'Professional' | 'Creative' | 'Minimalist' | 'Academic' | 'Startup' | 'Corporate';
  numSlides: number;
  theme: string;
  purpose: 'Inform' | 'Persuade' | 'Pitch' | 'Educate' | 'Report' | 'Sell';
  tone: 'Professional' | 'Creative' | 'Technical' | 'Business' | 'Casual' | 'Formal';
  includeImages: boolean;
  includeCharts: boolean;
}
