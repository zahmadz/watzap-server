const catchAsync = require('../utils/CatchAsync');
const AppError = require('../utils/AppError');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signJWT = (id) => {
  const JWTSecretKey = process.env.JWT_SECRET_KEY;
  const JWTExpiresIn = process.env.JWT_EXPIRES_IN;

  return jwt.sign({ id }, JWTSecretKey, {
    expiresIn: JWTExpiresIn,
  });
};

// create/sign jwt and send response
const sendResWithJWT = (res, statusCode, user) => {
  const token = signJWT(user._id);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 12),
  };

  res.cookie('token', token, cookieOptions).status(statusCode).json({
    status: 'ok',
    token,
    user,
  });
};

const signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // cek apakah user mengisi email & password
  if (!email || !password)
    return next(
      new AppError(400, 'email and password is require', 'VALIDATION_ERROR')
    );

  // cek apakah ada user dengan email tersebut
  const user = await User.findOne({ email }).select('+password');
  if (!user)
    return next(new AppError(401, 'invalid email or password', 'UNAUTHORIZED'));

  // jika ada, bandingkan password
  if (!(await user.comparePassword(password)))
    return next(new AppError(401, 'invalid email or password', 'UNAUTHORIZED'));

  // sembunyikan password (tidak dikirim bersama response)
  // WARNING!!! JANGAN ADA PERINTAH "newUser.save()" di blockscope ini, itu akan merubah password di database
  user.password = undefined;

  // send res with jwt
  sendResWithJWT(res, 200, user);
});

const signup = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // cek apakah user mengisi username & password
  if (!(email && password))
    return next(
      new AppError(400, 'email and password is require', 'VALIDATION_ERROR')
    );

  // cek apakah belum ada user dengan email tersebut
  const user = await User.findOne({ email });
  if (user)
    return next(
      new AppError(
        400,
        'email already in use, try another email',
        'VALIDATION_ERROR'
      )
    );

  // daftarkan user
  const newUser = await User.create({ name, email, password });

  // sembunyikan password (tidak dikirim bersama response)
  // WARNING!!! JANGAN ADA PERINTAH "newUser.save()" di block scope ini, itu akan merubah password di database
  newUser.password = undefined;

  // send res with jwt
  sendResWithJWT(res, 200, newUser);
});

const validateToken = catchAsync(async (req, res, next) => {
  // cek apakah ada token didalam body atau cookies
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token)
    return next(new AppError(401, 'please provide token', 'UNAUTHORIZED'));

  // verifikasi token
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // cek apakah ada user dengan token tersebut
  const user = await User.findById(decoded.id);
  if (!user)
    return next(
      new AppError(
        401,
        'there is no user associatet with that token',
        'UNAUTHORIZED'
      )
    );

  res.status(202).json({
    status: 'ok',
    user,
  });
});

const logout = catchAsync(async (req, res, next) => {
  res.cookie('token', '');
  res.clearCookie('token');

  res.status(200).json({
    status: 'ok',
  });
});

const protect = catchAsync(async (req, res, next) => {
  // cek apakah ada token didalam body atau cookies
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token)
    return next(
      new AppError(401, 'please provide token inside cookies', 'UNAUTHORIZED')
    );

  // verifikasi token
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // cek apakah ada user dengan token tersebut
  const user = await User.findById(decoded.id);
  if (!user)
    return next(
      new AppError(
        401,
        'there is no user associatet with that id',
        'UNAUTHORIZED'
      )
    );

  // beri akses ke protected route
  req.loggedInUser = user;

  next();
});

module.exports = {
  signin,
  signup,
  protect,
  validateToken,
  logout,
};
