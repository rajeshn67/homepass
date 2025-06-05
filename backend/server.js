const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Import routes
const userRoutes = require("./routes/userRoutes")
const billRoutes = require("./routes/billRoutes")
const groceryRoutes = require("./routes/groceryRoutes")
const choreRoutes = require("./routes/choreRoutes")
const expenseRoutes = require("./routes/expenseRoutes")

// Middleware
app.use(cors())
app.use(express.json())

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb+srv://firstweb:QxvLi1ggcSU9S5uP@firstweb.9iplm.mongodb.net/Homepass", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err))

// Routes
app.use("/api/users", userRoutes)
app.use("/api/bills", billRoutes)
app.use("/api/groceries", groceryRoutes)
app.use("/api/chores", choreRoutes)
app.use("/api/expenses", expenseRoutes)

// Basic route
app.get("/", (req, res) => {
  res.send("Homepass API is running")
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
