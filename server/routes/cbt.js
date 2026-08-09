const express = require('express')
const router = express.Router()
const CBTTest = require('../models/CBTTest')
const { protect, adminOnly } = require('../middleware/auth')

// @route   GET /api/cbt
// @desc    Get all CBT tests
// @access  Public (or protected if you want)
router.get('/', async (req, res) => {
  try {
    const tests = await CBTTest.find({ isActive: true }).sort({ createdAt: -1 })
    res.json(tests)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route   GET /api/cbt/:id
// @desc    Get CBT test by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const test = await CBTTest.findById(req.params.id)
    if (!test) return res.status(404).json({ message: 'Test not found' })
    res.json(test)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// @route   POST /api/cbt
// @desc    Create a new CBT test
// @access  Admin
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const newTest = new CBTTest(req.body)
    const savedTest = await newTest.save()
    res.status(201).json(savedTest)
  } catch (err) {
    res.status(400).json({ message: 'Failed to create test', error: err.message })
  }
})

// @route   PUT /api/cbt/:id
// @desc    Update a CBT test
// @access  Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const updatedTest = await CBTTest.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updatedTest) return res.status(404).json({ message: 'Test not found' })
    res.json(updatedTest)
  } catch (err) {
    res.status(400).json({ message: 'Failed to update test', error: err.message })
  }
})

// @route   DELETE /api/cbt/:id
// @desc    Delete a CBT test
// @access  Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const test = await CBTTest.findByIdAndDelete(req.params.id)
    if (!test) return res.status(404).json({ message: 'Test not found' })
    res.json({ message: 'Test deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete test', error: err.message })
  }
})

module.exports = router
