const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  type:        { type: String, enum: ['notes', 'book', 'test_series'], required: true },
  subject:     { type: String, required: true }, // Physics, Chemistry, Biology, Maths
  exam:        { type: String, enum: ['NEET', 'JEE', 'Boards', 'All'], required: true },
  price:         { type: Number, required: true, min: 0 },
  originalPrice: { type: Number },
  isFree:        { type: Boolean, default: false },
  driveLink:     { type: String, default: '' }, // Google Drive link for free content
  thumbnail:     { type: String, default: '' },
  fileUrl:       { type: String, default: '' }, // PDF/resource URL (paid)
  rating:        { type: Number, default: 0, min: 0, max: 5 },
  ratingCount:   { type: Number, default: 0 },
  totalSales:    { type: Number, default: 0 },
  isActive:      { type: Boolean, default: true },
  isPublished:   { type: Boolean, default: true },
  isFeatured:    { type: Boolean, default: false },
  badge:         { type: String, default: '' }, // 'Bestseller', 'New', 'Top Rated'
  tags:          [{ type: String }],
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)
