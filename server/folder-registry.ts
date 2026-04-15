import { basename } from 'path';
import { createHash } from 'crypto';

const registry = new Map<string, string>();

function folderNameFromPath(absolutePath: string): string {
  const base = basename(absolutePath);
  const hash = createHash('sha256').update(absolutePath).digest('hex').slice(0, 8);
  return `${base}-${hash}`;
}

export function register(absolutePath: string): string {
  const folderName = folderNameFromPath(absolutePath);
  registry.set(folderName, absolutePath);
  return folderName;
}

export function resolve(folderName: string): string | undefined {
  return registry.get(folderName);
}

export function clear(): void {
  registry.clear();
}
