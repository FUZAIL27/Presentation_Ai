import { Schema, model, Document, Types } from 'mongoose';

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

export interface IChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  labels: string[];
  datasets: { label: string; data: number[] }[];
}

export interface ISlide {
  _id?: Types.ObjectId;
  order: number;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  bullets?: string[];
  bodyText?: string;
  speakerNotes?: string;
  imageQuery?: string;
  imageUrl?: string;
  chart?: IChartData;
  timelineItems?: { label: string; description: string }[];
  swot?: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  comparison?: { headers: string[]; rows: string[][] };
  columns?: { heading: string; text: string }[];
  toObject?: () => Record<string, unknown>;
}

const slideSchema = new Schema<ISlide>(
  {
    order: { type: Number, required: true },
    layout: {
      type: String,
      enum: [
        'title',
        'agenda',
        'content',
        'bullets',
        'twoColumn',
        'image',
        'quote',
        'chart',
        'timeline',
        'swot',
        'comparison',
        'conclusion',
        'thankYou',
      ],
      required: true,
    },
    title: { type: String, required: true },
    subtitle: String,
    bullets: [String],
    bodyText: String,
    speakerNotes: String,
    imageQuery: String,
    imageUrl: String,
    chart: {
      type: { type: String, enum: ['bar', 'line', 'pie', 'doughnut'] },
      labels: [String],
      datasets: [{ label: String, data: [Number] }],
    },
    timelineItems: [{ label: String, description: String }],
    swot: {
      strengths: [String],
      weaknesses: [String],
      opportunities: [String],
      threats: [String],
    },
    comparison: {
      headers: [String],
      rows: [[String]],
    },
    columns: [{ heading: String, text: String }],
  },
  { _id: true },
);

export interface IPresentation extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  title: string;
  topic: string;
  audience: string;
  language: string;
  style: string;
  theme: string;
  tone: string;
  purpose: string;
  numSlides: number;
  slides: ISlide[];
  status: 'generating' | 'ready' | 'failed';
  aiProvider: string;
  isFavorite: boolean;
  folder?: string;
  tags: string[];
  version: number;
  history: { version: number; slides: ISlide[]; savedAt: Date }[];
  lastExportedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const presentationSchema = new Schema<IPresentation>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true },
    audience: { type: String, default: 'General' },
    language: { type: String, default: 'English' },
    style: { type: String, default: 'Professional' },
    theme: { type: String, default: 'midnight' },
    tone: { type: String, default: 'Professional' },
    purpose: { type: String, default: 'Inform' },
    numSlides: { type: Number, default: 10, min: 3, max: 30 },
    slides: [slideSchema],
    status: { type: String, enum: ['generating', 'ready', 'failed'], default: 'generating' },
    aiProvider: { type: String, default: 'gemini' },
    isFavorite: { type: Boolean, default: false },
    folder: { type: String, default: null },
    tags: [String],
    version: { type: Number, default: 1 },
    history: [
      {
        version: Number,
        slides: [slideSchema],
        savedAt: { type: Date, default: Date.now },
      },
    ],
    lastExportedAt: Date,
  },
  { timestamps: true },
);

presentationSchema.index({ owner: 1, createdAt: -1 });
presentationSchema.index({ title: 'text', topic: 'text' });

export const Presentation = model<IPresentation>('Presentation', presentationSchema);
