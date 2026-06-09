// tests/setup.js
const { prisma } = require('../src/config/prisma');

beforeEach(async () => {
  try {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "Message", "Conversation", "Alert", "Budget", "Transaction", "Account", "Category", "UserPreference", "User" RESTART IDENTITY CASCADE'
    );
  } catch (err) {
    console.warn('Erro ao limpar banco de testes:', err);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});