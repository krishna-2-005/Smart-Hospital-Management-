const mongoose = require("mongoose");

const receptionistSchema = new mongoose.Schema({
  name: String,
  phone: String,
  shift: String
});

module.exports = mongoose.model("Receptionist", receptionistSchema);
