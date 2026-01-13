import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullname: { type: String },

    bigFive: {
      E_score: { type: Number, min: 0, max: 1, default: null },
      N_score: { type: Number, min: 0, max: 1, default: null },
      A_score: { type: Number, min: 0, max: 1, default: null },
      C_score: { type: Number, min: 0, max: 1, default: null },
      O_score: { type: Number, min: 0, max: 1, default: null }
    },

    riasec: {
      R: { type: Number, min: 0, max: 1, default: null },          // Realistic
      I: { type: Number, min: 0, max: 1, default: null },          // Investigative
      A: { type: Number, min: 0, max: 1, default: null },          // Artistic
      S: { type: Number, min: 0, max: 1, default: null },          // Social
      E: { type: Number, min: 0, max: 1, default: null },          // Enterprising
      C: { type: Number, min: 0, max: 1, default: null },          // Conventional
      holland_code: { type: String, maxlength: 3, default: null }  // 3-letter code
    },

    careerPrediction: {
      recommended_career: { type: String, default: null },
      all_jobs_confidences: {
        type: Map,
        of: Number,
        default: new Map()
      },
      breakdown: {
        personality_model: {
          type: Map,
          of: Number,
          default: new Map()
        },
        reading_model: {
          type: Map,
          of: Number,
          default: new Map()
        }
      },
      timestamp: { type: Date, default: Date.now }
    }
  },
  { timestamps: true }
);

const Score = mongoose.models.Score || mongoose.model("Score", scoreSchema);

export default Score;
