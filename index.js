require('dotenv').config();

module.exports = {
  Authenticator: require('./dist/authenticator').default,
  Authorizer: require('./dist/authorizer').default,
  Session: require('./dist/session').default,
};
