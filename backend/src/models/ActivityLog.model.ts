import { Schema, model, Document, Types } from 'mongoose';

export type ActivityAction =
  | 'user.signup'
  | 'user.login'
  | 'user.logout'
  | 'user.password_reset'
  | 'user.email_verified'
  | 'presentation.created'
  | 'presentation.updated'
  | 'presentation.deleted'
  | 'presentation.exported_pptx'
  | 'presentation.exported_pdf'
  | 'slide.regenerated';

export interface IActivityLog extends Document {
  user: Types.ObjectId;
  action: ActivityAction;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  ip: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now },
});

activityLogSchema.index({ user: 1, createdAt: -1 });

export const ActivityLog = model<IActivityLog>('ActivityLog', activityLogSchema);
