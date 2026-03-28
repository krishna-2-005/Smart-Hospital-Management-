const express = require("express");
const router = express.Router();
const Receptionist = require("../models/Receptionist");

// Add Receptionist
router.post("/add", async (req, res) => {
  try {
    const receptionist = new Receptionist(req.body);
    await receptionist.save();
    res.json({ message: "Receptionist added", receptionist });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
