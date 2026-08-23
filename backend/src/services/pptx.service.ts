import PptxGenJS from 'pptxgenjs';
import { IPresentation, ISlide } from '../models/Presentation.model';
import { logger } from '../config/logger';

const imageDataCache = new Map<string, string | null>();

/**
 * pptxgenjs's own remote-URL fetching in Node is inconsistent across versions, so we
 * pre-fetch and embed images as base64 data URIs ourselves for reliability.
 */
async function resolveImageToDataUri(url: string): Promise<string | null> {
  if (imageDataCache.has(url)) return imageDataCache.get(url) ?? null;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUri = `data:${contentType};base64,${base64}`;
    imageDataCache.set(url, dataUri);
    return dataUri;
  } catch (err) {
    logger.warn(`Failed to fetch image for pptx embed (${url}): ${(err as Error).message}`);
    imageDataCache.set(url, null);
    return null;
  }
}

async function resolveAllSlideImages(slides: ISlide[]): Promise<Map<string, string>> {
  const urls = Array.from(new Set(slides.map((s) => s.imageUrl).filter((u): u is string => !!u)));
  const entries = await Promise.all(urls.map(async (url) => [url, await resolveImageToDataUri(url)] as const));
  const map = new Map<string, string>();
  for (const [url, data] of entries) {
    if (data) map.set(url, data);
  }
  return map;
}

interface ThemeColors {
  bg: string;
  bgAlt: string;
  primary: string;
  accent: string;
  text: string;
  textMuted: string;
}

const THEMES: Record<string, ThemeColors> = {
  midnight: { bg: '0F172A', bgAlt: '1E293B', primary: '6366F1', accent: '22D3EE', text: 'F8FAFC', textMuted: 'CBD5E1' },
  aurora: { bg: 'FFFFFF', bgAlt: 'F1F5F9', primary: '7C3AED', accent: 'EC4899', text: '0F172A', textMuted: '475569' },
  emerald: { bg: '052E27', bgAlt: '0B4A3F', primary: '10B981', accent: 'F59E0B', text: 'ECFDF5', textMuted: 'A7F3D0' },
  sunset: { bg: '1F0A1E', bgAlt: '3B0F35', primary: 'F97316', accent: 'EC4899', text: 'FFF7ED', textMuted: 'FED7AA' },
  monochrome: { bg: '0A0A0A', bgAlt: '1A1A1A', primary: 'FFFFFF', accent: 'A3A3A3', text: 'FAFAFA', textMuted: 'A3A3A3' },
};

function getTheme(name: string): ThemeColors {
  return THEMES[name] ?? THEMES.midnight;
}

const FONT = 'Poppins';
const W = 13.333;
const H = 7.5;

function addBackground(slide: PptxGenJS.Slide, theme: ThemeColors): void {
  slide.background = { color: theme.bg };
}

function addFooter(slide: PptxGenJS.Slide, theme: ThemeColors, pageNum: number, total: number): void {
  slide.addText(`${pageNum} / ${total}`, {
    x: W - 1.3,
    y: H - 0.45,
    w: 1,
    h: 0.3,
    fontSize: 10,
    color: theme.textMuted,
    fontFace: FONT,
    align: 'right',
  });
}

function addAccentBar(slide: PptxGenJS.Slide, theme: ThemeColors): void {
  slide.addShape('rect', { x: 0, y: 0, w: 0.12, h: H, fill: { color: theme.primary } });
}

function renderTitleSlide(pptx: PptxGenJS, s: ISlide, theme: ThemeColors, presentationTitle: string): PptxGenJS.Slide {
  const slide = pptx.addSlide();
  addBackground(slide, theme);
  slide.addShape('rect', { x: 0, y: H / 2 - 0.02, w: W, h: 0.04, fill: { color: theme.primary } });
  slide.addText(s.title || presentationTitle, {
    x: 0.8,
    y: H / 2 - 1.5,
    w: W - 1.6,
    h: 1.4,
    fontSize: 40,
    bold: true,
    color: theme.text,
    fontFace: FONT,
    align: 'left',
  });
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: 0.8,
      y: H / 2 + 0.15,
      w: W - 1.6,
      h: 0.8,
      fontSize: 18,
      color: theme.textMuted,
      fontFace: FONT,
      align: 'left',
    });
  }
  return slide;
}

