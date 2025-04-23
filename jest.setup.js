// Set up Jest globals
import { jest, expect, test, describe, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Set default timeout for all tests
jest.setTimeout(30000);

// Make jest available globally
global.jest = jest;
global.expect = expect;
global.test = test;
global.describe = describe;
global.beforeAll = beforeAll;
global.afterAll = afterAll;
global.beforeEach = beforeEach;
global.afterEach = afterEach; 