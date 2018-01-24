import fs from 'fs';
import got from 'got';
import { errorForCode } from './error';

export default class GitLab {
  constructor (opts) {
    opts = opts || {};
    this.url = opts.url || process.env.GITLAB_URL;
    this.strictSSL = opts.strictSSL || process.env.GITLAB_STRICT_SSL;
    this.token = opts.token || process.env.GITLAB_ACCESS_TOKEN;
    if (!this.url) {
      // lookup url from file system
      let json = fs.readFileSync(opts.gitlabConfig || '/etc/npme/data/gitlab.json', 'utf8')
      try {
        json = JSON.parse(json)
        this.url = json.url
        if (typeof this.strictSSL === 'undefined') this.strictSSL = json.strictSSL
      } catch (_) {}
    }
    if (!this.url) throw errorForCode(500, 'No GitLab url defined')
  }

  rejectUnauthorized () {
    return Boolean(this.strictSSL)
  }

  async projectInfo (token, org, repo) {
    try {
      let returnData = {};
      const request = await got(`${this.url}/api/v4/projects?search=${repo}`, {
        json: true,
        headers: {
          'Private-Token': token || process.env.GITLAB_ACCESS_TOKEN,
        },
      });
      const repos = request.body || [];
      if (repos.length === 0) { returnData = null; }
      for (let i = 0; i < repos.length; i++) {
        if (repos[i].name === repo && repos[i].namespace && repos[i].namespace.name === org) {
          returnData = repos[i];
        }
      }
      return returnData;
    } catch (e) {
      console.error(e);
    }
  }

  async user() {
    try {
      const request = await got(`${this.url}/api/v4/user`, {
        json: true,
        headers: {
          'Private-Token': this.token,
        },
      });
      return request;
    } catch (e) {
      console.log(e);
    }
  }

  // access levels based on:
  // http://doc.gitlab.com/ce/api/groups.html#group-members
  // http://doc.gitlab.com/ce/permissions/permissions.html
  readAccessLevel () {
    return 10; // GUEST
  }

  writeAccessLevel () {
    return 30; // DEVELOPER
  }
}
