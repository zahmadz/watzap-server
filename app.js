require('dotenv').config();

const Logger = require('./utils/Logger');
const cors = require('cors');
const hpp = require('hpp');
const helmet = require('helmet');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const express = require('express');
const mongoose = require('mongoose');
const mongoSanitize = require('express-mongo-sanitize');
const app = express();

function initApp() {
  try {
    // security, cookie parser & body parser
    app.use(helmet());
    app.use(
      cors({ origin: process.env.CLIENTS_URL.split(' '), credentials: true })
    );
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(hpp());
    app.use(mongoSanitize());
    app.use(xss());

    // start server
    const PORT = process.env.PORT;
    app.listen(PORT || 5000, () => {
      console.log(`server started at port ${PORT}✅`);
    });

    // routes
    const authRoute = require('./routes/auth.router');
    app.use('/api/v1/auth', authRoute);
    // end routes

    // error handler
    const ErrorHandler = require('./utils/ErrorHandler');
    app.use(ErrorHandler);

    // 404 route not found handler
    app.all('*', (req, res) => {
      res.status(404).json({
        status: 'error',
        message: 'page not found',
      });
    });
  } catch (error) {
    Logger.error(`[INIT APP]: ${error.message}, ${error.stack}`);
    console.log('error inside initApp() functions', error);
  }
}

const MONGODB_URL = process.env.MONGODB_URL;
mongoose
  .connect(MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('database started ✅');

    initApp();
  })
  .catch((err) => {
    Logger.error(`database not connected ❌ ${err.stack}`);
    console.log('database not connected ❌', err);
    process.exit();
  });
