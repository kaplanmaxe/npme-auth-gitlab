require('dotenv').config();

module.exports = {
  Authenticator: require('./dist/authenticator'),
  Authorizer: require('./dist/authorizer'),
  Session: require('./dist/session'),
};
