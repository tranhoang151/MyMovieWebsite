/// <reference types="jest" />
import { jest } from '@jest/globals';

export const PrismaService = jest.fn().mockImplementation(() => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));