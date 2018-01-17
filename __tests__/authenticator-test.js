import nock from 'nock';
import Authenticator from '../lib/authenticator';

let authenticator;
const token = 'mock_token';
// https://docs.gitlab.com/ee/api/users.html#for-admins
const users = nock('http://gitlab.com')
    .get('/api/v4/users?active=true')
    .reply(200, [{
        "id": 1,
        "username": "john_smith",
        "email": "john@example.com",
        "name": "John Smith",
        "state": "active",
        "avatar_url": "http://gitlab.com/uploads/user/avatar/1/index.jpg",
        "web_url": "http://gitlab.com/john_smith",
        "created_at": "2012-05-23T08:00:58Z",
        "is_admin": false,
        "bio": null,
        "location": null,
        "skype": "",
        "linkedin": "",
        "twitter": "",
        "website_url": "",
        "organization": "",
        "last_sign_in_at": "2012-06-01T11:41:01Z",
        "confirmed_at": "2012-05-23T09:05:22Z",
        "theme_id": 1,
        "last_activity_on": "2012-05-23",
        "color_scheme_id": 2,
        "projects_limit": 100,
        "current_sign_in_at": "2012-06-02T06:36:55Z",
        "identities": [
          {"provider": "github", "extern_uid": "2435223452345"},
          {"provider": "bitbucket", "extern_uid": "john.smith"},
          {"provider": "google_oauth2", "extern_uid": "8776128412476123468721346"}
        ],
        "can_create_group": true,
        "can_create_project": true,
        "two_factor_enabled": true,
        "external": false
      }]);

describe('authenticator', () => {
    beforeAll(() => authenticator = new Authenticator({ url: 'http://gitlab.com', token }));

    it('should authenticate successfully', async () => {
        const callback = jest.fn();
        await authenticator.authenticate({ body: { name: 'john_smith', email: 'john@example.com', token } }, callback);
        expect(callback.mock.calls.length).toBe(1);
        expect(callback).toBeCalledWith(null, {
            token: 'mock_token',
            user: {
                name: 'john_smith',
                email: 'john@example.com'
            }
        });
    });
});
