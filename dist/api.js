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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs');
var got = require('got');
var errorForCode = require('./error').forCode;

var GitLab = function () {
  function GitLab(opts) {
    (0, _classCallCheck3.default)(this, GitLab);

    opts = opts || {};
    this.url = opts.url || process.env.GITLAB_URL;
    this.strictSSL = opts.strictSSL || process.env.GITLAB_STRICT_SSL;
    this.token = opts.token || process.env.GITLAB_ACCESS_TOKEN;
    if (!this.url) {
      // lookup url from file system
      var json = fs.readFileSync(opts.gitlabConfig || '/etc/npme/data/gitlab.json', 'utf8');
      try {
        json = JSON.parse(json);
        this.url = json.url;
        if (typeof this.strictSSL === 'undefined') this.strictSSL = json.strictSSL;
      } catch (_) {}
    }
    if (!this.url) throw errorForCode(500, 'No GitLab url defined');
  }

  (0, _createClass3.default)(GitLab, [{
    key: 'rejectUnauthorized',
    value: function rejectUnauthorized() {
      return Boolean(this.strictSSL);
    }
  }, {
    key: 'projectInfo',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(token, org, repo) {
        var returnData, request, repos, i;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                returnData = {};
                _context.next = 4;
                return got(this.url + '/api/v4/projects?search=' + repo, {
                  json: true,
                  headers: {
                    'Private-Token': token || process.env.GITLAB_ACCESS_TOKEN
                  }
                });

              case 4:
                request = _context.sent;
                repos = request.body || [];

                if (repos.length === 0) {
                  returnData = null;
                }
                for (i = 0; i < repos.length; i++) {
                  if (repos[i].name === repo && repos[i].namespace && repos[i].namespace.name === org) {
                    returnData = repos[i];
                  }
                }
                return _context.abrupt('return', returnData);

              case 11:
                _context.prev = 11;
                _context.t0 = _context['catch'](0);

                console.error(_context.t0);

              case 14:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 11]]);
      }));

      function projectInfo(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return projectInfo;
    }()
  }, {
    key: 'users',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
        var request;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                _context2.next = 3;
                return got(this.url + '/api/v4/users?active=true', {
                  json: true,
                  headers: {
                    'Private-Token': this.token
                  }
                });

              case 3:
                request = _context2.sent;
                return _context2.abrupt('return', request);

              case 7:
                _context2.prev = 7;
                _context2.t0 = _context2['catch'](0);

                console.log(_context2.t0);

              case 10:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[0, 7]]);
      }));

      function users() {
        return _ref2.apply(this, arguments);
      }

      return users;
    }()

    // access levels based on:
    // http://doc.gitlab.com/ce/api/groups.html#group-members
    // http://doc.gitlab.com/ce/permissions/permissions.html

  }, {
    key: 'readAccessLevel',
    value: function readAccessLevel() {
      return 10; // GUEST
    }
  }, {
    key: 'writeAccessLevel',
    value: function writeAccessLevel() {
      return 30; // DEVELOPER
    }
  }]);
  return GitLab;
}();

exports.default = GitLab;