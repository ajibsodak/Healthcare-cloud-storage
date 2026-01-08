// models/Patient.js
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true, default: 'Damaturu' },
    state: { type: String, trim: true, default: 'Yobe' },
    country: { type: String, trim: true, default: 'Nigeria' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
