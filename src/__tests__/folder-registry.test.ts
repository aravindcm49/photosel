// @vitest-environment node

import { describe, it, expect, beforeEach } from 'vitest';
import { register, resolve, clear } from '../../server/folder-registry';

describe('Folder Registry', () => {
  beforeEach(() => {
    clear();
  });

  it('register returns a folderName derived from the path', () => {
    const name = register('/home/user/photos/wedding-2026');
    expect(name).toContain('wedding-2026');
  });

  it('resolve returns the absolute path for a registered folderName', () => {
    const name = register('/home/user/photos/wedding-2026');
    const resolved = resolve(name);
    expect(resolved).toBe('/home/user/photos/wedding-2026');
  });

  it('resolve returns undefined for an unregistered folderName', () => {
    const resolved = resolve('does-not-exist');
    expect(resolved).toBeUndefined();
  });

  it('registering the same path twice returns the same folderName', () => {
    const name1 = register('/home/user/photos/wedding');
    const name2 = register('/home/user/photos/wedding');
    expect(name1).toBe(name2);
  });

  it('different paths produce different folderNames', () => {
    const name1 = register('/home/user/photos/wedding-a');
    const name2 = register('/home/user/photos/wedding-b');
    expect(name1).not.toBe(name2);
  });
});
