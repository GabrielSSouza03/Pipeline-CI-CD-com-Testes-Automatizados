const jwt = require('jsonwebtoken');
const authUtils = require('../src/utils/authUtils');

describe('authUtils', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '2d';
    process.env.JWT_REFRESH_EXPIRES_IN = '10d';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('getJwtSecret deve retornar o segredo do ambiente', () => {
    expect(authUtils.getJwtSecret()).toBe('test-secret');
  });

  it('getJwtSecret deve lançar erro quando JWT_SECRET não está definido', () => {
    const backup = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    expect(() => authUtils.getJwtSecret()).toThrow('JWT_SECRET não definido');

    process.env.JWT_SECRET = backup;
  });

  it('getJwtExpiresIn deve usar o valor do ambiente', () => {
    expect(authUtils.getJwtExpiresIn()).toBe('2d');
  });

  it('getJwtExpiresIn deve usar o padrão quando não há variável de ambiente', () => {
    const backup = process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_EXPIRES_IN;

    expect(authUtils.getJwtExpiresIn()).toBe('7d');

    process.env.JWT_EXPIRES_IN = backup;
  });

});
