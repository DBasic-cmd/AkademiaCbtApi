const mongoose = require('mongoose');

const resultDetailSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  submittedAnswer: { type: String },
  correctAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  scoreAwarded: { type: Number, required: true }
});

const resultSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  regNo: { type: String, required: true },
  subject: { type: String, required: true },
  examYear: { type: String, required: true },
  totalQuestions: { type: Number, required: true },
  totalScore: { type: Number, required: true },
  results: [resultDetailSchema]
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
