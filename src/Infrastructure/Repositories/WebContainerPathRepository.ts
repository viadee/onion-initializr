import { IPathRepository } from '../../Domain/Interfaces/IPathRepository';

/**
 * WebContainer-compatible path repository that implements path operations
 * without relying on Node.js path module
 */
export class WebContainerPathRepository implements IPathRepository {
  dirname(filePath: string): string {
    // Normalize path separators to forward slashes
    const normalized = filePath.replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');
    if (lastSlash === -1) {
      return '.';
    }
    if (lastSlash === 0) {
      return '/';
    }
    return normalized.substring(0, lastSlash);
  }

  resolve(...paths: string[]): string {
    let resolved = '';
    let resolvedAbsolute = false;

    // Process paths from right to left until we have an absolute path
    for (let i = paths.length - 1; i >= 0 && !resolvedAbsolute; i--) {
      const path = paths[i];
      if (!path) continue;

      resolved = path + '/' + resolved;
      resolvedAbsolute = path.startsWith('/');
    }

    // Resolve . and .. components
    resolved = this.normalizePath(resolved || '.');

    return resolvedAbsolute ? '/' + resolved : resolved;
  }

  isAbsolute(rawFolderPath: string): boolean {
    return rawFolderPath.startsWith('/') || /^[A-Za-z]:/.test(rawFolderPath);
  }

  join(...paths: string[]): string {
    if (paths.length === 0) return '.';

    let joined = '';
    for (const path of paths) {
      if (!path) continue;

      if (joined) {
        joined += '/' + path;
      } else {
        joined = path;
      }
    }

    return this.normalizePath(joined) || '.';
  }

  basename(dirPath: string, suffix: string = ''): string {
    const normalized = dirPath.replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');
    let base =
      lastSlash === -1 ? normalized : normalized.substring(lastSlash + 1);

    if (suffix && base.endsWith(suffix)) {
      base = base.substring(0, base.length - suffix.length);
    }

    return base;
  }

  /**
   * Normalize path by resolving . and .. components
   */
  private normalizePath(path: string): string {
    const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
    const normalized: string[] = [];

    for (const part of parts) {
      if (part === '.') {
        continue;
      } else if (part === '..') {
        if (
          normalized.length > 0 &&
          normalized[normalized.length - 1] !== '..'
        ) {
          normalized.pop();
        } else {
          normalized.push('..');
        }
      } else {
        normalized.push(part);
      }
    }

    return normalized.join('/');
  }
}
