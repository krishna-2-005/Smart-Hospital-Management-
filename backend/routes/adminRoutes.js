const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");

// Admin Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username, password });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful", admin });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
