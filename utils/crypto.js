// utils/crypto.js
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

// ENCRYPTION_KEY must be 32 bytes (64 hex chars)
const getKey = () => {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not set in environment');
  }
  return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
};

function encrypt(text) {
  if (!text) return null;

  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // store as iv:tag:data (all hex)
  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

function decrypt(payload) {
  if (!payload) return null;

  const [ivHex, tagHex, encryptedHex] = payload.split(':');
  const key = getKey();

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };