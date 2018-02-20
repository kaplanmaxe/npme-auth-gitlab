import urlParser from 'url';
import got from 'got';
import parseGitUrl from 'github-url-from-git';
import GitLab from './api';
import Session from './session';
import error from './error';
import parseRepo from 'parse-repo';

export default class Authorizer {
  /**
   * @constructor
   * @param {object} opts 
   */
  constructor (opts) {
    opts = opts || {};
    this.api = opts.api || new GitLab(opts);
    if (!opts.debug) { this.session = opts.session || new Session(opts); }
    this.frontDoorHost = opts.frontDoorHost || process.env.FRONT_DOOR_HOST;
    this.sharedFetchSecret = opts.sharedFetchSecret || process.env.SHARED_FETCH_SECRET;
    this.gitLabURL = urlParser.parse(this.frontDoorHost);
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
    // Lookup package.json
    const response = await got(urlParser.resolve(frontDoorHost, credentials.path + '?sharedFetchSecret=' + sharedFetchSecret), { json: true });
    if (response.body.repository) {
      return response.body;
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
    const token = Authorizer.extractToken(credentials);
    if (!token) {
      return error.defer(cb, 401);
    }
    // Determine required access permissions
    let requiredAccessLevel;
    switch (credentials.method) {
      case 'GET':
        requiredAccessLevel = this.api.readAccessLevel();
        break;
      case 'PUT':
      case 'POST':
      case 'DELETE':
        requiredAccessLevel = this.api.publishAccessLevel();
        break;
      default:
        return error.defer(cb, 405, 'Unsupported method: ' + credentials.method);
    }
    // Load the project's package.json
    try {
      const packageJSON = await Authorizer.loadPackageJson(credentials, this.frontDoorHost, this.sharedFetchSecret);
      if (!packageJSON.repository.url) {
        return cb("No repo URL specified in package.json");
      }
      // Check if the module is hosted in our GitLab server
      const repoURL = parseRepo(packageJSON.repository.url);
      if (repoURL.host !== this.gitLabURL.host) {
        if (requiredAccessLevel === this.api.readAccessLevel()) {
          // Reading a third party library from the NPME server. This is
          // generally the case when NPME is setup to mirror / lazy cache
          // public modules and the user has configured their local npm /
          // yarn to pull all modules from the internal server.
          return cb(null, true);
        } else {
          // Attempting to write a public module to the internal npm server.
          return cb("Cannot publish over modules internally. Please publish a new version of the public module to npmjs.org and pull the new version through the internal server, or publish as new internal module.", false);
        }
      }

      return this.authenticateGitLab(packageJSON, token, requiredAccessLevel, cb);
    } catch (err) {
      return cb(err);
    }
  }

  async authenticateGitLab(packageJson, token, requiredAccessLevel, cb) {
      const orgRepo = Authorizer.parseRepoUrl(packageJson);
      
      if (typeof orgRepo === 'string') {
        return cb(error.forCode(400, orgRepo));
      }

      try {
        const project = await this.api.projectInfo(token, orgRepo.org, orgRepo.repo);
        if (!project) return cb(error.forCode(400, 'No GitLab project found "' + orgRepo.org + '/' + orgRepo.repo + '"'))
          let authorized = project.permissions &&
            ((project.permissions.project_access && project.permissions.project_access.access_level >= requiredAccessLevel) ||
            (project.permissions.group_access && project.permissions.group_access.access_level >= requiredAccessLevel));
          return cb(null, authorized);
      } catch (err) {
        return cb(err);
      }
  }
}
