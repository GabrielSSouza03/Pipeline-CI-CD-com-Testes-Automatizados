const express = require('express');
const { body, param, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { prisma } = require('../config/prisma');

const router = express.Router();

// POST /transactions - Criar transação
router.post('/', authMiddleware, [
  body('accountId').isUUID().withMessage('ID da conta inválido'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que 0'),
  body('type').isIn(['INCOME', 'EXPENSE', 'TRANSFER']).withMessage('Tipo de transação inválido'),
  body('categoryId').optional().isUUID().withMessage('ID da categoria inválido'),
  body('description').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { accountId, amount, type, categoryId, description } = req.body;
    const userId = req.user.userId || req.user.id;

    // Verificar se a conta pertence ao usuário
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId }
    });

    if (!account) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    // Verificar se a categoria existe e pertence ao usuário (se fornecida)
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId }
      });

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        accountId,
        amount,
        type,
        categoryId: categoryId || null,
        description,
        transactionDate: new Date(),
        userId,
        source: 'user'
      },
      include: { category: true, account: true }
    });

    // Atualiza saldo baseado no tipo
    const balanceChange = type === 'INCOME' ? amount : -amount;
    await prisma.account.update({
      where: { id: accountId },
      data: {
        balance: {
          increment: balanceChange
        }
      }
    });

    res.status(201).json({
      message: 'Transação criada com sucesso',
      transaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// GET /transactions - Listar transações
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        category: true,
        account: true
      },
      orderBy: { transactionDate: 'desc' }
    });

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar transações' });
  }
});

// GET /transactions/:id - Obter transação específica
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

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true, account: true }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar transação' });
  }
});

// PUT /transactions/:id - Atualizar transação
router.put('/:id', authMiddleware, [
  param('id').isUUID().withMessage('ID inválido'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que 0'),
  body('type').optional().isIn(['INCOME', 'EXPENSE', 'TRANSFER']).withMessage('Tipo de transação inválido'),
  body('categoryId').optional().isUUID().withMessage('ID da categoria inválido'),
  body('description').optional().isString(),
  body('transactionDate').optional().isISO8601().withMessage('Data inválida')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const { amount, type, categoryId, description, transactionDate } = req.body;

    // Buscar transação original
    const originalTransaction = await prisma.transaction.findFirst({
      where: { id, userId }
    });

    if (!originalTransaction) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    // Verificar se categoria existe (se fornecida)
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId }
      });

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }
    }

    // Se o tipo ou valor mudou, ajustar saldo
    if (type !== undefined || amount !== undefined) {
      const originalType = originalTransaction.type;
      const originalAmount = originalTransaction.amount;
      const newType = type || originalType;
      const newAmount = amount || originalAmount;

      // Reverter saldo anterior
      const oldBalanceChange = originalType === 'INCOME' ? originalAmount : -originalAmount;
      await prisma.account.update({
        where: { id: originalTransaction.accountId },
        data: {
          balance: { increment: -oldBalanceChange }
        }
      });

      // Aplicar novo saldo
      const newBalanceChange = newType === 'INCOME' ? newAmount : -newAmount;
      await prisma.account.update({
        where: { id: originalTransaction.accountId },
        data: {
          balance: { increment: newBalanceChange }
        }
      });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount }),
        ...(type && { type }),
        ...(categoryId && { categoryId }),
        ...(description !== undefined && { description }),
        ...(transactionDate && { transactionDate: new Date(transactionDate) })
      },
      include: { category: true, account: true }
    });

    res.json({
      message: 'Transação atualizada com sucesso',
      transaction: updatedTransaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
});

// DELETE /transactions/:id - Deletar transação
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

    // Buscar transação
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    // Reverter saldo antes de deletar
    const balanceChange = transaction.type === 'INCOME' ? transaction.amount : -transaction.amount;
    await prisma.account.update({
      where: { id: transaction.accountId },
      data: {
        balance: { increment: -balanceChange }
      }
    });

    // Deletar transação
    await prisma.transaction.delete({
      where: { id }
    });

    res.json({ message: 'Transação deletada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar transação' });
  }
});

module.exports = router;