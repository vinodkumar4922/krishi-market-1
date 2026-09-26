const authService = require('../services/authService');
const Farmer = require('../models/Farmer');

const registerConsumer = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    const result = await authService.registerConsumer({
      name,
      email,
      phone,
      password,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: 'Consumer registered successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const registerFarmer = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      farmLocation,
      cropTypes,
      farmingMethod,
      experienceYears,
      farmSizeAcres,
      bio,
    } = req.body;

    const result = await authService.registerFarmer({
      name,
      email,
      phone,
      password,
      farmLocation,
      cropTypes,
      farmingMethod,
      experienceYears,
      farmSizeAcres,
      bio,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: 'Farmer registered successfully! Verification status is PENDING admin review.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({
      email,
      password,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    const result = await authService.refreshToken({
      token,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    const userId = req.user ? req.user._id : null;

    const result = await authService.logout({
      token,
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    let farmer = null;
    if (req.user.role === 'FARMER') {
      farmer = await Farmer.findOne({ user: req.user._id });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
        farmer,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerConsumer,
  registerFarmer,
  login,
  refreshToken,
  logout,
  getCurrentUser,
};
