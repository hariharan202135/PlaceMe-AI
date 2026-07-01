import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewQuestion {
  question: string;
  answer?: string;
  score?: number;
  feedback?: string;
  idealAnswer?: string;
}

export interface IInterview extends Document {
  user: mongoose.Types.ObjectId;
  jobRole: string;
  questions: IInterviewQuestion[];
  overallScore: number;
  evaluation?: {
    grammar: string;
    confidence: string;
    technical: string;
    suggestions: string;
  };
  status: 'pending' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobRole: { type: String, required: true, trim: true },
    questions: [
      {
        question: { type: String, required: true },
        answer: { type: String },
        score: { type: Number },
        feedback: { type: String },
        idealAnswer: { type: String }
      }
    ],
    overallScore: { type: Number, default: 0 },
    evaluation: {
      grammar: { type: String },
      confidence: { type: String },
      technical: { type: String },
      suggestions: { type: String }
    },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' }
  },
  { timestamps: true }
);

export default mongoose.model<IInterview>('Interview', InterviewSchema);
