import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswerResponse {
  questionId: mongoose.Types.ObjectId;
  chosenOption?: number;
  codeSubmissionId?: mongoose.Types.ObjectId;
  isCorrect: boolean;
}

export interface ITestResult extends Document {
  user: mongoose.Types.ObjectId;
  mockTest: mongoose.Types.ObjectId;
  sectionScores: {
    aptitude: number;
    logical: number;
    verbal: number;
    technical?: number;
  };
  totalScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  answers: IAnswerResponse[];
  percentile: number;
  status: 'Pass' | 'Fail' | 'Pending';
  timeTaken: number; // in seconds
  remainingTime?: number; // remaining seconds (for pending attempts)
  bookmarks?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TestResultSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mockTest: { type: Schema.Types.ObjectId, ref: 'MockTest', required: true },
    sectionScores: {
      aptitude: { type: Number, default: 0 },
      logical: { type: Number, default: 0 },
      verbal: { type: Number, default: 0 },
      technical: { type: Number, default: 0 }
    },
    totalScore: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    incorrectAnswers: { type: Number, required: true },
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
        chosenOption: { type: Number },
        codeSubmissionId: { type: Schema.Types.ObjectId, ref: 'CodingSubmission' },
        isCorrect: { type: Boolean, required: true }
      }
    ],
    percentile: { type: Number, default: 0 },
    status: { type: String, enum: ['Pass', 'Fail', 'Pending'], required: true },
    timeTaken: { type: Number, required: true }, // in seconds
    remainingTime: { type: Number, default: 0 },
    bookmarks: [{ type: Schema.Types.ObjectId, ref: 'Question' }]
  },
  { timestamps: true }
);

TestResultSchema.index({ user: 1, mockTest: 1 });
TestResultSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<ITestResult>('TestResult', TestResultSchema);
