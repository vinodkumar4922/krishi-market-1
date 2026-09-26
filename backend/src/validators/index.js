const authValidator = require('./authValidator');
const productValidator = require('./productValidator');
const categoryValidator = require('./categoryValidator');
const orderValidator = require('./orderValidator');
const reviewValidator = require('./reviewValidator');
const disputeValidator = require('./disputeValidator');
const farmerValidator = require('./farmerValidator');

module.exports = {
  ...authValidator,
  ...productValidator,
  ...categoryValidator,
  ...orderValidator,
  ...reviewValidator,
  ...disputeValidator,
  ...farmerValidator,
};
