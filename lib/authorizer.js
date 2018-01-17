// const urlParser = require('url')
// const got = require('got')
// const parseGitUrl = require('github-url-from-git')
// const GitLab = require('./api')
// const Session = require('./session')
// const error = require('./error')
import urlParser from 'url';
import got from 'got';
import parseGitUrl from 'github-url-from-git';
import GitLab from './api';
import error from './error';

export default class Authorizer {
  /**
   * @constructor
   * @param {object} opts 
   */
  constructor (opts) {
    opts = opts || {}
    this.api = opts.api || new GitLab(opts)
    // this.session = opts.session || new Session(opts)
    this.frontDoorHost = opts.frontDoorHost || process.env.FRONT_DOOR_HOST
    this.sharedFetchSecret = opts.sharedFetchSecret || process.env.SHARED_FETCH_SECRET
  }

  /**
   * Extract token from Authorization header
   * @param {object} credentials 
   * @return {string}
   */
  static extractToken (credentials) {
    let token = null;
    if (credentials && credentials.headers && credentials.headers.authorization && credentials.headers.authorization.match(/Bearer /)) {
      token = credentials.headers.authorization.replace('Bearer ', '');
    }
    return token;
  }

  /**
   * Fetch package.json
   * @param {string} url Url of package.json
   */
  static async loadPackageJson(credentials, frontDoorHost, sharedFetchSecret, cb) {
    const body = credentials.body;
    if (body && body.versions && body['dist-tags'] && body['dist-tags'].latest && body.versions[body['dist-tags'].latest]) {
      return process.nextTick(() => {
        cb(null, body.versions[body['dist-tags'].latest]);
      });
    }
    try {
      // lookup package.json
      const response = await got(urlParser.resolve(frontDoorHost, credentials.path + '?sharedFetchSecret=' + sharedFetchSecret), { json: true });
      
      if (response.body.repository) return cb(null, response.body);
    } catch (e) {
      cb(e);
    }
  }

  /**
   * Returns 
   * @param {object} packageJson Contents of package.json
   * @return {object}
   */
  static parseRepoUrl(packageJson) {
    let url = packageJson.repository.url
    if (url.match(/^(git:\/\/|git@)/)) url = parseGitUrl(url, { extraBaseUrls: /[^/]+/.source })
    let parsedUrl = urlParser.parse(url)
    let splitOrgRepo = parsedUrl.path.split('.git')[0].match(/^\/(.*)\/(.*)$/)
    if (!splitOrgRepo) return 'Does not appear to be a valid git url: ' + url
    return {
      org: splitOrgRepo[1],
      repo: splitOrgRepo[2]
    }
  }

  async authorize (credentials, cb) {
    let token = Authorizer.extractToken(credentials);
    if (!token) return error.defer(cb, 401);

    let self = this;
    let requiredAccessLevel;
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
        return error.defer(cb, 405, 'Unsupported method: ' + credentials.method);
    }
    const test = await Authorizer.loadPackageJson(credentials, self.frontDoorHost, self.sharedFetchSecret, async (er, packageJson) => {
      if (er) return cb(er)

      let orgRepo = Authorizer.parseRepoUrl(packageJson);
      if (typeof orgRepo === 'string') return cb(error.forCode(400, orgRepo))

      try {
        const project = await this.api.projectInfo(token, orgRepo.org, orgRepo.repo);
        if (!project) return cb(error.forCode(400, 'No GitLab project found "' + orgRepo.org + '/' + orgRepo.repo + '"'))
          let authorized = project.permissions &&
            ((project.permissions.project_access && project.permissions.project_access.access_level >= requiredAccessLevel) ||
            (project.permissions.group_access && project.permissions.group_access.access_level >= requiredAccessLevel))
          cb(null, authorized);
      } catch (err) {
        cb(err);
      }
    });
  }
}
