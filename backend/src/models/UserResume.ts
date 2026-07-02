import mongoose, { Schema, Document } from 'mongoose';

export interface IUserResume extends Document {
  user: mongoose.Types.ObjectId;
  template: 'classic' | 'modern' | 'minimal';
  name: string;
  role: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  photoUrl?: string;
  summary: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    duration: string;
    description: string;
  }[];
  projects: {
    title: string;
    technologies: string;
    description: string;
    link?: string;
  }[];
  education: {
    institution: string;
    degree: string;
    duration: string;
    grade?: string;
  }[];
  achievements: string[];
  certifications: string[];
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserResumeSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    template: { type: String, enum: ['classic', 'modern', 'minimal'], default: 'classic' },
    name: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    linkedin: { type: String },
    github: { type: String },
    photoUrl: { type: String },
    summary: { type: String, required: true },
    skills: [{ type: String }],
    experience: [
      {
        company: { type: String, required: true },
        role: { type: String, required: true },
        duration: { type: String, required: true },
        description: { type: String, required: true }
      }
    ],
    projects: [
      {
        title: { type: String, required: true },
        technologies: { type: String, required: true },
        description: { type: String, required: true },
        link: { type: String }
      }
    ],
    education: [
      {
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        duration: { type: String, required: true },
        grade: { type: String }
      }
    ],
    achievements: [{ type: String }],
    certifications: [{ type: String }],
    isPaid: { type: Boolean, default: false }
  },
  { timestamps: true }
);

UserResumeSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IUserResume>('UserResume', UserResumeSchema);