function renderThankYouSlide(pptx: PptxGenJS, s: ISlide, theme: ThemeColors): PptxGenJS.Slide {
  const slide = pptx.addSlide();
  addBackground(slide, theme);
  slide.addText(s.title || 'Thank You', {
    x: 0.8,
    y: H / 2 - 1,
    w: W - 1.6,
    h: 1.2,
    fontSize: 44,
    bold: true,
    color: theme.text,
    fontFace: FONT,
    align: 'center',
  });
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: 0.8,
      y: H / 2 + 0.4,
      w: W - 1.6,
      h: 0.6,
      fontSize: 16,
      color: theme.textMuted,
      fontFace: FONT,
      align: 'center',
    });
  }
  return slide;
}

function renderHeader(slide: PptxGenJS.Slide, title: string, theme: ThemeColors): void {
  slide.addText(title, {
    x: 0.8,
    y: 0.5,
    w: W - 1.6,
    h: 0.9,
    fontSize: 28,
    bold: true,
    color: theme.text,
    fontFace: FONT,
  });
  slide.addShape('rect', { x: 0.8, y: 1.35, w: 1.1, h: 0.05, fill: { color: theme.primary } });
}

function renderBulletsSlide(pptx: PptxGenJS, s: ISlide, theme: ThemeColors): PptxGenJS.Slide {
  const slide = pptx.addSlide();
  addBackground(slide, theme);
  addAccentBar(slide, theme);
  renderHeader(slide, s.title, theme);
  const bullets = (s.bullets ?? []).map((b) => ({
    text: b,
    options: { bullet: { code: '2022', indent: 20 }, color: theme.text, fontSize: 16, breakLine: true },
  }));
  slide.addText(bullets, { x: 0.8, y: 1.7, w: s.imageUrl ? W - 6.5 : W - 1.6, h: H - 2.3, fontFace: FONT, valign: 'top', paraSpaceAfter: 12 });
  if (s.imageUrl) {
    slide.addImage({ data: s.imageUrl, x: W - 5.2, y: 1.7, w: 4.4, h: 4.4, sizing: { type: 'cover', w: 4.4, h: 4.4 } });
  }
  return slide;
}

function renderContentSlide(pptx: PptxGenJS, s: ISlide, theme: ThemeColors): PptxGenJS.Slide {
  const slide = pptx.addSlide();
  addBackground(slide, theme);
  addAccentBar(slide, theme);
  renderHeader(slide, s.title, theme);
  slide.addText(s.bodyText ?? '', {
    x: 0.8,
    y: 1.7,
    w: s.imageUrl ? W - 6.5 : W - 1.6,
    h: H - 2.3,
    fontSize: 16,
    color: theme.textMuted,
    fontFace: FONT,
    valign: 'top',
    lineSpacingMultiple: 1.3,
  });
  if (s.imageUrl) {
    slide.addImage({ data: s.imageUrl, x: W - 5.2, y: 1.7, w: 4.4, h: 4.4, sizing: { type: 'cover', w: 4.4, h: 4.4 } });
  }
  return slide;
}

function renderTwoColumnSlide(pptx: PptxGenJS, s: ISlide, theme: ThemeColors): PptxGenJS.Slide {
  const slide = pptx.addSlide();
  addBackground(slide, theme);
  addAccentBar(slide, theme);
  renderHeader(slide, s.title, theme);
  const cols = s.columns ?? [];
  const colW = (W - 1.6 - 0.6) / 2;
  cols.slice(0, 2).forEach((col, i) => {
    const x = 0.8 + i * (colW + 0.6);
    slide.addShape('roundRect', { x, y: 1.7, w: colW, h: H - 2.3, fill: { color: theme.bgAlt }, rectRadius: 0.08, line: { color: theme.bgAlt } });
    slide.addText(col.heading, { x: x + 0.3, y: 1.9, w: colW - 0.6, h: 0.6, fontSize: 18, bold: true, color: theme.primary, fontFace: FONT });
    slide.addText(col.text, { x: x + 0.3, y: 2.5, w: colW - 0.6, h: H - 3.2, fontSize: 14, color: theme.textMuted, fontFace: FONT, valign: 'top' });
  });
  return slide;
}

function renderImageSlide(pptx: PptxGenJS, s: ISlide, theme: ThemeColors): PptxGenJS.Slide {
  const slide = pptx.addSlide();
  addBackground(slide, theme);
  addAccentBar(slide, theme);
  renderHeader(slide, s.title, theme);
  if (s.imageUrl) {
    slide.addImage({ data: s.imageUrl, x: 0.8, y: 1.7, w: W - 1.6, h: H - 2.4, sizing: { type: 'cover', w: W - 1.6, h: H - 2.4 } });
  } else if (s.bodyText) {
    slide.addText(s.bodyText, { x: 0.8, y: 1.7, w: W - 1.6, h: H - 2.4, fontSize: 16, color: theme.textMuted, fontFace: FONT });
  }
  return slide;
}

