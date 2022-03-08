const express = require('express');
const waAccoutRoute = express.Router();
const {
  addAccount,
  getAccounts,
  deleteAccount,
} = require('../controllers/waAccount.controller');
const { protect } = require('../controllers/auth.controller');

waAccoutRoute.use(protect);
waAccoutRoute.route('/').post(addAccount).get(getAccounts);

waAccoutRoute.route('/wa-account/:id').delete(deleteAccount);
//   .get(getAccount)
//   .put(updateAccount)
//   .delete(deleteAccount);

module.exports = waAccoutRoute;
