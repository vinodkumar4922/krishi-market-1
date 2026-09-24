const User = require('../models/User');
const Farmer = require('../models/Farmer');
const AuditLog = require('../models/AuditLog');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenHelper');

// Safe generic login error message to prevent account enumeration
const INVALID_CREDENTIALS_MSG = 'Invalid email or password';

const registerConsumer = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = new User({
      name,
      email,
      phone,
      passwordHash: password,
      role: 'CONSUMER',
      accountStatus: 'ACTIVE',
    });

    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await AuditLog.create({
      actor: user._id,
      action: 'USER_REGISTERED',
      resourceType: 'User',
      resourceId: user._id.toString(),
      details: { role: 'CONSUMER' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: 'Consumer registered successfully.',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const registerFarmer = async (req, res, next) => {
  try {
    const { name, email, phone, password, farmLocation, cropTypes, farmingMethod, experienceYears, farmSizeAcres, bio } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = new User({
      name,
      email,
      phone,
      passwordHash: password,
      role: 'FARMER',
      accountStatus: 'ACTIVE',
    });

    await user.save();

    const farmer = new Farmer({
      user: user._id,
      farmLocation,
      cropTypes,
      farmingMethod: farmingMethod || 'ORGANIC',
      experienceYears: experienceYears || 1,
      farmSizeAcres: farmSizeAcres || 1,
      bio: bio || '',
      verificationStatus: 'PENDING', // Initial status is always PENDING per requirements
    });

    await farmer.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await AuditLog.create({
      actor: user._id,
      action: 'FARMER_REGISTERED_PENDING_VERIFICATION',
      resourceType: 'Farmer',
      resourceId: farmer._id.toString(),
      details: { farmLocation, farmingMethod },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: 'Farmer registered successfully! Verification status is PENDING admin review.',
      data: {
        user,
        farmer,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select passwordHash since it is hidden by default in User schema
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: INVALID_CREDENTIALS_MSG,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: INVALID_CREDENTIALS_MSG,
      });
    }

    if (user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact platform support.',
      });
    }

    let farmerProfile = null;
    if (user.role === 'FARMER') {
      farmerProfile = await Farmer.findOne({ user: user._id });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await AuditLog.create({
      actor: user._id,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user._id.toString(),
      details: { role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          accountStatus: user.accountStatus,
          createdAt: user.createdAt,
        },
        farmer: farmerProfile,
        accessToken,
        refreshToken,
      },
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
  getCurrentUser,
};
