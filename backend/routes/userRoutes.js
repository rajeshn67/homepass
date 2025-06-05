const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const Household = require("../models/Household")
const auth = require("../middleware/auth")

const router = express.Router()

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, "Parth@2004", { expiresIn: "7d" })
}

// Generate random invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Create user
    const user = new User({
      fullName,
      email,
      password,
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        householdId: user.householdId,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Generate token
    const token = generateToken(user._id)

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        householdId: user.householdId,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").populate("householdId")
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get household details with all members
router.get("/household-details", auth, async (req, res) => {
  try {
    if (!req.user.householdId) {
      return res.status(400).json({ message: "You are not part of any household" })
    }

    const household = await Household.findById(req.user.householdId)
      .populate({
        path: "members",
        select: "fullName email role createdAt",
      })
      .populate({
        path: "admin",
        select: "fullName email",
      })

    if (!household) {
      return res.status(404).json({ message: "Household not found" })
    }

    // Get additional stats for each member
    const membersWithStats = await Promise.all(
      household.members.map(async (member) => {
        try {
          // Get member's bills, chores, and expenses
          const [bills, chores, expenses] = await Promise.all([
            require("../models/Bill").countDocuments({ assignedTo: member._id }),
            require("../models/Chore").countDocuments({ assignedTo: member._id }),
            require("../models/Expense").countDocuments({ paidBy: member._id }),
          ])

          return {
            _id: member._id,
            fullName: member.fullName,
            email: member.email,
            role: member.role,
            joinedAt: member.createdAt,
            stats: {
              totalBills: bills,
              totalChores: chores,
              totalExpenses: expenses,
            },
          }
        } catch (error) {
          console.error("Error getting member stats:", error)
          return {
            _id: member._id,
            fullName: member.fullName,
            email: member.email,
            role: member.role,
            joinedAt: member.createdAt,
            stats: {
              totalBills: 0,
              totalChores: 0,
              totalExpenses: 0,
            },
          }
        }
      }),
    )

    res.json({
      _id: household._id,
      name: household.name,
      description: household.description,
      inviteCode: household.inviteCode,
      createdAt: household.createdAt,
      admin: household.admin,
      members: membersWithStats,
      memberCount: household.members.length,
    })
  } catch (error) {
    console.error("Get household details error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create household
router.post("/create-household", auth, async (req, res) => {
  try {
    const { name, description } = req.body

    // Check if user is already in a household
    if (req.user.householdId) {
      return res.status(400).json({ message: "You are already in a household" })
    }

    // Generate unique invite code
    let inviteCode
    let isUnique = false
    while (!isUnique) {
      inviteCode = generateInviteCode()
      const existingHousehold = await Household.findOne({ inviteCode })
      if (!existingHousehold) {
        isUnique = true
      }
    }

    const household = new Household({
      name,
      description,
      admin: req.user._id,
      members: [req.user._id],
      inviteCode,
    })

    await household.save()

    // Update user's household and role
    await User.findByIdAndUpdate(req.user._id, {
      householdId: household._id,
      role: "admin",
    })

    res.status(201).json({
      message: "Household created successfully",
      household: {
        id: household._id,
        name: household.name,
        description: household.description,
        inviteCode: household.inviteCode,
        admin: household.admin,
        members: household.members,
      },
      inviteCode,
    })
  } catch (error) {
    console.error("Create household error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Join household
router.post("/join-household", auth, async (req, res) => {
  try {
    const { inviteCode } = req.body

    if (!inviteCode) {
      return res.status(400).json({ message: "Invite code is required" })
    }

    const household = await Household.findOne({ inviteCode })
    if (!household) {
      return res.status(404).json({ message: "Invalid invite code" })
    }

    // Check if user is already in a household
    if (req.user.householdId) {
      return res.status(400).json({ message: "You are already in a household" })
    }

    // Check if user is already a member of this household
    if (household.members.includes(req.user._id)) {
      return res.status(400).json({ message: "You are already a member of this household" })
    }

    // Add user to household
    household.members.push(req.user._id)
    await household.save()

    // Update user's household
    await User.findByIdAndUpdate(req.user._id, {
      householdId: household._id,
      role: "member",
    })

    res.json({
      message: "Successfully joined household",
      household: {
        id: household._id,
        name: household.name,
        description: household.description,
        inviteCode: household.inviteCode,
        admin: household.admin,
        members: household.members,
      },
    })
  } catch (error) {
    console.error("Join household error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Leave household
router.post("/leave-household", auth, async (req, res) => {
  try {
    if (!req.user.householdId) {
      return res.status(400).json({ message: "You are not in any household" })
    }

    const household = await Household.findById(req.user.householdId)
    if (!household) {
      return res.status(404).json({ message: "Household not found" })
    }

    // Check if user is admin
    if (household.admin.toString() === req.user._id.toString()) {
      // If admin is leaving and there are other members, transfer admin to first member
      if (household.members.length > 1) {
        const newAdmin = household.members.find((member) => member.toString() !== req.user._id.toString())
        household.admin = newAdmin
        await User.findByIdAndUpdate(newAdmin, { role: "admin" })
      } else {
        // If admin is the only member, delete the household
        await Household.findByIdAndDelete(household._id)
      }
    }

    if (household.members.length > 1) {
      // Remove user from household members
      household.members = household.members.filter((member) => member.toString() !== req.user._id.toString())
      await household.save()
    }

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      householdId: null,
      role: "member",
    })

    res.json({ message: "Successfully left household" })
  } catch (error) {
    console.error("Leave household error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
