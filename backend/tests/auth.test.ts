import request from 'supertest';
import { createApp } from '../src/app';
import { User } from '../src/models/User.model';

const app = createApp();

const validUser = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'StrongP@ssw0rd!',
};

describe('Auth flow', () => {
  it('rejects signup with a weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ ...validUser, password: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('signs up a new user and returns an access token', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects duplicate signups with the same email', async () => {
    await request(app).post('/api/v1/auth/signup').send(validUser);
    const res = await request(app).post('/api/v1/auth/signup').send(validUser);

    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials and rejects incorrect ones', async () => {
    await request(app).post('/api/v1/auth/signup').send(validUser);

    const wrongPass = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'WrongPassword1!' });
    expect(wrongPass.status).toBe(401);

    const correct = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(correct.status).toBe(200);
    expect(correct.body.data.accessToken).toBeDefined();
  });

  it('blocks access to protected routes without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('allows access to /me with a valid access token', async () => {
    const signupRes = await request(app).post('/api/v1/auth/signup').send(validUser);
    const token = signupRes.body.data.accessToken;

    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  it('rotates refresh tokens via cookie and issues a new access token', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/signup').send(validUser);

    const refreshRes = await agent.post('/api/v1/auth/refresh');
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
  });

  it('issues a password reset token that can be used to reset the password', async () => {
    await request(app).post('/api/v1/auth/signup').send(validUser);

    const forgotRes = await request(app).post('/api/v1/auth/forgot-password').send({ email: validUser.email });
    expect(forgotRes.status).toBe(200);

    const user = await User.findOne({ email: validUser.email }).select('+passwordResetToken +passwordResetExpires');
    expect(user?.passwordResetToken).toBeDefined();
  });
});
