import request from 'supertest';

jest.mock('../src/services/ai/ai.factory', () => ({
  withAIFallback: jest.fn(async (op: (provider: unknown) => Promise<unknown>) =>
    op({
      name: 'mock-provider',
      generatePresentation: async () => ({
        title: 'The Future of Renewable Energy',
        slides: [
          { order: 1, layout: 'title', title: 'The Future of Renewable Energy', subtitle: 'A 2026 Outlook', speakerNotes: 'Welcome the audience.' },
          { order: 2, layout: 'agenda', title: 'Agenda', bullets: ['Overview', 'Trends', 'Conclusion'], speakerNotes: 'Walk through agenda.' },
          { order: 3, layout: 'bullets', title: 'Key Trends', bullets: ['Solar costs falling', 'Battery storage scaling'], speakerNotes: 'Discuss trends.' },
          { order: 4, layout: 'conclusion', title: 'Key Takeaways', bullets: ['Renewables are winning on cost'], speakerNotes: 'Wrap up.' },
          { order: 5, layout: 'thankYou', title: 'Thank You', subtitle: 'Questions?', speakerNotes: 'Open floor.' },
        ],
      }),
      rewriteText: async (text: string) => `${text} (rewritten)`,
      regenerateSlide: async (slide: Record<string, unknown>) => ({ ...slide, title: `${slide.title} (v2)` }),
    }),
  ),
  getPrimaryProviderName: jest.fn(() => 'mock-provider'),
}));

import { createApp } from '../src/app';

const app = createApp();

async function signupAndGetToken(): Promise<string> {
  const res = await request(app).post('/api/v1/auth/signup').send({
    name: 'Grace Hopper',
    email: 'grace@example.com',
    password: 'StrongP@ssw0rd!',
  });
  return res.body.data.accessToken;
}

describe('Presentation generation and editing', () => {
  it('rejects generation without auth', async () => {
    const res = await request(app).post('/api/v1/presentations/generate').send({ topic: 'AI in Healthcare' });
    expect(res.status).toBe(401);
  });

  it('generates a presentation end to end using the (mocked) AI provider', async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .post('/api/v1/presentations/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topic: 'The Future of Renewable Energy',
        audience: 'Investors',
        numSlides: 5,
        includeImages: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.presentation.status).toBe('ready');
    expect(res.body.data.presentation.slides).toHaveLength(5);
    expect(res.body.data.presentation.slides[0].layout).toBe('title');
    expect(res.body.data.presentation.slides[4].layout).toBe('thankYou');
  });

  it('lists, updates, and deletes a presentation', async () => {
    const token = await signupAndGetToken();
    const genRes = await request(app)
      .post('/api/v1/presentations/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Quantum Computing 101', numSlides: 5, includeImages: false });

    const id = genRes.body.data.presentation._id;

    const listRes = await request(app).get('/api/v1/presentations').set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.presentations.length).toBe(1);

    const updateRes = await request(app)
      .patch(`/api/v1/presentations/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Renamed Deck', isFavorite: true });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.presentation.title).toBe('Renamed Deck');
    expect(updateRes.body.data.presentation.isFavorite).toBe(true);

    const deleteRes = await request(app)
      .delete(`/api/v1/presentations/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/v1/presentations/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });

  it('adds, reorders, and deletes slides', async () => {
    const token = await signupAndGetToken();
    const genRes = await request(app)
      .post('/api/v1/presentations/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Space Exploration', numSlides: 5, includeImages: false });

    const id = genRes.body.data.presentation._id;

    const addRes = await request(app)
      .post(`/api/v1/presentations/${id}/slides`)
      .set('Authorization', `Bearer ${token}`)
      .send({ layout: 'bullets', title: 'New Section', afterOrder: 2 });
    expect(addRes.status).toBe(201);
    expect(addRes.body.data.presentation.slides).toHaveLength(6);

    const slides = addRes.body.data.presentation.slides;
    const newSlide = slides.find((s: { title: string }) => s.title === 'New Section');
    expect(newSlide).toBeDefined();

    const deleteRes = await request(app)
      .delete(`/api/v1/presentations/${id}/slides/${newSlide._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.presentation.slides).toHaveLength(5);
  });

  it('enforces the free-tier presentation generation limit', async () => {
    const token = await signupAndGetToken();

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/v1/presentations/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ topic: `Topic ${i}`, numSlides: 5, includeImages: false });
      expect(res.status).toBe(201);
    }

    const overLimitRes = await request(app)
      .post('/api/v1/presentations/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'One too many', numSlides: 5, includeImages: false });

    expect(overLimitRes.status).toBe(403);
  });
});
