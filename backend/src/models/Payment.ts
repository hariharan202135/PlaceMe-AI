import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  orderId?: string;
  paymentId?: string;
  subscriptionId?: string;
  signature?: string;
  amount: number;
  currency: string;
  status: 'Success' | 'Failed' | 'Refunded';
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String },
    paymentId: { type: String },
    subscriptionId: { type: String },
    signature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['Success', 'Failed', 'Refunded'], default: 'Failed' }
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>('Payment', PaymentSchema);
