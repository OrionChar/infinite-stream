import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, renameSync, appendFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import StorageWatcher from '../utils/storage-watcher.js';

describe('StorageWatcher', () => {
  let tempDir: string;
  let watcher: StorageWatcher;

  // Helper function to wait for a specific event
  const waitForEvent = (emitter: StorageWatcher, event: string, timeout = 500): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for event "${event}"`));
      }, timeout);

      emitter.once(event, (...args: any[]) => {
        clearTimeout(timer);
        resolve(args);
      });
    });
  };

  beforeEach(() => {
    // Create a real temporary directory before each test
    tempDir = mkdtempSync(join(tmpdir(), 'watcher-test-'));
  });

  afterEach(() => {
    // Stop the watcher and remove the temporary directory after each test
    watcher?.stop();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should emit "create" event when a file is created', async () => {
    watcher = new StorageWatcher(tempDir);
    const eventPromise = waitForEvent(watcher, 'create');

    writeFileSync(join(tempDir, 'newFile.txt'), 'data');

    const [filename] = await eventPromise;
    expect(filename).toBe('newFile.txt');
  });

  it('should emit "update" event when a file is modified', async () => {
    const filePath = join(tempDir, 'fileToUpdate.txt');
    writeFileSync(filePath, 'initial');

    watcher = new StorageWatcher(tempDir);
    const eventPromise = waitForEvent(watcher, 'update');

    appendFileSync(filePath, ' + new data');

    const [filename] = await eventPromise;
    expect(filename).toBe('fileToUpdate.txt');
  });

  it('should emit "delete" event when a file is deleted', async () => {
    const filePath = join(tempDir, 'fileToDelete.txt');
    writeFileSync(filePath, 'data');

    watcher = new StorageWatcher(tempDir);
    // Give a bit more time for deletion, as the class waits 50ms to check for a move event
    const eventPromise = waitForEvent(watcher, 'delete', 600);

    rmSync(filePath);

    const [filename] = await eventPromise;
    expect(filename).toBe('fileToDelete.txt');
  });

  it('should emit "move" event when a file is renamed', async () => {
    const oldPath = join(tempDir, 'oldName.txt');
    const newPath = join(tempDir, 'newName.txt');
    writeFileSync(oldPath, 'data');

    watcher = new StorageWatcher(tempDir);
    const eventPromise = waitForEvent(watcher, 'move', 600);

    // At the OS level, renameSync looks like the old file disappearing and a new one appearing
    renameSync(oldPath, newPath);

    const [oldFilename, newFilename] = await eventPromise;
    expect(oldFilename).toBe('oldName.txt');
    expect(newFilename).toBe('newName.txt');
  });

  it('should not emit events when a subdirectory is created (files only)', async () => {
    watcher = new StorageWatcher(tempDir);

    const spy = vi.fn();
    watcher.on('create', spy);

    mkdirSync(join(tempDir, 'newFolder'));

    // Wait a bit longer to ensure the watcher has time to process the OS event
    await new Promise((r) => setTimeout(r, 100));

    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit "error" if the provided path does not exist', async () => {
    const badPath = join(tempDir, 'non-existent-dir');

    watcher = new StorageWatcher(badPath);
    const eventPromise = waitForEvent(watcher, 'error');

    const [err] = await eventPromise;
    expect(err).toBeInstanceOf(Error);
  });

  it('should stop emitting events after stop() is called', async () => {
    watcher = new StorageWatcher(tempDir);

    const spy = vi.fn();
    watcher.on('create', spy);

    watcher.stop();

    // Create a file after closing
    writeFileSync(join(tempDir, 'afterClose.txt'), 'data');

    await new Promise((r) => setTimeout(r, 100));

    expect(spy).not.toHaveBeenCalled();
  });
});