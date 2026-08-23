import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { RefreshToken } from '../models/RefreshToken.model';
import { Types } from 'mongoose';

export interface AccessTokenPayload {
  sub: string;
  role: 'user' | 'admin';
  iat?: number;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(userId: string, role: 'user' | 'admin'): string {
  const payload: AccessTokenPayload = { sub: userId, role };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

function signRefreshJwt(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

export function verifyRefreshJwt(token: string): { sub: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
}

function msFromExpiryString(expiry: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiry);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}

export async function issueRefreshToken(
  userId: string,
  meta: { userAgent?: string; ip?: string },
): Promise<string> {
  const token = signRefreshJwt(userId);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + msFromExpiryString(env.JWT_REFRESH_EXPIRES_IN));

  await RefreshToken.create({
    user: new Types.ObjectId(userId),
    tokenHash,
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt,
  });

  return token;
}

export async function rotateRefreshToken(
  oldToken: string,
  meta: { userAgent?: string; ip?: string },
): Promise<{ userId: string; newRefreshToken: string; newAccessToken: string; role: 'user' | 'admin' } | null> {
  let decoded: { sub: string };
  try {
    decoded = verifyRefreshJwt(oldToken);
  } catch {
    return null;
  }

  const oldHash = hashToken(oldToken);
  const stored = await RefreshToken.findOne({ tokenHash: oldHash, user: decoded.sub });

  if (!stored || stored.revoked || stored.expiresAt.getTime() < Date.now()) {
    if (stored?.revoked) {
      await RefreshToken.updateMany({ user: decoded.sub }, { revoked: true });
    }
    return null;
  }

  const { User } = await import('../models/User.model');
  const user = await User.findById(decoded.sub);
  if (!user || !user.active) return null;

  const newRefreshToken = signRefreshJwt(decoded.sub);
  const newHash = hashToken(newRefreshToken);

  stored.revoked = true;
  stored.replacedByTokenHash = newHash;
  await stored.save();

  await RefreshToken.create({
    user: user._id,
    tokenHash: newHash,
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt: new Date(Date.now() + msFromExpiryString(env.JWT_REFRESH_EXPIRES_IN)),
  });

  const newAccessToken = signAccessToken(String(user._id), user.role);

  return { userId: String(user._id), newRefreshToken, newAccessToken, role: user.role };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await RefreshToken.updateOne({ tokenHash }, { revoked: true });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await RefreshToken.updateMany({ user: userId }, { revoked: true });
}
