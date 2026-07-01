import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  role: 'user' | 'admin';
  placementReadinessScore: number;
  aptitudeScore: number;
  codingScore: number;
  hrScore: number;
  resumeScore: number;
  streak: number;
  lastActive: Date;
  subscription: {
    plan: 'Free' | 'Monthly' | 'Yearly';
    status: 'active' | 'inactive' | 'cancelled';
    razorpaySubscriptionId?: string;
    currentPeriodEnd?: Date;
  };
  bookmarks: mongoose.Types.ObjectId[];
  resumeDownloadsCount: number;
  paidResumeDownloadsBalance: number;
  unlockedCodingSets: string[];
  solvedQuestions: mongoose.Types.ObjectId[];
  attemptedQuestions: mongoose.Types.ObjectId[];
  viewedQuestions: mongoose.Types.ObjectId[];
  lastViewedQuestion?: mongoose.Types.ObjectId;
  lastViewedCompany?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    googleId: { type: String },
    avatar: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    placementReadinessScore: { type: Number, default: 0 },
    aptitudeScore: { type: Number, default: 0 },
    codingScore: { type: Number, default: 0 },
    hrScore: { type: Number, default: 0 },
    resumeScore: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    subscription: {
      plan: { type: String, enum: ['Free', 'Monthly', 'Yearly'], default: 'Free' },
      status: { type: String, enum: ['active', 'inactive', 'cancelled'], default: 'inactive' },
      razorpaySubscriptionId: { type: String },
      currentPeriodEnd: { type: Date }
    },
    bookmarks: [{ type: Schema.Types.ObjectId, ref: 'Question', default: [] }],
    resumeDownloadsCount: { type: Number, default: 0 },
    paidResumeDownloadsBalance: { type: Number, default: 0 },
    unlockedCodingSets: [{ type: String, default: [] }],
    solvedQuestions: [{ type: Schema.Types.ObjectId, ref: 'Question', default: [] }],
    attemptedQuestions: [{ type: Schema.Types.ObjectId, ref: 'Question', default: [] }],
    viewedQuestions: [{ type: Schema.Types.ObjectId, ref: 'Question', default: [] }],
    lastViewedQuestion: { type: Schema.Types.ObjectId, ref: 'Question' },
    lastViewedCompany: { type: String }
  },
  { timestamps: true }
);

// Middleware to calculate placement readiness score dynamically if needed, 
// or update average of other sub-scores: (aptitude + coding + hr + resume) / 4
UserSchema.pre('save', function (next) {
  const user = this as any;
  if (
    user.isModified('aptitudeScore') ||
    user.isModified('codingScore') ||
    user.isModified('hrScore') ||
    user.isModified('resumeScore')
  ) {
    const scores = [user.aptitudeScore, user.codingScore, user.hrScore, user.resumeScore];
    const nonZeroScores = scores.filter(s => s > 0);
    user.placementReadinessScore = nonZeroScores.length > 0 
      ? Math.round(nonZeroScores.reduce((a, b) => a + b, 0) / nonZeroScores.length)
      : 0;
  }
  next();
});

export default mongoose.model<IUser>('User', UserSchema);
