import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parentCategory?: mongoose.Types.ObjectId | ICategory | null;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    parentCategory: { type: Schema.Types.ObjectId, ref: 'Category', default: null }
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>('Category', CategorySchema);