function renderQuoteSlide(pptx: PptxGenJS, s: ISlide, theme: ThemeColors): PptxGenJS.Slide {
  const slide = pptx.addSlide();
  addBackground(slide, theme);
  slide.addText('"', { x: 0.8, y: 1.0, w: 1.5, h: 1.5, fontSize: 90, color: theme.primary, fontFace: FONT, bold: true });
  slide.addText(s.title, {
    x: 1.2,
    y: 2.3,
    w: W - 2.4,
    h: 2.2,
    fontSize: 28,
    italic: true,
    color: theme.text,
    fontFace: FONT,
    align: 'left',
  });
  if (s.bodyText) {
    slide.addText(`— ${s.bodyText}`, { x: 1.2, y: 4.6, w: W - 2.4, h: 0.6, fontSize: 16, color: theme.textMuted, fontFace: FONT });
  }
  return slide;
}

function renderChartSlide(pptx: PptxGenJS, s: ISlide, theme: ThemeColors): PptxGenJS.Slide {
  const slide = pptx.addSlide();
  addBackground(slide, theme);
  addAccentBar(slide, theme);
  renderHeader(slide, s.title, theme);

  if (!s.chart) return slide;

  const chartTypeMap: Record<string, PptxGenJS.CHART_NAME> = {
    bar: pptx.ChartType.bar,
    line: pptx.ChartType.line,
    pie: pptx.ChartType.pie,
    doughnut: pptx.ChartType.doughnut,
  };

  const dataForChart = s.chart.datasets.map((ds) => ({
    name: ds.label,
    labels: s.chart!.labels,
    values: ds.data,
  }));

  slide.addChart(chartTypeMap[s.chart.type] ?? pptx.ChartType.bar, dataForChart, {
    x: 0.8,
    y: 1.7,
    w: W - 1.6,
    h: H - 2.4,
    showTitle: false,
    showLegend: true,
    legendPos: 'b',
    chartColors: [theme.primary, theme.accent, 'A78BFA', 'F472B6', '34D399'],
    catAxisLabelColor: theme.textMuted,
    valAxisLabelColor: theme.textMuted,
    dataLabelColor: theme.text,
  });
  return slide;
}

function renderTimelineSlide(pptx: PptxGenJS, s: ISlide, theme: ThemeColors): PptxGenJS.Slide {
  const slide = pptx.addSlide();
  addBackground(slide, theme);
  addAccentBar(slide, theme);
  renderHeader(slide, s.title, theme);

  const items = s.timelineItems ?? [];
  const n = Math.max(items.length, 1);
  const trackY = H / 2 + 0.3;
  slide.addShape('line', { x: 1.0, y: trackY, w: W - 2.0, h: 0, line: { color: theme.primary, width: 3 } });

  items.forEach((item, i) => {
    const x = 1.0 + (i / Math.max(n - 1, 1)) * (W - 2.0);
    slide.addShape('ellipse', { x: x - 0.1, y: trackY - 0.1, w: 0.2, h: 0.2, fill: { color: theme.primary } });
    const above = i % 2 === 0;
    slide.addText(item.label, {
      x: x - 1.1,
      y: above ? trackY - 1.3 : trackY + 0.3,
      w: 2.2,
      h: 0.4,
      fontSize: 13,
      bold: true,
      color: theme.text,
      fontFace: FONT,
      align: 'center',
    });
    slide.addText(item.description, {
      x: x - 1.1,
      y: above ? trackY - 0.9 : trackY + 0.7,
      w: 2.2,
      h: 0.8,
      fontSize: 10,
      color: theme.textMuted,
      fontFace: FONT,
      align: 'center',
      valign: 'top',
    });
  });
  return slide;
}

