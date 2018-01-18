import nock from 'nock';
import {GitLab as api } from '../lib/api';
const org = 'npm-auth-test';
const repo = 'test-repo';
let gitlab;

describe('api.js', () => {

    beforeAll(() => {
        gitlab = new api({ url: 'http://gitlab.com' });
    });

    it('should return project info', async () => {
        const project = nock('http://gitlab.com')
            .get(`/api/v4/projects?search=${repo}`)
            .reply(200, [{
                name: repo,
                path_with_namespace: `${org}/${repo}`,
                namespace: {
                    name: org,
                },
            }]);
        // https://docs.gitlab.com/ce/api/projects.html#get-single-project
        const request = await gitlab.projectInfo('mock_token', org, repo);
        expect(request.path_with_namespace).toBe('npm-auth-test/test-repo');
        project.done();
    });
});