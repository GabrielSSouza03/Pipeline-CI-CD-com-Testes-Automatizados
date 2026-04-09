const express = require("express");
const { param, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const { prisma } = require("../config/prisma");

const router = express.Router();

router.post("/message", authMiddleware, async (req, res) => {
  const { message } = req.body;

  try {
    let reply = "Não entendi.";

    if (message.includes("saldo")) {
      const accounts = await prisma.account.findMany({
        where: { userId: req.user.userId },
      });

      const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);

      reply = `Seu saldo total é R$ ${total}`;
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: "Erro no chatbot" });
  }
});

// GET /chat/history - Listar conversas do usuário autenticado
router.get("/history", authMiddleware, async (req, res) => {
  const userId = req.user.userId || req.user.id;

  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    const history = conversations.map((conversation) => ({
      id: conversation.id,
      startedAt: conversation.startedAt,
      status: conversation.status,
      messageCount: conversation._count.messages,
      lastMessage: conversation.messages[0] || null,
    }));

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar histórico de conversas" });
  }
});

// GET /chat/history/:conversation_id - Buscar conversa específica
router.get(
  "/history/:conversation_id",
  authMiddleware,
  [param("conversation_id").isUUID().withMessage("ID da conversa inválido")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId || req.user.id;
    const { conversation_id: conversationId } = req.params;

    try {
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversa não encontrada" });
      }

      res.json(conversation);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar conversa" });
    }
  },
);

// DELETE /chat/history/:conversation_id - Remover conversa específica
router.delete(
  "/history/:conversation_id",
  authMiddleware,
  [param("conversation_id").isUUID().withMessage("ID da conversa inválido")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId || req.user.id;
    const { conversation_id: conversationId } = req.params;

    try {
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversa não encontrada" });
      }

      await prisma.$transaction([
        prisma.message.deleteMany({ where: { conversationId } }),
        prisma.conversation.delete({ where: { id: conversationId } }),
      ]);

      res.json({ message: "Histórico da conversa removido com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao remover histórico da conversa" });
    }
  },
);

module.exports = router;
