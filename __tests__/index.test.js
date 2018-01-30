import { Authenticator, Authorizer, Session } from '../index';
import path from 'path';
import { config } from 'dotenv';

describe('index.js', () => {
    beforeAll(() => config({ path: path.resolve(__dirname, '.env.test') }));
    it('should export authenticator correctly', () => expect(typeof Authenticator).toBe('function'));
    it('should export Authorizer correctly', () => expect(typeof Authorizer).toBe('function'));
    it('should export Session correctly', () => expect(typeof Session).toBe('function'));
    it('should load environment variables correctly', () => {
        expect(process.env).toHaveProperty('GITLAB_URL');
        expect(process.env).toHaveProperty('GITLAB_ACCESS_TOKEN');
        expect(process.env).toHaveProperty('FRONT_DOOR_HOST');
    });
});
