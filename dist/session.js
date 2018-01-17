'use strict';

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var redis = require('redis');

var Session = function () {
  function Session(opts) {
    (0, _classCallCheck3.default)(this, Session);

    opts = opts || {};
    this.client = opts.client || redis.createClient(process.env.LOGIN_CACHE_REDIS);
  }

  (0, _createClass3.default)(Session, [{
    key: 'get',
    value: function get(key, cb) {
      this.client.get(key, function (err, data) {
        if (err) cb(err);else cb(undefined, JSON.parse(data));
      });
    }
  }, {
    key: 'set',
    value: function set(key, session, cb) {
      this.client.set(key, JSON.stringify(session), cb);
    }
  }, {
    key: 'delete',
    value: function _delete(key, cb) {
      this.client.del(key, cb);
    }
  }, {
    key: 'end',
    value: function end() {
      this.client.quit();
    }
  }]);
  return Session;
}();

module.exports = Session;