const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Timing Logic
  startTime: { type: Date, required: true }, // e.g., 2026-04-20T09:00:00Z
  endTime: { type: Date, required: true }, // e.g., 2026-04-20T11:00:00Z
  duration: { type: Number, required: true }, // Duration in minutes (e.g., 60)

  // State Management
  isPublished: { type: Boolean, default: false }, // Teacher can draft first
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Exam", examSchema);
