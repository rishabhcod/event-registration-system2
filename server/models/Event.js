const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  location: { type: String, required: true },
  totalSeats: { type: Number, required: true },
  availableSeats: { type: Number, required: true },
  registrations: [
    {
      name: String,
      email: String,
      ticketId: String,
    },
  ],
});

module.exports = mongoose.model("Event", eventSchema);
