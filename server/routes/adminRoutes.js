const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Event = require("../models/Event");
const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Admin login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res.json({ token });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

// Create new event (admin only)
router.post("/events", protectAdmin, async (req, res) => {
  const { name, date, location, totalSeats } = req.body;

  const event = new Event({
    name,
    date,
    location,
    totalSeats,
    availableSeats: totalSeats,
  });

  await event.save();
  res.json({ message: "Event created successfully", event });
});

module.exports = router;
