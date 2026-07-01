import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminLog extends Document {
  adminUser: mongoose.Types.ObjectId;
  action: string; // e.g. 'BAN_USER', 'CREATE_QUESTION', 'REFUND_PAYMENT'
  targetUser?: mongoose.Types.ObjectId;
  details: string;
  ipAddress?: string;
  createdAt: Date;
}

const AdminLogSchema: Schema = new Schema(
  {
    adminUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    targetUser: { type: Schema.Types.ObjectId, ref: 'User' },
    details: { type: String, required: true },
    ipAddress: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IAdminLog>('AdminLog', AdminLogSchema);
