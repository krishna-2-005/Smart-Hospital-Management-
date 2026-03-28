const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");

// Book Appointment
router.post("/book", async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    await appointment.save();
    res.json({ message: "Appointment booked", appointment });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
