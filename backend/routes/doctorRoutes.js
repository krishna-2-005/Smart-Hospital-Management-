const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");

// Add Doctor
router.post("/add", async (req, res) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();
    res.json({ message: "Doctor added successfully", doctor });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
