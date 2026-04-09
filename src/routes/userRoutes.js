const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { prisma } = require('../config/prisma');

const router = express.Router();

// GET /users/me - Obter dados do usuário autenticado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId || req.user.id },
      include: { preferences: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// PUT /users/me - Atualizar dados do usuário
router.put('/me', authMiddleware, [
  body('name').optional().isString().notEmpty(),
  body('phone').optional().isMobilePhone('pt-BR')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.userId || req.user.id;
    const { name, phone } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone })
      },
      include: { preferences: true }
    });

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// DELETE /users/me - Deletar conta do usuário
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Deletar preferências associadas
    await prisma.userPreference.deleteMany({
      where: { userId }
    });

    // Deletar usuário
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'Conta deletada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar conta' });
  }
});

// PUT /users/me/preferences - Atualizar preferências do usuário
router.put('/me/preferences', authMiddleware, [
  body('language').optional().isString().isIn(['pt-BR', 'en', 'es']),
  body('currency').optional().isString().isIn(['BRL', 'USD', 'EUR']),
  body('timezone').optional().isString(),
  body('chatbotTone').optional().isString(),
  body('notificationsEnabled').optional().custom(value => {
    if (typeof value !== 'boolean') {
      throw new Error('notificationsEnabled deve ser um booleano');
    }
    return true;
  })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.userId || req.user.id;
    const { language, currency, timezone, chatbotTone, notificationsEnabled } = req.body;

    const updatedPreferences = await prisma.userPreference.update({
      where: { userId },
      data: {
        ...(language && { language }),
        ...(currency && { currency }),
        ...(timezone && { timezone }),
        ...(chatbotTone !== undefined && { chatbotTone }),
        ...(notificationsEnabled !== undefined && { notificationsEnabled })
      }
    });

    res.json({
      message: 'Preferências atualizadas com sucesso',
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar preferências' });
  }
});

module.exports = router;