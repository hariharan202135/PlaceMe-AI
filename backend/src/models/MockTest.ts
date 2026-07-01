import mongoose, { Schema, Document } from 'mongoose';

export interface IMockTest extends Document {
  title: string;
  description?: string;
  duration: number; // in minutes
  category: mongoose.Types.ObjectId;
  questions: mongoose.Types.ObjectId[];
  totalMarks: number;
  passingMarks: number;
  companyTag?: string; // e.g. 'TCS', 'Infosys'
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MockTestSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    duration: { type: Number, required: true }, // in minutes
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    companyTag: { type: String, trim: true },
    isPremium: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model<IMockTest>('MockTest', MockTestSchema);
