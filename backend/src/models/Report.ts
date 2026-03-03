import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  userId: mongoose.Types.ObjectId;
  textSnippet: string;
  fullText: string;
  label: string;
  classId: number;
  riskScore: number;
  confidence: number;
  probabilities: {
    no_risk: number;
    low_risk: number;
    high_risk: number;
  };
  source: 'text' | 'file';
  createdAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    textSnippet: { type: String, required: true },
    fullText: { type: String, required: true },
    label: { type: String, required: true },
    classId: { type: Number, required: true },
    riskScore: { type: Number, required: true },
    confidence: { type: Number, required: true },
    probabilities: {
      no_risk: { type: Number, default: 0 },
      low_risk: { type: Number, default: 0 },
      high_risk: { type: Number, default: 0 },
    },
    source: { type: String, enum: ['text', 'file'], default: 'text' },
  },
  { timestamps: true }
);

export default mongoose.model<IReport>('Report', ReportSchema);