function renderSwotSlide(pptx: PptxGenJS, s: ISlide, theme: ThemeColors): PptxGenJS.Slide {
  const slide = pptx.addSlide();
  addBackground(slide, theme);
  addAccentBar(slide, theme);
  renderHeader(slide, s.title, theme);

  const quadrants = [
    { label: 'Strengths', items: s.swot?.strengths ?? [], color: '22C55E' },
    { label: 'Weaknesses', items: s.swot?.weaknesses ?? [], color: 'EF4444' },
    { label: 'Opportunities', items: s.swot?.opportunities ?? [], color: '3B82F6' },
    { label: 'Threats', items: s.swot?.threats ?? [], color: 'F59E0B' },
  ];

  const qW = (W - 1.6 - 0.4) / 2;
  const qH = (H - 2.3 - 0.4) / 2;

  quadrants.forEach((q, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * (qW + 0.4);
    const y = 1.7 + row * (qH + 0.4);
    slide.addShape('roundRect', { x, y, w: qW, h: qH, fill: { color: theme.bgAlt }, rectRadius: 0.06, line: { color: q.color, width: 1.5 } });
    slide.addText(q.label, { x: x + 0.25, y: y + 0.15, w: qW - 0.5, h: 0.4, fontSize: 14, bold: true, color: q.color, fontFace: FONT });
    slide.addText(
      q.items.map((it) => ({ text: it, options: { bullet: { code: '2022' }, breakLine: true } })),
      { x: x + 0.25, y: y + 0.55, w: qW - 0.5, h: qH - 0.7, fontSize: 11, color: theme.text, fontFace: FONT, valign: 'top' },
    );
  });
  return slide;
}

function renderComparisonSlide(pptx: PptxGenJS, s: ISlide, theme: ThemeColors): PptxGenJS.Slide {
  const slide = pptx.addSlide();
  addBackground(slide, theme);
  addAccentBar(slide, theme);
  renderHeader(slide, s.title, theme);

  const headers = s.comparison?.headers ?? [];
  const rows = s.comparison?.rows ?? [];
  if (headers.length === 0) return slide;

  const tableRows: PptxGenJS.TableRow[] = [
    headers.map((h) => ({
      text: h,
      options: { bold: true, color: theme.bg, fill: { color: theme.primary }, fontSize: 13, fontFace: FONT },
    })),
    ...rows.map((row) =>
      row.map((cell) => ({
        text: cell,
        options: { color: theme.text, fill: { color: theme.bgAlt }, fontSize: 12, fontFace: FONT },
      })),
    ),
  ];

  slide.addTable(tableRows, {
    x: 0.8,
    y: 1.7,
    w: W - 1.6,
    h: H - 2.3,
    border: { type: 'solid', color: theme.bg, pt: 1 },
    autoPage: false,
  });
  return slide;
}

function renderConclusionSlide(pptx: PptxGenJS, s: ISlide, theme: ThemeColors): PptxGenJS.Slide {
  return renderBulletsSlide(pptx, s, theme);
}

export async function generatePptxBuffer(presentation: IPresentation): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'PRESENTAI_16x9', width: W, height: H });
  pptx.layout = 'PRESENTAI_16x9';
  pptx.author = 'PresentAI';
  pptx.title = presentation.title;

  const theme = getTheme(presentation.theme);
  const sortedOriginal = [...presentation.slides].sort((a, b) => a.order - b.order);
  const imageMap = await resolveAllSlideImages(sortedOriginal);
  const sorted = sortedOriginal.map((s) => ({
    ...(s.toObject ? s.toObject() : s),
    imageUrl: s.imageUrl ? (imageMap.get(s.imageUrl) ?? undefined) : undefined,
  })) as ISlide[];

  for (const s of sorted) {
    let currentSlide: PptxGenJS.Slide;
    switch (s.layout) {
      case 'title':
        currentSlide = renderTitleSlide(pptx, s, theme, presentation.title);
        break;
      case 'thankYou':
        currentSlide = renderThankYouSlide(pptx, s, theme);
        break;
      case 'agenda':
      case 'bullets':
        currentSlide = renderBulletsSlide(pptx, s, theme);
        break;
      case 'content':
        currentSlide = renderContentSlide(pptx, s, theme);
        break;
      case 'twoColumn':
        currentSlide = renderTwoColumnSlide(pptx, s, theme);
        break;
      case 'image':
        currentSlide = renderImageSlide(pptx, s, theme);
        break;
      case 'quote':
        currentSlide = renderQuoteSlide(pptx, s, theme);
        break;
      case 'chart':
        currentSlide = renderChartSlide(pptx, s, theme);
        break;
      case 'timeline':
        currentSlide = renderTimelineSlide(pptx, s, theme);
        break;
      case 'swot':
        currentSlide = renderSwotSlide(pptx, s, theme);
        break;
      case 'comparison':
        currentSlide = renderComparisonSlide(pptx, s, theme);
        break;
      case 'conclusion':
        currentSlide = renderConclusionSlide(pptx, s, theme);
        break;
      default:
        currentSlide = renderBulletsSlide(pptx, s, theme);
    }

    addFooter(currentSlide, theme, sorted.indexOf(s) + 1, sorted.length);
  }

  const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  return buffer;
}
