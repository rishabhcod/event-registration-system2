const express = require("express");
const Event = require("../models/Event");
const router = express.Router();

// Get all events
router.get("/", async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

// Register for event
router.post("/:id/register", async (req, res) => {
  const { name, email } = req.body;
  const event = await Event.findById(req.params.id);

  if (!event) return res.status(404).json({ message: "Event not found" });
  if (event.availableSeats <= 0)
    return res.status(400).json({ message: "No seats available" });

  const ticketId = Math.random().toString(36).substring(2, 10);

  event.registrations.push({ name, email, ticketId });
  event.availableSeats -= 1;
  await event.save();

  res.json({ message: "Registered successfully", ticketId });
});

module.exports = router;
