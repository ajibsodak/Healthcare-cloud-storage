// models/MedicalRecord.js
const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    recordType: { type: String, required: true, trim: true }, // e.g. "consultation", "lab", etc.
    summary: { type: String, trim: true }, // short summary (keep minimal PHI)

    // Full clinical details – stored encrypted
    encryptedData: { type: String, required: true },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
