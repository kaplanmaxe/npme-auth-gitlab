import nock from 'nock';
import faker from 'faker';
import fs from 'fs';
import Authorizer from '../lib/authorizer';

const frontDoorHost = 'http://frontdoor.npm.js';
const org = '@npm-auth-test';
const repo = 'test-repo';
const path = '/@npm-auth-test/test-repo';
const sharedFetchSecret = encodeURIComponent(faker.random.word());
const packageJson = {
    name: repo,
    repository: {
        type: 'git',
        url: `git+https://gitlab.com${path}.git`
    }
};
const packageJsonMock = nock(frontDoorHost)
    .get(`/${org}/${repo}?sharedFetchSecret=${sharedFetchSecret}`)
    .reply(200, packageJson);

let authorizer;

describe('authorizer.js', () => {
    beforeAll(() => authorizer = new Authorizer({
        url: 'http://gitlab.com',
        frontDoorHost,
        sharedFetchSecret,
    }));

    it('should successfully extract token (extractToken())', () => {
        const mockToken = faker.random.word();
        const token = Authorizer.extractToken({ headers: { authorization: `Bearer ${mockToken}`}});
        expect(token === mockToken).toBe(true);
    });

    it('should fetch package.json', async () => {
        const cb = jest.fn();
        const mockToken = faker.random.word();
        const test = await Authorizer.loadPackageJson({ path }, frontDoorHost, sharedFetchSecret, cb);
        expect(cb).toBeCalledWith(null, packageJson);
    });

    it('should parse repo url', () => {
        const url = Authorizer.parseRepoUrl(packageJson);
        const gitLabPath = path.split('/');
        expect(url).toEqual({ org: gitLabPath[1], repo: gitLabPath[2] });
    });

    it('should authorize correctly', async () => {
        const token = encodeURIComponent(faker.random.word());
        // Get passed in by npm server
        const credentials = {
            method: 'GET',
            // path: '/@kraken%2fbabel-config-kraken',
            path,
            headers: {
                host: 'frontdoor.npm.js',
                authorization: `Bearer ${token}`,
            },
            name: `${org}/${repo}`
        };
        const gitLabNock = nock('http://gitlab.com')
            .get(`/api/v4/projects?search=${repo}`)
            .reply(200, [
                {
                    name: repo,
                    path_with_namespace: `${org}/${repo}`,
                    namespace: {
                        name: org,
                    },
                    permissions: {
                        project_access: {
                            access_level: 40,
                            notification_level: 3,
                        },
                        group_access: {
                            access_level: 30,
                            notification_level: 3,
                        },
                    },
            }],
        );
            const cb = jest.fn();
            await authorizer.authorize(credentials, cb);
            expect(cb).toBeCalledWith(null, true);
    });
});