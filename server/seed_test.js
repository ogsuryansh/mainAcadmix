require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const CBTTest = require('./models/CBTTest');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/acadmix')
  .then(async () => {
    console.log('Connected to DB');
    const newTest = new CBTTest({
      title: 'AAKASH FT-01 (CODE - B) - 10 Questions Test',
      description: 'Test paper for verification with 10 questions.',
      exam: 'NEET',
      subject: 'Mock Test',
      pdfUrl: 'http://localhost:5000/uploads/test_paper.pdf',
      durationMinutes: 30,
      questions: [
        { questionNumber: 1, correctOption: 'C' },
        { questionNumber: 2, correctOption: 'A' },
        { questionNumber: 3, correctOption: 'D' },
        { questionNumber: 4, correctOption: 'D' },
        { questionNumber: 5, correctOption: 'B' },
        { questionNumber: 6, correctOption: 'B' },
        { questionNumber: 7, correctOption: 'A' },
        { questionNumber: 8, correctOption: 'A' },
        { questionNumber: 9, correctOption: 'D' },
        { questionNumber: 10, correctOption: 'A' }
      ]
    });
    const saved = await newTest.save();
    console.log('Test created successfully:', saved._id);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
