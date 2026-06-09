const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

// Validações para registro
const registerValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('name').optional().isString(),
  body('company').optional().isString()
];

// Validações para login
const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
];

// Validações para refresh
const refreshValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token é obrigatório')
];

// Validações para forgot password
const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Email inválido')
];

// Validações para reset password
const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token é obrigatório'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nova senha deve ter no mínimo 6 caracteres')
];

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh', refreshValidation, authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

module.exports = router;