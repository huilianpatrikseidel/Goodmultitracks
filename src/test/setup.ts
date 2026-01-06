import '@testing-library/jest-dom';

// Type declaration for jest
declare const jest: any;

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn(() => ({
    gain: { value: 1 },
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  createBufferSource: jest.fn(() => ({
    buffer: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createOscillator: jest.fn(() => ({
    type: 'sine',
    frequency: { value: 440 },
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: jest.fn(() => Promise.resolve()),
  suspend: jest.fn(() => Promise.resolve()),
  close: jest.fn(() => Promise.resolve()),
})) as any;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock crypto.randomUUID
global.crypto = {
  ...global.crypto,
  randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substring(7)),
} as any;
