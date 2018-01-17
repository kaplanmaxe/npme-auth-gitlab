'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _api = require('./api');

var _api2 = _interopRequireDefault(_api);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var error = require('./error');

var Authenticator = function () {
  function Authenticator(opts) {
    (0, _classCallCheck3.default)(this, Authenticator);

    opts = opts || {};
    // this.api = opts.api || new GitLab(opts)
    this.api = opts.api || new _api2.default(opts);
  }

  (0, _createClass3.default)(Authenticator, [{
    key: 'authenticate',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(credentials, cb) {
        var request, users, i;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (valid(credentials)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return', error.defer(cb, 500, 'Invalid credentials'));

              case 2:
                _context.prev = 2;
                _context.next = 5;
                return this.api.users();

              case 5:
                request = _context.sent;
                users = request.body;

                for (i = 0; i < users.length; i++) {
                  // https://docs.gitlab.com/ee/api/users.html#for-admins
                  if (users[i].username === credentials.body.name && users[i].email === credentials.body.email) {
                    // Called by NPM
                    cb(null, {
                      token: credentials.body.token,
                      user: {
                        name: credentials.body.name,
                        email: credentials.body.email || username + '@devnullmail.com'
                      }
                    });
                  }
                }
                return _context.abrupt('return', error.defer(cb, 400, 'No user found'));

              case 11:
                _context.prev = 11;
                _context.t0 = _context['catch'](2);
                return _context.abrupt('return', error.defer(cb, 500, 'Authentication error occurred: ' + _context.t0));

              case 14:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[2, 11]]);
      }));

      function authenticate(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return authenticate;
    }()
  }]);
  return Authenticator;
}();

exports.default = Authenticator;


function valid(credentials) {
  return Boolean(credentials && credentials.body && credentials.body.name);
}