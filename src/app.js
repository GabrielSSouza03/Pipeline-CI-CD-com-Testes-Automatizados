// src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();

// 1. Segurança: headers HTTP
app.use(helmet());

// 2. CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// 3. Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições deste IP, tente novamente mais tarde.' }
});

app.use('/api', globalLimiter);

// 4. Parse JSON
app.use(express.json());

// 5. Rotas principais
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/chat', chatbotRoutes);

// 6. Health check (melhor que "/")
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API Financeira funcionando',
    timestamp: new Date()
  });
});

// 7. Rota raiz
app.get('/', (req, res) => {
  res.json({ message: 'API Financeira com IA - Backend funcionando!' });
});

// 8. Middleware de rota não encontrada (importante!)
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// 9. Middleware global de erro
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor'
  });
});

module.exports = app;