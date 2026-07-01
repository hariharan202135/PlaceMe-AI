import mongoose, { Schema, Document } from 'mongoose';

export interface ICodingTestCase {
  input: string;
  output: string;
  isHidden: boolean;
}

export interface IQuestion extends Document {
  category: mongoose.Types.ObjectId;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'MCQ' | 'Coding';
  questionText: string;
  options?: string[]; // for MCQ
  correctOption?: number; // for MCQ (0-indexed index of options)
  codingTestCases?: ICodingTestCase[]; // for Coding
  explanation?: string;
  companyTags?: string[]; // ['TCS', 'Infosys', etc.]
  codingDomain?: string;
  codingSetIndex?: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema: Schema = new Schema(
  {
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    topic: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    type: { type: String, enum: ['MCQ', 'Coding'], required: true },
    questionText: { type: String, required: true },
    options: [{ type: String }],
    correctOption: { type: Number },
    codingTestCases: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
        isHidden: { type: Boolean, default: false }
      }
    ],
    explanation: { type: String },
    companyTags: [{ type: String, trim: true }],
    codingDomain: { type: String, trim: true },
    codingSetIndex: { type: Number }
  },
  { timestamps: true }
);

export default mongoose.model<IQuestion>('Question', QuestionSchema);
