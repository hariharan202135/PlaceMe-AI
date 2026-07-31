import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewQuestion {
  question: string;
  answer?: string;
  score?: number;
  technicalScore?: number;
  communicationScore?: number;
  grammarScore?: number;
  confidenceScore?: number;
  relevanceScore?: number;
  problemSolvingScore?: number;
  professionalismScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  feedback?: string;
  improvedAnswer?: string;
  recommendation?: 'Pass' | 'Borderline' | 'Fail';
  learningSuggestions?: string[];
  idealAnswer?: string;
}

export interface IInterview extends Document {
  user: mongoose.Types.ObjectId;
  jobRole: string;
  questions: IInterviewQuestion[];
  overallScore: number;
  technicalScore?: number;
  communicationScore?: number;
  grammarScore?: number;
  confidenceScore?: number;
  relevanceScore?: number;
  problemSolvingScore?: number;
  professionalismScore?: number;
  recommendation?: 'Pass' | 'Borderline' | 'Fail';
  strengths?: string[];
  weaknesses?: string[];
  learningSuggestions?: string[];
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
        score: { type: Number, default: 0 },
        technicalScore: { type: Number, default: 0 },
        communicationScore: { type: Number, default: 0 },
        grammarScore: { type: Number, default: 0 },
        confidenceScore: { type: Number, default: 0 },
        relevanceScore: { type: Number, default: 0 },
        problemSolvingScore: { type: Number, default: 0 },
        professionalismScore: { type: Number, default: 0 },
        strengths: [{ type: String }],
        weaknesses: [{ type: String }],
        feedback: { type: String },
        improvedAnswer: { type: String },
        recommendation: { type: String, enum: ['Pass', 'Borderline', 'Fail'] },
        learningSuggestions: [{ type: String }],
        idealAnswer: { type: String }
      }
    ],
    overallScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    grammarScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    relevanceScore: { type: Number, default: 0 },
    problemSolvingScore: { type: Number, default: 0 },
    professionalismScore: { type: Number, default: 0 },
    recommendation: { type: String, enum: ['Pass', 'Borderline', 'Fail'], default: 'Borderline' },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    learningSuggestions: [{ type: String }],
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
