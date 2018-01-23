import redis from 'redis';

export default class Session {
  constructor (opts) {
    opts = opts || {};
    this.client = opts.client || redis.createClient(process.env.LOGIN_CACHE_REDIS);
  }

  get (key, cb) {
    this.client.get(key, (err, data) => {
      if (err) cb(err);
      else cb(undefined, JSON.parse(data));
    })
  }

  async set (key, session) {
    try {
      this.client.set(key, JSON.stringify(session));
    } catch (e) {
      throw new Error(e);
    }
  }

  delete (key, cb) {
    this.client.del(key, cb);
  }

  end () {
    this.client.quit();
  }
}
