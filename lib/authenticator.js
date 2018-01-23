import GitLab from './api';
import Session from './session';
import error from './error';
import uuid from 'uuid';

export default class Authenticator {
  constructor (opts) {
    opts = opts || {}
    this.api = opts.api || new GitLab(opts);
    this.session = opts.session || new Session(opts);
  }

  async authenticate (credentials, cb) {
    if (!valid(credentials)) return error.defer(cb, 500, 'Invalid credentials');
    try {
      const request = await this.api.users({ token: credentials.body.password });
      const users = request.body;
      for (let i = 0; i < users.length; i++) {
        // https://docs.gitlab.com/ee/api/users.html#for-admins
        if (users[i].username === credentials.body.name && users[i].email === credentials.body.email) {
          const token = Authenticator.getToken();
          const userData = {
            token: token,
            user: {
              name: credentials.body.name,
              email: credentials.body.email || username + '@devnullmail.com',
            },
          };
          this.session.set(token,)
          // Called by NPM
          cb(null, userData);
        }
      }
      return error.defer(cb, 400, 'No user found');
    } catch (e) {
      return error.defer(cb, 500, `Authentication error occurred: ${e}`);
    }
  }

  static getToken() {
    return uuid.v4();
  }
}

function valid (credentials) {
  return Boolean(credentials && credentials.body && credentials.body.name && credentials.body.password);
}
