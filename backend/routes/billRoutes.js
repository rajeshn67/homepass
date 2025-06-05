const express = require("express")
const Bill = require("../models/Bill")
const auth = require("../middleware/auth")

const router = express.Router()

// Get all bills for household
router.get("/", auth, async (req, res) => {
  try {
    if (!req.user.householdId) {
      return res.status(400).json({ message: "You are not part of any household" })
    }

    const bills = await Bill.find({ householdId: req.user.householdId })
      .populate("assignedTo", "fullName email")
      .populate("paidBy", "fullName email")
      .sort({ dueDate: 1 })

    res.json(bills)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create new bill
router.post("/", auth, async (req, res) => {
  try {
    if (!req.user.householdId) {
      return res.status(400).json({ message: "You are not part of any household" })
    }

    const { title, amount, dueDate, category, assignedTo } = req.body

    const bill = new Bill({
      title,
      amount,
      dueDate,
      category,
      assignedTo,
      householdId: req.user.householdId,
    })

    await bill.save()
    await bill.populate("assignedTo", "fullName email")

    res.status(201).json({
      message: "Bill created successfully",
      bill,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update bill status
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body
    const bill = await Bill.findById(req.params.id)

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" })
    }

    if (bill.householdId.toString() !== req.user.householdId.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    bill.status = status
    if (status === "paid") {
      bill.paidBy = req.user._id
      bill.paidDate = new Date()
    }

    await bill.save()
    await bill.populate("assignedTo", "fullName email")
    await bill.populate("paidBy", "fullName email")

    res.json({
      message: "Bill updated successfully",
      bill,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete bill
router.delete("/:id", auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" })
    }

    if (bill.householdId.toString() !== req.user.householdId.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    await Bill.findByIdAndDelete(req.params.id)

    res.json({ message: "Bill deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
