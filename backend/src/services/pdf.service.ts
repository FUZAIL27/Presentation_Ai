import puppeteer from 'puppeteer';
import { IPresentation, ISlide } from '../models/Presentation.model';

interface ThemeColors {
  bg: string;
  bgAlt: string;
  primary: string;
  accent: string;
  text: string;
  textMuted: string;
}

const THEMES: Record<string, ThemeColors> = {
  midnight: { bg: '#0F172A', bgAlt: '#1E293B', primary: '#6366F1', accent: '#22D3EE', text: '#F8FAFC', textMuted: '#CBD5E1' },
  aurora: { bg: '#FFFFFF', bgAlt: '#F1F5F9', primary: '#7C3AED', accent: '#EC4899', text: '#0F172A', textMuted: '#475569' },
  emerald: { bg: '#052E27', bgAlt: '#0B4A3F', primary: '#10B981', accent: '#F59E0B', text: '#ECFDF5', textMuted: '#A7F3D0' },
  sunset: { bg: '#1F0A1E', bgAlt: '#3B0F35', primary: '#F97316', accent: '#EC4899', text: '#FFF7ED', textMuted: '#FED7AA' },
  monochrome: { bg: '#0A0A0A', bgAlt: '#1A1A1A', primary: '#FFFFFF', accent: '#A3A3A3', text: '#FAFAFA', textMuted: '#A3A3A3' },
};

