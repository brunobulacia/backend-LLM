// Mock para fs
export const existsSync = jest.fn();
export const readFileSync = jest.fn();
export const createReadStream = jest.fn();
export const statSync = jest.fn();

// Mock de fs con namespace
const fs = {
  existsSync,
  readFileSync,
  createReadStream,
  statSync,
};

export default fs;
