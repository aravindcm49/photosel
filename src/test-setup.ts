import '@testing-library/jest-dom/vitest';

// Polyfill URL.createObjectURL and URL.revokeObjectURL for jsdom
if (typeof URL !== 'undefined' && !URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:mock';
}
if (typeof URL !== 'undefined' && !URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {};
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});