function getTheme(name: string): ThemeColors {
  return THEMES[name] ?? THEMES.midnight;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSlideBody(s: ISlide, _theme: ThemeColors): string {
  switch (s.layout) {
    case 'title':
      return `<div class="center">
        <h1 class="title-xl">${escapeHtml(s.title)}</h1>
        ${s.subtitle ? `<p class="subtitle">${escapeHtml(s.subtitle)}</p>` : ''}
      </div>`;
    case 'thankYou':
      return `<div class="center">
        <h1 class="title-xl">${escapeHtml(s.title)}</h1>
        ${s.subtitle ? `<p class="subtitle">${escapeHtml(s.subtitle)}</p>` : ''}
      </div>`;
    case 'quote':
      return `<div class="quote-wrap">
        <div class="quote-mark">"</div>
        <p class="quote-text">${escapeHtml(s.title)}</p>
        ${s.bodyText ? `<p class="quote-attr">— ${escapeHtml(s.bodyText)}</p>` : ''}
      </div>`;
    case 'agenda':
    case 'bullets':
    case 'conclusion':
      return `<h2 class="heading">${escapeHtml(s.title)}</h2>
        <div class="row">
          <ul class="bullets">${(s.bullets ?? []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ${s.imageUrl ? `<img class="side-img" src="${s.imageUrl}" />` : ''}
        </div>`;
    case 'content':
      return `<h2 class="heading">${escapeHtml(s.title)}</h2>
        <div class="row">
          <p class="body-text">${escapeHtml(s.bodyText ?? '')}</p>
          ${s.imageUrl ? `<img class="side-img" src="${s.imageUrl}" />` : ''}
        </div>`;
    case 'image':
      return `<h2 class="heading">${escapeHtml(s.title)}</h2>
        ${s.imageUrl ? `<img class="full-img" src="${s.imageUrl}" />` : `<p class="body-text">${escapeHtml(s.bodyText ?? '')}</p>`}`;
    case 'twoColumn':
      return `<h2 class="heading">${escapeHtml(s.title)}</h2>
        <div class="cols">
          ${(s.columns ?? [])
            .map(
              (c) =>
                `<div class="col-card"><h3>${escapeHtml(c.heading)}</h3><p>${escapeHtml(c.text)}</p></div>`,
            )
            .join('')}
        </div>`;
    case 'timeline':
      return `<h2 class="heading">${escapeHtml(s.title)}</h2>
        <div class="timeline">
          ${(s.timelineItems ?? [])
            .map(
              (t) =>
                `<div class="tl-item"><div class="tl-dot"></div><h4>${escapeHtml(t.label)}</h4><p>${escapeHtml(
                  t.description,
                )}</p></div>`,
            )
            .join('')}
        </div>`;
    case 'swot': {
      const quads = [
        { label: 'Strengths', items: s.swot?.strengths ?? [], color: '#22C55E' },
        { label: 'Weaknesses', items: s.swot?.weaknesses ?? [], color: '#EF4444' },
        { label: 'Opportunities', items: s.swot?.opportunities ?? [], color: '#3B82F6' },
        { label: 'Threats', items: s.swot?.threats ?? [], color: '#F59E0B' },
      ];
      return `<h2 class="heading">${escapeHtml(s.title)}</h2>
        <div class="swot-grid">
          ${quads
            .map(
              (q) =>
                `<div class="swot-card" style="border-color:${q.color}">
                  <h4 style="color:${q.color}">${q.label}</h4>
                  <ul>${q.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
                </div>`,
            )
            .join('')}
        </div>`;
    }
    case 'comparison': {
      const headers = s.comparison?.headers ?? [];
      const rows = s.comparison?.rows ?? [];
      return `<h2 class="heading">${escapeHtml(s.title)}</h2>
        <table class="comp-table">
          <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
          <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`;
    }
    case 'chart':
      return `<h2 class="heading">${escapeHtml(s.title)}</h2>
        <div class="chart-note">Chart: ${escapeHtml(s.chart?.type ?? '')} — ${(s.chart?.labels ?? []).join(', ')}</div>
        <p class="body-text">Interactive charts render fully in the PPTX export; this PDF shows a data summary.</p>`;
    default:
      return `<h2 class="heading">${escapeHtml(s.title)}</h2>`;
  }
}

function buildHtmlDocument(presentation: IPresentation): string {
  const theme = getTheme(presentation.theme);
  const sorted = [...presentation.slides].sort((a, b) => a.order - b.order);

  const slidesHtml = sorted
    .map(
      (s, i) => `
      <section class="slide">
        ${renderSlideBody(s, theme)}
        <div class="footer">${i + 1} / ${sorted.length}</div>
      </section>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: 1280px 720px; margin: 0; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; }
      .slide {
        width: 1280px; height: 720px; page-break-after: always;
        background: ${theme.bg}; color: ${theme.text};
        padding: 64px; position: relative; overflow: hidden;
      }
      .center { display: flex; flex-direction: column; justify-content: center; height: 100%; }
      .title-xl { font-size: 56px; font-weight: 700; margin: 0 0 16px 0; }
      .subtitle { font-size: 22px; color: ${theme.textMuted}; margin: 0; }
      .heading { font-size: 34px; font-weight: 700; margin: 0 0 8px 0; }
      .heading::after { content: ''; display: block; width: 90px; height: 4px; background: ${theme.primary}; margin-top: 12px; }
      .row { display: flex; gap: 40px; margin-top: 32px; align-items: flex-start; }
      .bullets { font-size: 20px; line-height: 1.7; flex: 1; padding-left: 24px; color: ${theme.text}; }
      .body-text { font-size: 20px; line-height: 1.6; color: ${theme.textMuted}; flex: 1; }
      .side-img { width: 420px; height: 420px; object-fit: cover; border-radius: 12px; }
      .full-img { width: 100%; height: 480px; object-fit: cover; border-radius: 12px; margin-top: 16px; }
      .quote-wrap { display: flex; flex-direction: column; justify-content: center; height: 100%; padding-left: 40px; }
      .quote-mark { font-size: 100px; color: ${theme.primary}; font-weight: 700; height: 80px; }
      .quote-text { font-size: 30px; font-style: italic; max-width: 90%; }
      .quote-attr { font-size: 18px; color: ${theme.textMuted}; }
      .cols { display: flex; gap: 24px; margin-top: 32px; }
      .col-card { flex: 1; background: ${theme.bgAlt}; border-radius: 12px; padding: 24px; }
      .col-card h3 { color: ${theme.primary}; margin-top: 0; }
      .col-card p { color: ${theme.textMuted}; font-size: 16px; line-height: 1.5; }
      .timeline { display: flex; justify-content: space-between; margin-top: 80px; position: relative; }
      .timeline::before { content: ''; position: absolute; top: -20px; left: 0; right: 0; height: 3px; background: ${theme.primary}; }
      .tl-item { flex: 1; text-align: center; padding: 0 8px; position: relative; }
      .tl-dot { width: 16px; height: 16px; border-radius: 50%; background: ${theme.primary}; margin: -28px auto 12px; }
      .tl-item h4 { margin: 8px 0 4px; font-size: 16px; }
      .tl-item p { font-size: 13px; color: ${theme.textMuted}; }
      .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
      .swot-card { background: ${theme.bgAlt}; border: 2px solid; border-radius: 12px; padding: 20px; }
      .swot-card ul { margin: 8px 0 0; padding-left: 20px; font-size: 14px; color: ${theme.text}; }
      .comp-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
      .comp-table th { background: ${theme.primary}; color: ${theme.bg}; padding: 12px; text-align: left; font-size: 15px; }
      .comp-table td { background: ${theme.bgAlt}; padding: 12px; font-size: 14px; color: ${theme.text}; }
      .chart-note { font-size: 18px; color: ${theme.primary}; margin-top: 20px; font-weight: 600; }
      .footer { position: absolute; bottom: 24px; right: 40px; font-size: 12px; color: ${theme.textMuted}; }
    </style>
  </head>
  <body>${slidesHtml}</body>
  </html>`;
}

export async function generatePdfBuffer(presentation: IPresentation): Promise<Buffer> {
  const html = buildHtmlDocument(presentation);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ...(process.env.PUPPETEER_EXECUTABLE_PATH
      ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
      : {}),
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      width: '1280px',
      height: '720px',
      printBackground: true,
      pageRanges: '',
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
