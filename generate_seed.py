import re

text = open("extracted_answers.txt", "r", encoding="utf-8").read()

# Stop parsing when "Hints and Solutions" is reached to avoid matching anything else
if "Hints and Solutions" in text:
    text = text.split("Hints and Solutions")[0]

matches = re.findall(r"(\d+)\.\s*\((\d)\)", text)

option_map = {"1": "A", "2": "B", "3": "C", "4": "D"}

questions = []
for q_num, opt in matches:
    if int(q_num) > 200:
        continue
    questions.append({
        "questionNumber": int(q_num),
        "correctOption": option_map[opt]
    })

# deduplicate and sort by question number
questions_dict = {q["questionNumber"]: q["correctOption"] for q in questions}
sorted_questions = [{"questionNumber": k, "correctOption": v} for k, v in sorted(questions_dict.items())]

js_code = f"""require('dotenv').config({{ path: './.env' }});
const mongoose = require('mongoose');
const CBTTest = require('./models/CBTTest');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/acadmix')
  .then(async () => {{
    console.log('Connected to DB');
    const newTest = new CBTTest({{
      title: 'AAKASH FT-01 (CODE - B) Fortnighty Test Series',
      description: 'AAKASH FT-01 Fortnightly Test Series for NEET - 2027 (XII PASSED) PH-2',
      exam: 'NEET',
      subject: 'Mock Test',
      pdfUrl: 'http://localhost:5000/uploads/AAKASH_FT-01_B.pdf',
      durationMinutes: 180,
      questions: {sorted_questions}
    }});
    const saved = await newTest.save();
    console.log('Test created successfully:', saved._id);
    process.exit(0);
  }})
  .catch(err => {{
    console.error('Error:', err);
    process.exit(1);
  }});
"""

with open("server/seed_aakash.js", "w", encoding="utf-8") as f:
    f.write(js_code)

print(f"Generated server/seed_aakash.js with {len(sorted_questions)} questions.")
