// routes/patientRoutes.js
const express = require('express');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const permit = require('../middleware/roles');

const router = express.Router();

// Create a new patient (doctor/nurse/admin)
router.post('/', auth, permit('doctor', 'nurse', 'admin'), async (req, res) => {
  try {
    const { firstName, lastName, dob, gender, phone, address, city, state, country } = req.body;

    if (!firstName || !lastName || !dob || !gender) {
      return res.status(400).json({ message: 'firstName, lastName, dob, and gender are required' });
    }

    const patient = await Patient.create({
      firstName,
      lastName,
      dob,
      gender,
      phone,
      address,
      city,
      state,
      country,
    });

    res.status(201).json(patient);
  } catch (err) {
    console.error('Create patient error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all patients (doctor/nurse/admin)
router.get('/', auth, permit('doctor', 'nurse', 'admin'), async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    console.error('Get patients error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single patient by ID
router.get('/:id', auth, permit('doctor', 'nurse', 'admin'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    console.error('Get patient error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;