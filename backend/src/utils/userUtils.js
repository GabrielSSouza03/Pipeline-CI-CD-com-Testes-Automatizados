// src/utils/userUtils.js

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

function isValidPhoneBR(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

function validateUpdateUserData(data) {
  const errors = [];

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
    errors.push('Nome deve ser string não vazio');
  }

  if (data.phone !== undefined && !isValidPhoneBR(data.phone)) {
    errors.push('Telefone inválido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validatePreferencesData(data) {
  const errors = [];

  const validLanguages = ['pt-BR', 'en', 'es'];
  const validCurrencies = ['BRL', 'USD', 'EUR'];

  if (data.language !== undefined && !validLanguages.includes(data.language)) {
    errors.push('Idioma inválido');
  }

  if (data.currency !== undefined && !validCurrencies.includes(data.currency)) {
    errors.push('Moeda inválida');
  }

  if (data.notificationsEnabled !== undefined && typeof data.notificationsEnabled !== 'boolean') {
    errors.push('notificationsEnabled deve ser booleano');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function formatPreferences(preferences) {
  if (!preferences || typeof preferences !== 'object') {
    return null;
  }

  return preferences;
}

function buildUserPayload(user, preferences) {
  return {
    user: sanitizeUser(user),
    preferences: formatPreferences(preferences)
  };
}

module.exports = {
  sanitizeUser,
  isValidPhoneBR,
  validateUpdateUserData,
  validatePreferencesData,
  formatPreferences,
  buildUserPayload
};
