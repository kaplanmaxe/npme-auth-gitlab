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
    const { name, email, password } = credentials.body;
    try {
      const response = await this.api.user(password);
      const user = response.body;
      if (user.username === name) {
        // Called by NPM
        return cb(null, {
          token: password,
          user: {
            name: name,
            email: email || (name + '@devnullmail.com'),
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
  return Boolean(credentials && credentials.body && credentials.body.name);
}
