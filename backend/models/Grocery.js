const mongoose = require("mongoose")

const groceryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["fruits", "vegetables", "dairy", "meat", "grains", "snacks", "beverages", "other"],
    default: "other",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  purchased: {
    type: Boolean,
    default: false,
  },
  purchasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  purchasedDate: {
    type: Date,
  },
})

const groceryListSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: "Grocery List",
    },
    items: [groceryItemSchema],
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Household",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("GroceryList", groceryListSchema)
