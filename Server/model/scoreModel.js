import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullname: { type: String },

    bigFive: {
      type: Object,
      default: {},
    },

    riasec: {
      type: Object,
      default: {},
    },

    careerPrediction: {
      type: Object,
      default: {},
    }
  },
  { timestamps: true }
);

const Score = mongoose.models.Score || mongoose.model("Score", scoreSchema);

export default Score;
