const userUtils = require('../src/utils/userUtils');

describe('userUtils', () => {
  describe('sanitizeUser', () => {
    it('deve remover campos sensíveis do usuário', () => {
      const user = {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@example.com',
        passwordHash: 'hashed-password',
        refreshToken: 'refresh-token',
        resetToken: 'reset-token',
        resetTokenExpires: new Date(),
        phone: '11999999999'
      };

      const sanitized = userUtils.sanitizeUser(user);

      expect(sanitized).toEqual({
        id: 'user-1',
        name: 'Ana',
        email: 'ana@example.com',
        phone: '11999999999'
      });
    });

    it('deve retornar null para entrada inválida', () => {
      expect(userUtils.sanitizeUser(null)).toBeNull();
      expect(userUtils.sanitizeUser(undefined)).toBeNull();
      expect(userUtils.sanitizeUser('string')).toBeNull();
    });
  });

  describe('isValidPhoneBR', () => {
    it('deve aceitar telefone com 10 ou 11 dígitos', () => {
      expect(userUtils.isValidPhoneBR('1133334444')).toBe(true);
      expect(userUtils.isValidPhoneBR('11999998888')).toBe(true);
      expect(userUtils.isValidPhoneBR('(11) 99999-8888')).toBe(true);
    });

    it('deve rejeitar telefones inválidos', () => {
      expect(userUtils.isValidPhoneBR('123')).toBe(false);
      expect(userUtils.isValidPhoneBR('')).toBe(false);
      expect(userUtils.isValidPhoneBR(null)).toBe(false);
      expect(userUtils.isValidPhoneBR(undefined)).toBe(false);
    });
  });

  describe('validateUpdateUserData', () => {
    it('deve validar nome e telefone corretos', () => {
      const result = userUtils.validateUpdateUserData({
        name: 'Ana',
        phone: '11999998888'
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar nome vazio', () => {
      const result = userUtils.validateUpdateUserData({
        name: '',
        phone: '11999998888'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nome deve ser string não vazio');
    });

    it('deve rejeitar telefone inválido', () => {
      const result = userUtils.validateUpdateUserData({
        name: 'Ana',
        phone: '123'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Telefone inválido');
    });

    it('deve aceitar objeto vazio', () => {
      const result = userUtils.validateUpdateUserData({});

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validatePreferencesData', () => {
    it('deve validar preferências corretas', () => {
      const result = userUtils.validatePreferencesData({
        language: 'pt-BR',
        currency: 'BRL',
        notificationsEnabled: true
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar idioma inválido', () => {
      const result = userUtils.validatePreferencesData({
        language: 'fr'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Idioma inválido');
    });

    it('deve rejeitar moeda inválida', () => {
      const result = userUtils.validatePreferencesData({
        currency: 'JPY'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Moeda inválida');
    });

    it('deve rejeitar notificationsEnabled não booleano', () => {
      const result = userUtils.validatePreferencesData({
        notificationsEnabled: 'true'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('notificationsEnabled deve ser booleano');
    });
  });

  describe('formatPreferences', () => {
    it('deve retornar preferences quando a entrada for válida', () => {
      const preferences = {
        language: 'pt-BR',
        currency: 'BRL',
        notificationsEnabled: true
      };

      expect(userUtils.formatPreferences(preferences)).toEqual(preferences);
    });

    it('deve retornar null para entrada inválida', () => {
      expect(userUtils.formatPreferences(null)).toBeNull();
      expect(userUtils.formatPreferences(undefined)).toBeNull();
      expect(userUtils.formatPreferences('string')).toBeNull();
    });
  });

  describe('buildUserPayload', () => {
    it('deve montar payload com usuário limpo e preferências', () => {
      const user = {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@example.com',
        passwordHash: 'hashed-password'
      };

      const preferences = {
        language: 'pt-BR',
        currency: 'BRL'
      };

      const payload = userUtils.buildUserPayload(user, preferences);

      expect(payload).toEqual({
        user: {
          id: 'user-1',
          name: 'Ana',
          email: 'ana@example.com'
        },
        preferences: {
          language: 'pt-BR',
          currency: 'BRL'
        }
      });
    });

    it('deve retornar null quando os dados forem inválidos', () => {
      const payload = userUtils.buildUserPayload(null, null);

      expect(payload).toEqual({
        user: null,
        preferences: null
      });
    });
  });
});
