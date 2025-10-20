import { expect } from 'chai';
import { PathAppService } from '../../../Application/Services/PathAppService';
import { IPathRepository } from '../../../Domain/Interfaces/IPathRepository';

// Mock implementation of IPathRepository for testing
class MockPathRepository implements IPathRepository {
  private readonly mockResponses: Map<string, unknown> = new Map();

  setMockResponse(method: string, args: unknown[], result: unknown): void {
    const key = `${method}:${JSON.stringify(args)}`;
    this.mockResponses.set(key, result);
  }

  private getMockResponse(method: string, args: unknown[]): unknown {
    const key = `${method}:${JSON.stringify(args)}`;
    return this.mockResponses.get(key);
  }

  join(...paths: string[]): string {
    const mockResult = this.getMockResponse('join', paths);
    if (mockResult !== undefined) return mockResult as string;

    // Default behavior similar to Node.js path.join
    return paths
      .filter(p => p)
      .join('/')
      .replace(/\/+/g, '/');
  }

  dirname(filePath: string): string {
    const mockResult = this.getMockResponse('dirname', [filePath]);
    if (mockResult !== undefined) return mockResult as string;

    // Default behavior similar to Node.js path.dirname
    const parts = filePath.split('/');
    return parts.slice(0, -1).join('/') || '/';
  }

  resolve(...paths: string[]): string {
    const mockResult = this.getMockResponse('resolve', paths);
    if (mockResult !== undefined) return mockResult as string;

    // Default behavior - simple resolution
    return this.join(...paths);
  }

  isAbsolute(rawFolderPath: string): boolean {
    const mockResult = this.getMockResponse('isAbsolute', [rawFolderPath]);
    if (mockResult !== undefined) return mockResult as boolean;

    // Default behavior - check if starts with / or C: (Windows)
    return rawFolderPath.startsWith('/') || /^[A-Za-z]:/.test(rawFolderPath);
  }

  basename(dirPath: string, suffix?: string): string {
    const mockResult = this.getMockResponse('basename', [dirPath, suffix]);
    if (mockResult !== undefined) return mockResult as string;

    // Default behavior similar to Node.js path.basename
    const parts = dirPath.split('/');
    let base = parts[parts.length - 1] || '';
    if (suffix && base.endsWith(suffix)) {
      base = base.slice(0, -suffix.length);
    }
    return base;
  }
}

