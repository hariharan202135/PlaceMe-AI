import mongoose, { Schema, Document } from 'mongoose';

export interface ICodingSubmission extends Document {
  user: mongoose.Types.ObjectId;
  question: mongoose.Types.ObjectId;
  code: string;
  language: 'c' | 'cpp' | 'java' | 'python' | 'javascript';
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Compilation Error' | 'Runtime Error';
  errorDetails?: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

const CodingSubmissionSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    code: { type: String, required: true },
    language: { type: String, enum: ['c', 'cpp', 'java', 'python', 'javascript'], required: true },
    status: { 
      type: String, 
      enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Compilation Error', 'Runtime Error'], 
      required: true 
    },
    errorDetails: { type: String },
    score: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model<ICodingSubmission>('CodingSubmission', CodingSubmissionSchema);
