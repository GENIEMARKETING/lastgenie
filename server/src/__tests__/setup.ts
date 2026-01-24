// Test setup file
// This file runs before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/lastgenie_test';
process.env.CLIENT_URL = 'http://localhost:3000';

// Mock external services for testing
jest.mock('../services/stripe', () => ({
  createCheckoutSession: jest.fn(),
  createSubscription: jest.fn(),
  getCheckoutSession: jest.fn(),
  handleWebhook: jest.fn(),
  createCustomer: jest.fn(),
}));

jest.mock('../services/shippo', () => ({
  getShippingRates: jest.fn(),
  validateAddress: jest.fn(),
  createLabel: jest.fn(),
  trackShipment: jest.fn(),
}));

jest.mock('../services/age-verification', () => ({
  verifyAge: jest.fn(),
  updateVerificationStatus: jest.fn(),
  getVerificationStatus: jest.fn(),
}));