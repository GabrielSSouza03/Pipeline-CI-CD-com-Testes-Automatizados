const express = require('express');
const { body, param, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { prisma } = require('../config/prisma');

const router = express.Router();

// POST /accounts - Criar conta
router.post('/', authMiddleware, [
  body('name').notEmpty().isString().withMessage('Nome é obrigatório'),
  body('type').notEmpty().isIn(['WALLET', 'BANK', 'CREDIT_CARD', 'SAVINGS']).withMessage('Tipo de conta inválido'),
  body('initialBalance').optional().isFloat({ min: 0 }).withMessage('Saldo inicial deve ser >= 0')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, type, initialBalance } = req.body;
    const userId = req.user.userId || req.user.id;

    const account = await prisma.account.create({
      data: {
        name,
        type,
        initialBalance: initialBalance || 0,
        balance: initialBalance || 0,
        userId
      }
    });

    res.status(201).json({
      message: 'Conta criada com sucesso',
      account
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

// GET /accounts - Listar contas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const accounts = await prisma.account.findMany({
      where: { userId },
      include: { transactions: { select: { id: true } } }
    });

    res.json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar contas' });
  }
});

// GET /accounts/:id - Obter conta específica
router.get('/:id', authMiddleware, [
  param('id').isUUID().withMessage('ID inválido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;

    const account = await prisma.account.findFirst({
      where: { id, userId },
      include: { transactions: true }
    });

    if (!account) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    res.json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar conta' });
  }
});

// PUT /accounts/:id - Atualizar conta
router.put('/:id', authMiddleware, [
  param('id').isUUID().withMessage('ID inválido'),
  body('name').optional().isString().notEmpty().withMessage('Nome deve ser uma string'),
  body('type').optional().isIn(['WALLET', 'BANK', 'CREDIT_CARD', 'SAVINGS']).withMessage('Tipo de conta inválido'),
  body('status').optional().custom(value => {
    if (typeof value !== 'boolean') {
      throw new Error('Status deve ser um booleano');
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
    const { id } = req.params;
    const { name, type, status } = req.body;

    // Verificar se conta pertence ao usuário
    const account = await prisma.account.findFirst({
      where: { id, userId }
    });

    if (!account) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(status !== undefined && { status })
      }
    });

    res.json({
      message: 'Conta atualizada com sucesso',
      account: updatedAccount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar conta' });
  }
});

// DELETE /accounts/:id - Deletar conta
router.delete('/:id', authMiddleware, [
  param('id').isUUID().withMessage('ID inválido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;

    // Verificar se conta pertence ao usuário
    const account = await prisma.account.findFirst({
      where: { id, userId }
    });

    if (!account) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    // Verificar se tem transações
    const transactions = await prisma.transaction.findMany({
      where: { accountId: id }
    });

    if (transactions.length > 0) {
      return res.status(400).json({
        error: 'Não é possível deletar conta com transações associadas',
        transactionCount: transactions.length
      });
    }

    // Deletar conta
    await prisma.account.delete({
      where: { id }
    });

    res.json({ message: 'Conta deletada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar conta' });
  }
});

module.exports = router;