// Test setup file
const path = require('path');

// Load test environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test timeout
jest.setTimeout(30000);

// Mock external services
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    on: jest.fn(),
    quit: jest.fn()
  }))
}));

jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn()
  }));
});

// Mock WhatsApp Baileys
jest.mock('@whiskeysockets/baileys', () => ({
  default: jest.fn(),
  makeWASocket: jest.fn(),
  useMultiFileAuthState: jest.fn(),
  DisconnectReason: {
    badSession: 'badSession',
    connectionClosed: 'connectionClosed',
    connectionLost: 'connectionLost',
    connectionReplaced: 'connectionReplaced',
    loggedOut: 'loggedOut',
    restartRequired: 'restartRequired',
    timedOut: 'timedOut'
  },
  Browsers: {
    ubuntu: jest.fn()
  }
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}));

// Database mock setup
const mockDb = {
  query: jest.fn(),
  execute: jest.fn(),
  end: jest.fn(),
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn()
};

// Mock database connection
jest.mock('../src/config/database.js', () => ({
  query: mockDb.query,
  execute: mockDb.execute,
  end: mockDb.end,
  beginTransaction: mockDb.beginTransaction,
  commit: mockDb.commit,
  rollback: mockDb.rollback
}));

// Export mocks for use in tests
global.mockDb = mockDb;

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});