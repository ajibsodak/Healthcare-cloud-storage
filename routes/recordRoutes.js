// routes/recordRoutes.js
const express = require('express');

const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const permit = require('../middleware/roles');
const { encrypt, decrypt } = require('../utils/crypto');

const router = express.Router();

// Create a new medical record for a patient
router.post('/', auth, permit('doctor', 'nurse', 'admin'), async (req, res) => {
  try {
    const { patientId, recordType, summary, data } = req.body;

    if (!patientId || !recordType || !data) {
      return res.status(400).json({ message: 'patientId, recordType, and data are required' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const encryptedData = encrypt(data);

    const record = await MedicalRecord.create({
      patient: patientId,
      createdBy: req.user._id,
      recordType,
      summary,
      encryptedData,
    });

    res.status(201).json({
      message: 'Record created',
      recordId: record._id,
    });
  } catch (err) {
    console.error('Create record error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all records for a patient (decrypted)
router.get('/patient/:patientId', auth, permit('doctor', 'nurse', 'admin'), async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const records = await MedicalRecord.find({ patient: patientId })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    // Decrypt data before sending
    const result = records.map((rec) => ({
      id: rec._id,
      patient: rec.patient,
      createdBy: rec.createdBy,
      recordType: rec.recordType,
      summary: rec.summary,
      data: decrypt(rec.encryptedData),
      createdAt: rec.createdAt,
    }));

    res.json(result);
  } catch (err) {
    console.error('Get records error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;