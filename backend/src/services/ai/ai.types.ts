export interface GenerationRequest {
  topic: string;
  audience: string;
  language: string;
  style: string;
  numSlides: number;
  purpose: string;
  tone: string;
  includeCharts: boolean;
}

export interface AIGeneratedSlide {
  order: number;
  layout: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  bodyText?: string;
  speakerNotes?: string;
  imageQuery?: string;
  chart?: {
    type: 'bar' | 'line' | 'pie' | 'doughnut';
    labels: string[];
    datasets: { label: string; data: number[] }[];
  };
  timelineItems?: { label: string; description: string }[];
  swot?: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  comparison?: { headers: string[]; rows: string[][] };
  columns?: { heading: string; text: string }[];
}

export interface AIGenerationResult {
  title: string;
  slides: AIGeneratedSlide[];
}

export interface AIProvider {
  readonly name: string;
  generatePresentation(req: GenerationRequest): Promise<AIGenerationResult>;
  rewriteText(text: string, instruction: string, context?: string): Promise<string>;
  regenerateSlide(slide: AIGeneratedSlide, topic: string, tone: string): Promise<AIGeneratedSlide>;
}

export class AIProviderError extends Error {
  constructor(
    public provider: string,
    message: string,
    public cause?: unknown,
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'AIProviderError';
  }
}
