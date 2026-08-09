const mongoose = require('mongoose')

const cbtQuestionSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true },
  correctOption: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
})

const cbtTestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  exam: { type: String, enum: ['NEET', 'JEE', 'Boards', 'All'], required: true },
  subject: { type: String, required: true },
  pdfUrl: { type: String, required: true }, // URL to the uploaded PDF
  questions: [cbtQuestionSchema],
  durationMinutes: { type: Number, default: 180 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('CBTTest', cbtTestSchema)
