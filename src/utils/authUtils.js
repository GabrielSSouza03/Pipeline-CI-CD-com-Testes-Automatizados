const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const DEFAULT_JWT_EXPIRES_IN = '7d';
const DEFAULT_REFRESH_EXPIRES_IN = '30d';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não definido');
  }
  return secret;
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN;
}

function getRefreshTokenExpiresIn() {
  return process.env.JWT_REFRESH_EXPIRES_IN || DEFAULT_REFRESH_EXPIRES_IN;
}

async function hashPassword(password) {
  if (!password) {
    throw new Error('Senha é obrigatória');
  }
  return bcrypt.hash(password, 10);
}

async function comparePasswords(password, passwordHash) {
  if (!password || !passwordHash) {
    return false;
  }
  return bcrypt.compare(password, passwordHash);
}

function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn()
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getRefreshTokenExpiresIn()
  });
}

function generateResetToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '1h'
  });
}

function sanitizeUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const {
    passwordHash,
    refreshToken,
    resetToken,
    resetTokenExpires,
    ...safeUser
  } = user;

  return safeUser;
}

function buildAuthPayload(user, token, refreshToken) {
  return {
    message: 'Autenticação bem-sucedida',
    user: sanitizeUser(user),
    token,
    refreshToken
  };
}

module.exports = {
  getJwtSecret,
  getJwtExpiresIn,
  getRefreshTokenExpiresIn,
  hashPassword,
  comparePasswords,
  generateToken,
  generateRefreshToken,
  generateResetToken,
  sanitizeUser,
  buildAuthPayload
};
