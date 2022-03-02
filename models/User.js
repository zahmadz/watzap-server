const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const UserSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    minlength: [3, 'invalid email'],
    validate: {
      validator: (val) => {
        return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          val
        );
      },
      message: 'invalid email',
    },
    unique: true,
    required: true,
  },
  password: {
    type: String,
    minlength: [4, 'password terlalu pendek'],
    maxlength: [100, 'password terlalu panjang'],
    required: true,
    select: false,
  },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);

  next();
});

UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.plugin(uniqueValidator);
module.exports = mongoose.model('user', UserSchema);
