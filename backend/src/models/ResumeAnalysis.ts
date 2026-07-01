import mongoose, { Schema, Document } from 'mongoose';

export interface IResumeAnalysis extends Document {
  user: mongoose.Types.ObjectId;
  fileName: string;
  atsScore: number;
  skillsIdentified: string[];
  education?: string;
  projects?: string[];
  internships?: string[];
  certifications?: string[];
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  suggestions: string[];
  interviewQuestions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ResumeAnalysisSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    atsScore: { type: Number, required: true },
    skillsIdentified: [{ type: String }],
    education: { type: String },
    projects: [{ type: String }],
    internships: [{ type: String }],
    certifications: [{ type: String }],
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    missingSkills: [{ type: String }],
    suggestions: [{ type: String }],
    interviewQuestions: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.model<IResumeAnalysis>('ResumeAnalysis', ResumeAnalysisSchema);
