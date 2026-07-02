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
    name: { type: String },
    role: { type: String },
    email: { type: String },
    phone: { type: String },
    linkedin: { type: String },
    github: { type: String },
    photoUrl: { type: String },
    summary: { type: String },
    skills: [{ type: String }],
    experience: [
      {
        company: { type: String },
        role: { type: String },
        duration: { type: String },
        description: { type: String }
      }
    ],
    projects: [
      {
        title: { type: String },
        technologies: { type: String },
        description: { type: String },
        link: { type: String }
      }
    ],
    education: [
      {
        institution: { type: String },
        degree: { type: String },
        duration: { type: String },
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