describe('PathAppService', () => {
  let service: PathAppService;
  let mockRepository: MockPathRepository;

  beforeEach(() => {
    mockRepository = new MockPathRepository();
    service = new PathAppService(mockRepository);
  });

  describe('join', () => {
    it('should delegate to path repository join method', () => {
      const paths = ['src', 'app', 'components'];
      const expectedResult = 'src/app/components';

      mockRepository.setMockResponse('join', paths, expectedResult);

      const result = service.join(...paths);

      expect(result).to.equal(expectedResult);
    });

    it('should handle empty paths', () => {
      const paths: string[] = [];
      const expectedResult = '';

      mockRepository.setMockResponse('join', paths, expectedResult);

      const result = service.join(...paths);

      expect(result).to.equal(expectedResult);
    });

    it('should handle single path', () => {
      const paths = ['single-path'];
      const expectedResult = 'single-path';

      mockRepository.setMockResponse('join', paths, expectedResult);

      const result = service.join(...paths);

      expect(result).to.equal(expectedResult);
    });

    it('should handle multiple path segments', () => {
      const paths = ['root', 'folder1', 'folder2', 'file.txt'];
      const expectedResult = 'root/folder1/folder2/file.txt';

      mockRepository.setMockResponse('join', paths, expectedResult);

      const result = service.join(...paths);

      expect(result).to.equal(expectedResult);
    });

    it('should handle paths with separators', () => {
      const paths = ['src/', '/app/', 'components/'];
      const expectedResult = 'src/app/components';

      mockRepository.setMockResponse('join', paths, expectedResult);

      const result = service.join(...paths);

      expect(result).to.equal(expectedResult);
    });

    it('should handle Windows-style paths', () => {
      const paths = ['C:', 'Users', 'Documents', 'file.txt'];
      const expectedResult = 'C:/Users/Documents/file.txt';

      mockRepository.setMockResponse('join', paths, expectedResult);

      const result = service.join(...paths);

      expect(result).to.equal(expectedResult);
    });
  });

  describe('dirname', () => {
    it('should delegate to path repository dirname method', () => {
      const filePath = '/home/user/documents/file.txt';
      const expectedResult = '/home/user/documents';

      mockRepository.setMockResponse('dirname', [filePath], expectedResult);

      const result = service.dirname(filePath);

      expect(result).to.equal(expectedResult);
    });

    it('should handle root directory', () => {
      const filePath = '/file.txt';
      const expectedResult = '/';

      mockRepository.setMockResponse('dirname', [filePath], expectedResult);

      const result = service.dirname(filePath);

      expect(result).to.equal(expectedResult);
    });

    it('should handle relative paths', () => {
      const filePath = 'folder/subfolder/file.txt';
      const expectedResult = 'folder/subfolder';

      mockRepository.setMockResponse('dirname', [filePath], expectedResult);

      const result = service.dirname(filePath);

      expect(result).to.equal(expectedResult);
    });

    it('should handle Windows-style paths', () => {
      const filePath = 'C:\\Users\\Documents\\file.txt';
      const expectedResult = 'C:\\Users\\Documents';

      mockRepository.setMockResponse('dirname', [filePath], expectedResult);

      const result = service.dirname(filePath);

      expect(result).to.equal(expectedResult);
    });

    it('should handle file in current directory', () => {
      const filePath = 'file.txt';
      const expectedResult = '.';

      mockRepository.setMockResponse('dirname', [filePath], expectedResult);

      const result = service.dirname(filePath);

      expect(result).to.equal(expectedResult);
    });
  });

  describe('resolve', () => {
    it('should delegate to path repository resolve method', () => {
      const paths = ['src', 'app', 'components'];
      const expectedResult = '/absolute/path/src/app/components';

      mockRepository.setMockResponse('resolve', paths, expectedResult);

      const result = service.resolve(...paths);

      expect(result).to.equal(expectedResult);
    });

    it('should handle absolute path resolution', () => {
      const paths = ['/home/user', 'documents', 'file.txt'];
      const expectedResult = '/home/user/documents/file.txt';

      mockRepository.setMockResponse('resolve', paths, expectedResult);

      const result = service.resolve(...paths);

      expect(result).to.equal(expectedResult);
    });

    it('should handle relative path resolution', () => {
      const paths = ['../parent', 'folder', 'file.txt'];
      const expectedResult = '/current/parent/folder/file.txt';

      mockRepository.setMockResponse('resolve', paths, expectedResult);

      const result = service.resolve(...paths);

      expect(result).to.equal(expectedResult);
    });

    it('should handle empty paths', () => {
      const paths: string[] = [];
      const expectedResult = '/current/working/directory';

      mockRepository.setMockResponse('resolve', paths, expectedResult);

      const result = service.resolve(...paths);

      expect(result).to.equal(expectedResult);
    });

    it('should handle mixed absolute and relative paths', () => {
      const paths = ['/root', '../parent', 'folder'];
      const expectedResult = '/parent/folder';

      mockRepository.setMockResponse('resolve', paths, expectedResult);

      const result = service.resolve(...paths);

      expect(result).to.equal(expectedResult);
    });
  });

  describe('isAbsolute', () => {
    it('should delegate to path repository isAbsolute method', () => {
      const rawFolderPath = '/absolute/path';
      const expectedResult = true;

      mockRepository.setMockResponse(
        'isAbsolute',
        [rawFolderPath],
        expectedResult
      );

      const result = service.isAbsolute(rawFolderPath);

      expect(result).to.equal(expectedResult);
    });

    it('should return true for Unix absolute paths', () => {
      const paths = ['/home/user', '/var/log', '/etc/config'];

      paths.forEach(path => {
        mockRepository.setMockResponse('isAbsolute', [path], true);
        expect(service.isAbsolute(path)).to.be.true;
      });
    });

    it('should return true for Windows absolute paths', () => {
      const paths = ['C:\\Users\\Documents', 'D:\\Projects', 'E:\\'];

      paths.forEach(path => {
        mockRepository.setMockResponse('isAbsolute', [path], true);
        expect(service.isAbsolute(path)).to.be.true;
      });
    });

    it('should return false for relative paths', () => {
      const paths = ['src/app', '../parent', './current', 'file.txt'];

      paths.forEach(path => {
        mockRepository.setMockResponse('isAbsolute', [path], false);
        expect(service.isAbsolute(path)).to.be.false;
      });
    });

    it('should handle empty string', () => {
      const path = '';
      mockRepository.setMockResponse('isAbsolute', [path], false);

      const result = service.isAbsolute(path);

      expect(result).to.be.false;
    });

    it('should handle edge cases', () => {
      const edgeCases = [
        { path: '/', expected: true },
        { path: '\\', expected: false },
        { path: 'C:', expected: true },
        { path: 'c:', expected: true },
        { path: ':', expected: false },
      ];

      edgeCases.forEach(({ path, expected }) => {
        mockRepository.setMockResponse('isAbsolute', [path], expected);
        expect(service.isAbsolute(path)).to.equal(expected);
      });
    });
  });

  describe('basename', () => {
    it('should delegate to path repository basename method', () => {
      const dirPath = '/home/user/documents/file.txt';
      const suffix = '.txt';
      const expectedResult = 'file';

      mockRepository.setMockResponse(
        'basename',
        [dirPath, suffix],
        expectedResult
      );

      const result = service.basename(dirPath, suffix);

      expect(result).to.equal(expectedResult);
    });

    it('should return filename without suffix when suffix provided', () => {
      const testCases = [
        { path: '/path/to/file.txt', suffix: '.txt', expected: 'file' },
        { path: '/path/to/document.pdf', suffix: '.pdf', expected: 'document' },
        { path: 'image.png', suffix: '.png', expected: 'image' },
      ];

      testCases.forEach(({ path, suffix, expected }) => {
        mockRepository.setMockResponse('basename', [path, suffix], expected);
        expect(service.basename(path, suffix)).to.equal(expected);
      });
    });

    it('should return full filename when no suffix provided', () => {
      const testCases = [
        { path: '/path/to/file.txt', expected: 'file.txt' },
        { path: '/path/to/document.pdf', expected: 'document.pdf' },
        { path: 'image.png', expected: 'image.png' },
      ];

      testCases.forEach(({ path, expected }) => {
        mockRepository.setMockResponse('basename', [path, undefined], expected);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(service.basename(path, undefined as any)).to.equal(expected);
      });
    });

    it('should handle directory paths', () => {
      const testCases = [
        { path: '/home/user/documents/', expected: 'documents' },
        { path: '/var/log', expected: 'log' },
        { path: 'src/app', expected: 'app' },
      ];

      testCases.forEach(({ path, expected }) => {
        mockRepository.setMockResponse('basename', [path, undefined], expected);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(service.basename(path, undefined as any)).to.equal(expected);
      });
    });

    it('should handle Windows-style paths', () => {
      const testCases = [
        {
          path: 'C:\\Users\\Documents\\file.txt',
          suffix: '.txt',
          expected: 'file',
        },
        { path: 'D:\\Projects\\app.js', suffix: '.js', expected: 'app' },
      ];

      testCases.forEach(({ path, suffix, expected }) => {
        mockRepository.setMockResponse('basename', [path, suffix], expected);
        expect(service.basename(path, suffix)).to.equal(expected);
      });
    });

    it('should handle edge cases', () => {
      const testCases = [
        { path: '/', expected: '' },
        { path: '', expected: '' },
        { path: 'file', expected: 'file' },
        { path: '.hidden', suffix: '', expected: '.hidden' },
      ];

      testCases.forEach(({ path, suffix, expected }) => {
        mockRepository.setMockResponse('basename', [path, suffix], expected);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(service.basename(path, suffix as any)).to.equal(expected);
      });
    });

    it('should handle suffix that does not match', () => {
      const path = '/path/to/file.txt';
      const suffix = '.js';
      const expected = 'file.txt';

      mockRepository.setMockResponse('basename', [path, suffix], expected);

      const result = service.basename(path, suffix);

      expect(result).to.equal(expected);
    });
  });

  describe('Cross-platform path handling', () => {
    it('should handle mixed Unix and Windows path operations', () => {
      // Test joining Unix and Windows style paths
      const unixPaths = ['src', 'app', 'components'];
      mockRepository.setMockResponse('join', unixPaths, 'src/app/components');
      expect(service.join(...unixPaths)).to.equal('src/app/components');

      const windowsPaths = ['C:', 'Users', 'Documents'];
      mockRepository.setMockResponse(
        'join',
        windowsPaths,
        'C:/Users/Documents'
      );
      expect(service.join(...windowsPaths)).to.equal('C:/Users/Documents');
    });

    it('should handle absolute path detection across platforms', () => {
      // Unix absolute paths
      mockRepository.setMockResponse('isAbsolute', ['/home/user'], true);
      expect(service.isAbsolute('/home/user')).to.be.true;

      // Windows absolute paths
      mockRepository.setMockResponse('isAbsolute', ['C:\\Users'], true);
      expect(service.isAbsolute('C:\\Users')).to.be.true;

      // Relative paths
      mockRepository.setMockResponse('isAbsolute', ['src/app'], false);
      expect(service.isAbsolute('src/app')).to.be.false;
    });

    it('should handle dirname across different path styles', () => {
      // Unix style
      mockRepository.setMockResponse(
        'dirname',
        ['/home/user/file.txt'],
        '/home/user'
      );
      expect(service.dirname('/home/user/file.txt')).to.equal('/home/user');

      // Windows style
      mockRepository.setMockResponse(
        'dirname',
        ['C:\\Users\\file.txt'],
        'C:\\Users'
      );
      expect(service.dirname('C:\\Users\\file.txt')).to.equal('C:\\Users');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle null and undefined inputs gracefully', () => {
      // Note: In real implementation, these might throw errors
      // Here we test that the service properly delegates to repository
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockRepository.setMockResponse('join', [null as any], 'error-handled');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(service.join(null as any)).to.equal('error-handled');

      mockRepository.setMockResponse(
        'dirname',
        [undefined as unknown],
        'error-handled'
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(service.dirname(undefined as any)).to.equal('error-handled');
    });

    it('should handle very long paths', () => {
      const longPath = 'a/'.repeat(1000) + 'file.txt';
      const expectedDirname = 'a/'.repeat(999).slice(0, -1); // Remove trailing slash

      mockRepository.setMockResponse('dirname', [longPath], expectedDirname);
      expect(service.dirname(longPath)).to.equal(expectedDirname);
    });

    it('should handle special characters in paths', () => {
      const specialPaths = [
        'path with spaces/file.txt',
        'path-with-dashes/file.txt',
        'path_with_underscores/file.txt',
        'path.with.dots/file.txt',
        'path@with#symbols$/file.txt',
      ];

      specialPaths.forEach((path, index) => {
        const expected = `handled-${index}`;
        mockRepository.setMockResponse('dirname', [path], expected);
        expect(service.dirname(path)).to.equal(expected);
      });
    });
  });
});
