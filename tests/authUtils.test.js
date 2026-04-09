const jwt = require("jsonwebtoken");
const authUtils = require("../src/utils/authUtils");

describe("authUtils", () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "2d";
    process.env.JWT_REFRESH_EXPIRES_IN = "10d";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("getJwtSecret deve retornar o segredo do ambiente", () => {
    expect(authUtils.getJwtSecret()).toBe("test-secret");
  });

  it("getJwtSecret deve lançar erro quando JWT_SECRET não está definido", () => {
    const backup = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    expect(() => authUtils.getJwtSecret()).toThrow("JWT_SECRET não definido");

    process.env.JWT_SECRET = backup;
  });

  it("getJwtExpiresIn deve usar o valor do ambiente", () => {
    expect(authUtils.getJwtExpiresIn()).toBe("2d");
  });

  it("getJwtExpiresIn deve usar o padrão quando não há variável de ambiente", () => {
    const backup = process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_EXPIRES_IN;

    expect(authUtils.getJwtExpiresIn()).toBe("7d");

    process.env.JWT_EXPIRES_IN = backup;
  });

  it("getRefreshTokenExpiresIn deve usar o padrão quando não há variável de ambiente", () => {
    const backup = process.env.JWT_REFRESH_EXPIRES_IN;
    delete process.env.JWT_REFRESH_EXPIRES_IN;

    expect(authUtils.getRefreshTokenExpiresIn()).toBe("30d");

    process.env.JWT_REFRESH_EXPIRES_IN = backup;
  });

  it("comparePasswords deve retornar false quando dados ausentes", async () => {
    expect(await authUtils.comparePasswords(null, null)).toBe(false);
  });

  it("generateToken deve criar JWT válido com payload correto", () => {
    const token = authUtils.generateToken({
      userId: 1,
      email: "teste@example.com",
    });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.userId).toBe(1);
    expect(decoded.email).toBe("teste@example.com");
  });

  it("generateRefreshToken deve criar refresh token válido", () => {
    const token = authUtils.generateRefreshToken({ userId: 5 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.userId).toBe(5);
  });

  it("generateResetToken deve criar token de redefinição com validade de 1 hora", () => {
    const token = authUtils.generateResetToken({ userId: 10 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.userId).toBe(10);
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  it("sanitizeUser deve remover campos sensíveis", () => {
    const user = {
      id: 1,
      email: "usuario@test.com",
      name: "Usuario",
      passwordHash: "hash",
      refreshToken: "refresh",
      resetToken: "reset",
      resetTokenExpires: new Date(),
    };

    const sanitized = authUtils.sanitizeUser(user);

    expect(sanitized).toEqual({
      id: 1,
      email: "usuario@test.com",
      name: "Usuario",
    });
  });

  it("buildAuthPayload deve retornar payload com user sanitizado e tokens", () => {
    const user = {
      id: 1,
      email: "usuario@test.com",
      name: "Usuario",
      passwordHash: "hash",
      refreshToken: "refresh",
    };

    const payload = authUtils.buildAuthPayload(user, "token123", "refresh123");

    expect(payload).toEqual({
      message: "Autenticação bem-sucedida",
      user: {
        id: 1,
        email: "usuario@test.com",
        name: "Usuario",
      },
      token: "token123",
      refreshToken: "refresh123",
    });
  });
});
