const express = require('express');
const authRouter = express.Router();
const {
  signin,
  signup,
  validateToken,
  logout,
} = require('../controllers/auth.controller');

authRouter.post('/signup', signup);
authRouter.post('/signin', signin);
authRouter.get('/validate', validateToken);
authRouter.get('/logout', logout);

module.exports = authRouter;
