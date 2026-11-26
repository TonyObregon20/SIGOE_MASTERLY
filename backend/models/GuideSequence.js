import mongoose from "mongoose";

const GuideSequenceSchema = new mongoose.Schema({
  _id: { type: String },
  lastNumber: { type: Number, required: true }
});

const GuideSequence = mongoose.models.GuideSequence || mongoose.model("GuideSequence", GuideSequenceSchema);
export default GuideSequence;
