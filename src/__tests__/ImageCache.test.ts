import { describe, it, expect, beforeEach, vi } from 'vitest';
import { imageCache } from '../lib/image-cache';

describe('ImageCache', () => {
  beforeEach(() => {
    imageCache.clear();
  });

  it('stores and retrieves URLs', () => {
    imageCache.set('photo1.jpg', 'blob:url1');
    expect(imageCache.get('photo1.jpg')).toBe('blob:url1');
  });

  it('returns undefined for missing keys', () => {
    expect(imageCache.get('missing.jpg')).toBeUndefined();
  });

  it('reports size correctly', () => {
    expect(imageCache.size).toBe(0);
    imageCache.set('a.jpg', 'blob:a');
    expect(imageCache.size).toBe(1);
    imageCache.set('b.jpg', 'blob:b');
    expect(imageCache.size).toBe(2);
  });

  it('evicts LRU entry when cache exceeds max size', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    // Max cache size is 10
    for (let i = 0; i < 11; i++) {
      imageCache.set(`photo${i}.jpg`, `blob:url${i}`);
    }

    // First entry should be evicted
    expect(imageCache.get('photo0.jpg')).toBeUndefined();
    expect(imageCache.get('photo1.jpg')).toBe('blob:url1');
    expect(imageCache.size).toBe(10);
    expect(revokeSpy).toHaveBeenCalledWith('blob:url0');
  });

  it('moves accessed entry to end of LRU', () => {
    // Fill cache with 10 items
    for (let i = 0; i < 10; i++) {
      imageCache.set(`photo${i}.jpg`, `blob:url${i}`);
    }

    // Access the first entry (least recently used)
    imageCache.get('photo0.jpg');

    // Add one more - should evict photo1 (now LRU), not photo0
    imageCache.set('photo10.jpg', 'blob:url10');
    expect(imageCache.get('photo0.jpg')).toBe('blob:url0');
    expect(imageCache.get('photo1.jpg')).toBeUndefined();
  });

  it('has returns true for existing entries', () => {
    imageCache.set('test.jpg', 'blob:test');
    expect(imageCache.has('test.jpg')).toBe(true);
    expect(imageCache.has('nope.jpg')).toBe(false);
  });

  it('clear removes all entries', () => {
    imageCache.set('a.jpg', 'blob:a');
    imageCache.set('b.jpg', 'blob:b');
    imageCache.clear();
    expect(imageCache.size).toBe(0);
    expect(imageCache.get('a.jpg')).toBeUndefined();
  });

  it('updating existing entry moves it to end', () => {
    imageCache.set('a.jpg', 'blob:a1');
    imageCache.set('b.jpg', 'blob:b1');

    // Update 'a' - it should now be most recently used
    imageCache.set('a.jpg', 'blob:a2');

    // Fill to max
    for (let i = 2; i < 10; i++) {
      imageCache.set(`photo${i}.jpg`, `blob:p${i}`);
    }

    // Add one more should evict 'b' not 'a'
    imageCache.set('photo10.jpg', 'blob:p10');
    expect(imageCache.get('a.jpg')).toBe('blob:a2');
    expect(imageCache.get('b.jpg')).toBeUndefined();
  });
});