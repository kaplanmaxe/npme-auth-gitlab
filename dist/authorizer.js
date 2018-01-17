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

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _got = require('got');

var _got2 = _interopRequireDefault(_got);

var _githubUrlFromGit = require('github-url-from-git');

var _githubUrlFromGit2 = _interopRequireDefault(_githubUrlFromGit);

var _api = require('./api');

var _api2 = _interopRequireDefault(_api);

var _error = require('./error');

var _error2 = _interopRequireDefault(_error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Authorizer = function () {
  /**
   * @constructor
   * @param {object} opts 
   */
  function Authorizer(opts) {
    (0, _classCallCheck3.default)(this, Authorizer);

    opts = opts || {};
    this.api = opts.api || new _api2.default(opts);
    // this.session = opts.session || new Session(opts)
    this.frontDoorHost = opts.frontDoorHost || process.env.FRONT_DOOR_HOST;
    this.sharedFetchSecret = opts.sharedFetchSecret || process.env.SHARED_FETCH_SECRET;
  }

  /**
   * Extract token from Authorization header
   * @param {object} credentials 
   * @return {string}
   */


  (0, _createClass3.default)(Authorizer, [{
    key: 'authorize',
    value: function authorize(credentials, cb) {
      var token = Authorizer.extractToken(credentials);
      if (!token) return _error2.default.defer(cb, 401);

      var self = this;
      var requiredAccessLevel = void 0;
      switch (credentials.method) {
        case 'GET':
          requiredAccessLevel = self.api.readAccessLevel();
          break;
        case 'PUT':
        case 'POST':
        case 'DELETE':
          requiredAccessLevel = self.api.writeAccessLevel();
          break;
        default:
          return _error2.default.defer(cb, 405, 'Unsupported method: ' + credentials.method);
      }

      Authorizer.loadPackageJson(credentials, self.frontDoorHost, self.sharedFetchSecret, function (er, packageJson) {
        if (er) return cb(er);

        var orgRepo = Authorizer.parseRepoUrl(packageJson);
        if (typeof orgRepo === 'string') return cb(_error2.default.forCode(400, orgRepo));

        // check user access to repo
        self.api.projectInfo(token, orgRepo.org, orgRepo.repo).then(function (project) {
          if (!project) return cb(_error2.default.forCode(400, 'No GitLab project found "' + orgRepo.org + '/' + orgRepo.repo + '"'));
          var authorized = project.permissions && (project.permissions.project_access && project.permissions.project_access.access_level >= requiredAccessLevel || project.permissions.group_access && project.permissions.group_access.access_level >= requiredAccessLevel);
          cb(null, authorized);
        }).catch(function (err) {
          cb(err);
        });
      });
    }
  }], [{
    key: 'extractToken',
    value: function extractToken(credentials) {
      var token = null;
      if (credentials && credentials.headers && credentials.headers.authorization && credentials.headers.authorization.match(/Bearer /)) {
        token = credentials.headers.authorization.replace('Bearer ', '');
      }
      return token;
    }

    /**
     * Fetch package.json
     * @param {string} url Url of package.json
     */

  }, {
    key: 'loadPackageJson',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(credentials, frontDoorHost, sharedFetchSecret, cb) {
        var body, response;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                body = credentials.body;

                if (!(body && body.versions && body['dist-tags'] && body['dist-tags'].latest && body.versions[body['dist-tags'].latest])) {
                  _context.next = 3;
                  break;
                }

                return _context.abrupt('return', process.nextTick(function () {
                  cb(null, body.versions[body['dist-tags'].latest]);
                }));

              case 3:
                _context.prev = 3;
                _context.next = 6;
                return (0, _got2.default)(_url2.default.resolve(frontDoorHost, credentials.path + '?sharedFetchSecret=' + sharedFetchSecret), { json: true });

              case 6:
                response = _context.sent;

                if (!response.body.repository) {
                  _context.next = 9;
                  break;
                }

                return _context.abrupt('return', cb(null, response.body));

              case 9:
                _context.next = 14;
                break;

              case 11:
                _context.prev = 11;
                _context.t0 = _context['catch'](3);

                cb(_context.t0);

              case 14:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[3, 11]]);
      }));

      function loadPackageJson(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      }

      return loadPackageJson;
    }()

    /**
     * Returns 
     * @param {object} packageJson Contents of package.json
     * @return {object}
     */

  }, {
    key: 'parseRepoUrl',
    value: function parseRepoUrl(packageJson) {
      var url = packageJson.repository.url;
      if (url.match(/^(git:\/\/|git@)/)) url = (0, _githubUrlFromGit2.default)(url, { extraBaseUrls: /[^/]+/.source });
      var parsedUrl = _url2.default.parse(url);
      var splitOrgRepo = parsedUrl.path.split('.git')[0].match(/^\/(.*)\/(.*)$/);
      if (!splitOrgRepo) return 'Does not appear to be a valid git url: ' + url;
      return {
        org: splitOrgRepo[1],
        repo: splitOrgRepo[2]
      };
    }
  }]);
  return Authorizer;
}(); // const urlParser = require('url')
// const got = require('got')
// const parseGitUrl = require('github-url-from-git')
// const GitLab = require('./api')
// const Session = require('./session')
// const error = require('./error')


exports.default = Authorizer;