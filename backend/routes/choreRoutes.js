const express = require("express")
const Chore = require("../models/Chore")
const auth = require("../middleware/auth")

const router = express.Router()

// Get all chores for household
router.get("/", auth, async (req, res) => {
  try {
    if (!req.user.householdId) {
      return res.status(400).json({ message: "You are not part of any household" })
    }

    const chores = await Chore.find({ householdId: req.user.householdId })
      .populate("assignedTo", "fullName email")
      .populate("completedBy", "fullName email")
      .sort({ dueDate: 1 })

    res.json(chores)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create new chore
router.post("/", auth, async (req, res) => {
  try {
    if (!req.user.householdId) {
      return res.status(400).json({ message: "You are not part of any household" })
    }

    const { title, description, assignedTo, dueDate, priority, category } = req.body

    const chore = new Chore({
      title,
      description,
      assignedTo,
      dueDate,
      priority,
      category,
      householdId: req.user.householdId,
    })

    await chore.save()
    await chore.populate("assignedTo", "fullName email")

    res.status(201).json({
      message: "Chore created successfully",
      chore,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update chore status
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body
    const chore = await Chore.findById(req.params.id)

    if (!chore) {
      return res.status(404).json({ message: "Chore not found" })
    }

    if (chore.householdId.toString() !== req.user.householdId.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    chore.status = status
    if (status === "completed") {
      chore.completedBy = req.user._id
      chore.completedDate = new Date()
    }

    await chore.save()
    await chore.populate("assignedTo", "fullName email")
    await chore.populate("completedBy", "fullName email")

    res.json({
      message: "Chore updated successfully",
      chore,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
