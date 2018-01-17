import nock from 'nock';
import faker from 'faker';
import fs from 'fs';
import Authorizer from '../lib/authorizer';

const frontDoorHost = 'http://frontdoor.npm.js';
const path = '/@npm-auth-test/test-repo';
const packageJson = {
    name: 'test-repo',
    repository: {
        type: 'git',
        url: `git+https://gitlab.com${path}.git`
    }
};

let authorizer;

describe('authorizer.js', () => {
    beforeAll(() => authorizer = new Authorizer({ url: 'http://gitlab.com' }));

    it('should successfully extract token (extractToken())', () => {
        const mockToken = faker.random.word();
        const token = Authorizer.extractToken({ headers: { authorization: `Bearer ${mockToken}`}});
        expect(token === mockToken).toBe(true);
    });

    it('should fetch package.json', async () => {
        const cb = jest.fn();
        const sharedFetchSecret = encodeURIComponent(faker.random.word());
        const mockToken = faker.random.word();
        const packageJsonMock = nock(frontDoorHost)
            .get(`/@npm-auth-test/test-repo?sharedFetchSecret=${sharedFetchSecret}`)
            .reply(200, packageJson);
        const test = await Authorizer.loadPackageJson({ path }, frontDoorHost, sharedFetchSecret, cb);
        expect(cb).toBeCalledWith(null, packageJson);
    });

    it('should parse repo url', () => {
        const url = Authorizer.parseRepoUrl(packageJson);
        const gitLabPath = path.split('/');
        expect(url).toEqual({ org: gitLabPath[1], repo: gitLabPath[2] });
    });
});