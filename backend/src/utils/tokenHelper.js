const tokenService = require('../services/tokenService');

module.exports = {
  generateAccessToken: tokenService.generateAccessToken,
  generateRefreshToken: tokenService.generateRefreshToken,
  createSessionToken: tokenService.createSessionToken,
  verifyAccessToken: tokenService.verifyAccessToken,
  rotateRefreshToken: tokenService.rotateRefreshToken,
  revokeRefreshToken: tokenService.revokeRefreshToken,
  revokeAllUserTokens: tokenService.revokeAllUserTokens,
};

