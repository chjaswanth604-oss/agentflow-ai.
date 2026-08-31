const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

const registerUser = async ({ name, email, password, role }) => {
  let user = await User.findOne({ email });
  if (user) {
    user.name = name || user.name;
    user.password = password;
    if (role) user.role = role;
    await user.save();
  } else {
    user = await User.create({
      name,
      email,
      password,
      role: role || 'operator'
    });
  }

  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin
    },
    token
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin
    },
    token
  };
};

const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt
  };
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};
