const AppError = require('../utils/AppError');
const CatchAsync = require('../utils/CatchAsync');
const WAAccount = require('../models/WAAccount');
const WhatsappAPI = require('../external_api/WhatsappAPI');

const addAccount = CatchAsync(async (req, res, next) => {
  const loggedInUserID = req.loggedInUser._id;
  const { name, number } = req.body;

  const isNumberExist = await WAAccount.findOne({
    author: loggedInUserID,
    number: number,
  });
  if (isNumberExist) {
    return next(
      new AppError(
        400,
        'Nomor sudah digunakan, gunakan nomor yang lain',
        'NUMBER_EXIST'
      )
    );
  }

  const newAccount = await WAAccount.create({
    author: loggedInUserID,
    name,
    number,
  });

  res.status(200).json({
    status: 'ok',
    newAccount,
  });
});

const getAccounts = CatchAsync(async (req, res, next) => {
  const loggedInUserID = req.loggedInUser._id;

  let accounts = await WAAccount.find({ author: loggedInUserID });
  if (!accounts)
    return res.status(200).json({
      status: 'ok',
      accounts: [],
    });

  accounts = JSON.parse(JSON.stringify(accounts));

  const reqWhatsappConnections = await WhatsappAPI.getStatus(loggedInUserID);
  const whatsappConnections = reqWhatsappConnections.data;

  if (whatsappConnections.status === 'ok') {
    accounts.forEach((account) => {
      const accountConnection =
        whatsappConnections.connections[account.number] || {};
      account.whatsappInfo = {
        state: accountConnection.state || 'UNAUTHORIZE',
        pushname: accountConnection.info && accountConnection.info.pushname,
        number: accountConnection.info
          ? accountConnection.info.wid && accountConnection.info.wid.user
          : '',
      };
    });
  } else {
    next(
      new AppError(500, 'get whatsapp connections error', 'WHATSAPP_API_ERROR')
    );
  }

  /*
    TODO:
      - get connection status to WA API ✅
      - merge the connection status to accounts ✅
      - if there is a connection status that is not in the accounts, logout the account
  */

  res.status(200).json({
    status: 'ok',
    accounts: [...accounts],
  });
});

const deleteAccount = CatchAsync(async (req, res, next) => {
  const loggedInUserID = req.loggedInUser._id;
  const { id, number } = req.params;

  WhatsappAPI.logout(loggedInUserID, number);

  await WAAccount.findByIdAndDelete(id);

  res.status(200).json({
    status: 'ok',
    message: 'logout berhasil',
  });
});

module.exports = { addAccount, getAccounts, deleteAccount };
