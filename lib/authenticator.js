import GitLab from './api';
import error from './error';

export default class Authenticator {
  constructor (opts) {
    opts = opts || {}
    // this.api = opts.api || new GitLab(opts)
    this.api = opts.api || new GitLab(opts);
  }

  async authenticate (credentials, cb) {
    if (!valid(credentials)) return error.defer(cb, 500, 'Invalid credentials');
    try {
      const request = await this.api.user();
      const user = request.body;
      if (user.username === credentials.body.name && user.email === credentials.body.email) {
        // Called by NPM
        cb(null, {
          token: credentials.body.token,
          user: {
            name: credentials.body.name,
            email: credentials.body.email || username + '@devnullmail.com',
          },
        });
      }
      return error.defer(cb, 400, 'No user found');
    } catch (e) {
      return error.defer(cb, 500, `Authentication error occurred: ${e}`);
    }
  }
}

function valid (credentials) {
  return Boolean(credentials && credentials.body && credentials.body.name && credentials.body.email);
}
