const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { prisma } = require('../config/prisma');
const authUtils = require('../utils/authUtils');

// Registro
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashedPassword = await authUtils.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        preferences: {
          create: {} // cria default automaticamente
        }
      }
    });

    const token = authUtils.generateToken({ userId: user.id, email: user.email });
    const refreshToken = authUtils.generateRefreshToken({ userId: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: authUtils.sanitizeUser(user),
      token,
      refreshToken
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await authUtils.comparePasswords(password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = authUtils.generateToken({ userId: user.id, email: user.email });
    const refreshToken = authUtils.generateRefreshToken({ userId: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    res.json({
      message: 'Login bem-sucedido',
      user: authUtils.sanitizeUser(user),
      token,
      refreshToken
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Refresh Token
exports.refresh = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { refreshToken } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: { refreshToken }
    });

    if (!user) {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    const token = authUtils.generateToken({ userId: user.id, email: user.email });

    res.json({
      message: 'Token renovado',
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Logout
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      await prisma.user.updateMany({
        where: { refreshToken },
        data: { refreshToken: null }
      });
    }

    res.json({ message: 'Logout realizado com sucesso' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Não revelar se o email existe ou não por segurança
      return res.json({ message: 'Se o email existir, um link de redefinição foi enviado' });
    }

    const resetToken = authUtils.generateResetToken({ userId: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires: new Date(Date.now() + 3600000) // 1 hora
      }
    });

    // Simular envio de email
    console.log(`Email enviado para ${email}: Link de redefinição: ${resetToken}`);

    res.json({ message: 'Se o email existir, um link de redefinição foi enviado' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, resetToken: token }
    });

    if (!user || user.resetTokenExpires < new Date()) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    const hashedPassword = await authUtils.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      }
    });

    res.json({ message: 'Senha redefinida com sucesso' });

  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Token inválido' });
  }
};