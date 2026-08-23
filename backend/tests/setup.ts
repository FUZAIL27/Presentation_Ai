import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'a'.repeat(64);
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'b'.repeat(64);
process.env.EMAIL_VERIFICATION_SECRET = process.env.EMAIL_VERIFICATION_SECRET ?? 'c'.repeat(64);
process.env.PASSWORD_RESET_SECRET = process.env.PASSWORD_RESET_SECRET ?? 'd'.repeat(64);
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? 'test-key-not-real';
process.env.CLIENT_URL = 'http://localhost:5173';
// Placeholder so env schema validation passes at import time; actual connection below
// uses the in-memory server URI directly rather than this value.
process.env.MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/presentai-test-placeholder';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
