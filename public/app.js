// public/app.js

// Automatically use the same origin as the backend
const API_BASE = window.location.origin;

// Store token and user info in memory and in localStorage (demo only)
let authToken = null;
let currentUser = null;

// DOM elements
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');

const patientForm = document.getElementById('patientForm');
const loadPatientsBtn = document.getElementById('loadPatientsBtn');
const patientListDiv = document.getElementById('patientList');

const recordForm = document.getElementById('recordForm');
const recordPatientSelect = document.getElementById('recordPatientSelect');
const viewPatientSelect = document.getElementById('viewPatientSelect');
const loadRecordsBtn = document.getElementById('loadRecordsBtn');
const recordsListDiv = document.getElementById('recordsList');

const currentUserNameSpan = document.getElementById('currentUserName');
const currentUserRoleSpan = document.getElementById('currentUserRole');

const statusMessageDiv = document.getElementById('statusMessage');

// Helpers
function setStatus(message, isError = false) {
  if (!message) {
    statusMessageDiv.style.display = 'none';
    return;
  }
  statusMessageDiv.textContent = message;
  statusMessageDiv.className = isError ? 'error' : 'ok';
}

function setAuthenticated(isAuth) {
  if (isAuth && currentUser && authToken) {
    authSection.style.display = 'none';
    appSection.style.display = 'block';
    currentUserNameSpan.textContent = currentUser.name;
    currentUserRoleSpan.textContent = currentUser.role;
  } else {
    authSection.style.display = 'block';
    appSection.style.display = 'none';
    authToken = null;
    currentUser = null;
  }
}

// Load auth state from localStorage on page load
function loadAuthFromStorage() {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  if (storedToken && storedUser) {
    try {
      authToken = storedToken;
      currentUser = JSON.parse(storedUser);
      setAuthenticated(true);
      refreshPatientsList(); // load initial patients
    } catch (e) {
      console.error('Error parsing stored user:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
}

// API helper with Authorization header
async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = options.headers || {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  headers['Content-Type'] = 'application/json';

  const response = await fetch(url, { ...options, headers });
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // ignore parse errors
  }
  if (!response.ok) {
    const msg = (data && data.message) || `HTTP ${response.status}`;
    throw new Error(msg);
  }
  return data;
}

// AUTH HANDLERS

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('Logging in...');
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    authToken = data.token;
    currentUser = data.user;

    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(currentUser));

    setAuthenticated(true);
    setStatus('Login successful.');
    refreshPatientsList();
  } catch (err) {
    console.error('Login error:', err);
    setStatus(`Login failed: ${err.message}`, true);
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('Registering...');

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;

  try {
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    setStatus('Registration successful. You can now log in.');
  } catch (err) {
    console.error('Register error:', err);
    setStatus(`Registration failed: ${err.message}`, true);
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setAuthenticated(false);
  setStatus('Logged out.');
});

// PATIENTS

patientForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('Saving patient...');

  const patient = {
    firstName: document.getElementById('patientFirstName').value.trim(),
    lastName: document.getElementById('patientLastName').value.trim(),
    dob: document.getElementById('patientDob').value,
    gender: document.getElementById('patientGender').value,
    phone: document.getElementById('patientPhone').value.trim(),
    address: document.getElementById('patientAddress').value.trim(),
  };

  try {
    await apiRequest('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
    setStatus('Patient saved.');
    patientForm.reset();
    refreshPatientsList();
  } catch (err) {
    console.error('Create patient error:', err);
    setStatus(`Failed to save patient: ${err.message}`, true);
  }
});

loadPatientsBtn.addEventListener('click', () => {
  refreshPatientsList();
});

async function refreshPatientsList() {
  try {
    const patients = await apiRequest('/api/patients', { method: 'GET' });
    renderPatients(patients);
    populatePatientSelects(patients);
  } catch (err) {
    console.error('Get patients error:', err);
    setStatus(`Failed to load patients: ${err.message}`, true);
  }
}

function renderPatients(patients) {
  if (!patients || patients.length === 0) {
    patientListDiv.innerHTML = '<p>No patients found.</p>';
    return;
  }
  const items = patients
    .map(
      (p) =>
        `<div class="patient-item">
          <strong>${p.firstName} ${p.lastName}</strong>
          <br/>ID: ${p._id}
          <br/>DOB: ${p.dob ? p.dob.substring(0, 10) : 'N/A'}
        </div>`
    )
    .join('');
  patientListDiv.innerHTML = items;
}

function populatePatientSelects(patients) {
  const selects = [recordPatientSelect, viewPatientSelect];
  selects.forEach((sel) => {
    const current = sel.value;
    sel.innerHTML = '<option value="">Select patient</option>';
    patients.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p._id;
      opt.textContent = `${p.firstName} ${p.lastName} (${p._id.slice(-6)})`;
      sel.appendChild(opt);
    });
    // Try to preserve selection if still present
    if (current) {
      sel.value = current;
    }
  });
}

// MEDICAL RECORDS

recordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('Saving medical record...');

  const patientId = recordPatientSelect.value;
  const recordType = document.getElementById('recordType').value.trim();
  const summary = document.getElementById('recordSummary').value.trim();
  const data = document.getElementById('recordData').value.trim();

  if (!patientId) {
    setStatus('Please select a patient.', true);
    return;
  }

  try {
    await apiRequest('/api/records', {
      method: 'POST',
      body: JSON.stringify({ patientId, recordType, summary, data }),
    });
    setStatus('Medical record saved.');
    recordForm.reset();
  } catch (err) {
    console.error('Create record error:', err);
    setStatus(`Failed to save record: ${err.message}`, true);
  }
});

loadRecordsBtn.addEventListener('click', async () => {
  const patientId = viewPatientSelect.value;
  if (!patientId) {
    setStatus('Please select a patient to view records.', true);
    return;
  }
  setStatus('Loading records...');
  try {
    const records = await apiRequest(`/api/records/patient/${patientId}`, {
      method: 'GET',
    });
    renderRecords(records);
    setStatus('Records loaded.');
  } catch (err) {
    console.error('Get records error:', err);
    setStatus(`Failed to load records: ${err.message}`, true);
  }
});

function renderRecords(records) {
  if (!records || records.length === 0) {
    recordsListDiv.innerHTML = '<p>No records found.</p>';
    return;
  }
  const items = records
    .map((r) => {
      const createdAt = r.createdAt ? r.createdAt.substring(0, 19).replace('T', ' ') : '';
      const creator = r.createdBy
        ? `${r.createdBy.name} (${r.createdBy.role})`
        : 'Unknown';
      return `<div class="record-item">
        <div><strong>Type:</strong> ${r.recordType}</div>
        <div><strong>Summary:</strong> ${r.summary || 'N/A'}</div>
        <div><strong>Details:</strong> ${r.data}</div>
        <div><strong>By:</strong> ${creator}</div>
        <div><strong>Created:</strong> ${createdAt}</div>
      </div>`;
    })
    .join('');
  recordsListDiv.innerHTML = items;
}

// INIT
loadAuthFromStorage();
setAuthenticated(!!authToken);