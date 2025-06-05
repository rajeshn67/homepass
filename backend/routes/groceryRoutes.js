const express = require("express")
const GroceryList = require("../models/Grocery")
const auth = require("../middleware/auth")

const router = express.Router()

// Get grocery lists for household
router.get("/", auth, async (req, res) => {
  try {
    if (!req.user.householdId) {
      return res.status(400).json({ message: "You are not part of any household" })
    }

    const groceryLists = await GroceryList.find({ householdId: req.user.householdId })
      .populate("createdBy", "fullName email")
      .populate("items.purchasedBy", "fullName email")
      .sort({ createdAt: -1 })

    res.json(groceryLists)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create new grocery list
router.post("/", auth, async (req, res) => {
  try {
    if (!req.user.householdId) {
      return res.status(400).json({ message: "You are not part of any household" })
    }

    const { title, items } = req.body

    const groceryList = new GroceryList({
      title,
      items,
      householdId: req.user.householdId,
      createdBy: req.user._id,
    })

    await groceryList.save()
    await groceryList.populate("createdBy", "fullName email")

    res.status(201).json({
      message: "Grocery list created successfully",
      groceryList,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Add item to grocery list
router.post("/:id/items", auth, async (req, res) => {
  try {
    const { name, quantity, category, priority } = req.body
    const groceryList = await GroceryList.findById(req.params.id)

    if (!groceryList) {
      return res.status(404).json({ message: "Grocery list not found" })
    }

    if (groceryList.householdId.toString() !== req.user.householdId.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    groceryList.items.push({
      name,
      quantity,
      category,
      priority,
    })

    await groceryList.save()

    res.json({
      message: "Item added successfully",
      groceryList,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Mark item as purchased
router.put("/:listId/items/:itemId/purchase", auth, async (req, res) => {
  try {
    const groceryList = await GroceryList.findById(req.params.listId)

    if (!groceryList) {
      return res.status(404).json({ message: "Grocery list not found" })
    }

    if (groceryList.householdId.toString() !== req.user.householdId.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    const item = groceryList.items.id(req.params.itemId)
    if (!item) {
      return res.status(404).json({ message: "Item not found" })
    }

    item.purchased = true
    item.purchasedBy = req.user._id
    item.purchasedDate = new Date()

    await groceryList.save()
    await groceryList.populate("items.purchasedBy", "fullName email")

    res.json({
      message: "Item marked as purchased",
      groceryList,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
