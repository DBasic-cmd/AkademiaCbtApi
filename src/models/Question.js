const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true
    },
    examYear: {
      type: String,
      required: true
    },
    orderId: {
      type: Number,
      required: true
    },
    ask: {
      type: String,
      required: true
    },
    option1: String,
    option2: String,
    option3: String,
    option4: String,
    answer: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);