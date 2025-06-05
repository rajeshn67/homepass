const express = require("express")
const Expense = require("../models/Expense")
const auth = require("../middleware/auth")

const router = express.Router()

// Get all expenses for household
router.get("/", auth, async (req, res) => {
  try {
    if (!req.user.householdId) {
      return res.status(400).json({ message: "You are not part of any household" })
    }

    const expenses = await Expense.find({ householdId: req.user.householdId })
      .populate("paidBy", "fullName email")
      .populate("splitBetween.user", "fullName email")
      .sort({ date: -1 })

    res.json(expenses)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create new expense
router.post("/", auth, async (req, res) => {
  try {
    if (!req.user.householdId) {
      return res.status(400).json({ message: "You are not part of any household" })
    }

    const { title, amount, category, description, splitBetween } = req.body

    const expense = new Expense({
      title,
      amount,
      category,
      description,
      paidBy: req.user._id,
      splitBetween,
      householdId: req.user.householdId,
    })

    await expense.save()
    await expense.populate("paidBy", "fullName email")
    await expense.populate("splitBetween.user", "fullName email")

    res.status(201).json({
      message: "Expense created successfully",
      expense,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get expense summary
router.get("/summary", auth, async (req, res) => {
  try {
    if (!req.user.householdId) {
      return res.status(400).json({ message: "You are not part of any household" })
    }

    const expenses = await Expense.find({ householdId: req.user.householdId })

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    // Calculate expenses by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {})

    // Calculate user balances
    const userBalances = {}
    expenses.forEach((expense) => {
      expense.splitBetween.forEach((split) => {
        const userId = split.user.toString()
        if (!userBalances[userId]) {
          userBalances[userId] = { owes: 0, owed: 0 }
        }

        if (expense.paidBy.toString() === userId) {
          userBalances[userId].owed += expense.amount - split.amount
        } else {
          userBalances[userId].owes += split.amount
        }
      })
    })

    res.json({
      totalExpenses,
      expensesByCategory,
      userBalances,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
