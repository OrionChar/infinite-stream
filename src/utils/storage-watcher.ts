import EventEmitter from "events";
import { watch, existsSync, statSync, FSWatcher, readdirSync } from 'fs';
import { join } from 'path';
import { FileName, FilePath } from "../types/alias.js";

// AI Generated

interface StorageWatcherEvents {
    'create': [filepath: FilePath, filename: FileName];
    'delete': [filepath: FilePath, filename: FileName];
    'update': [filepath: FilePath, filename: FileName];
    'move': [oldFilename: FileName, newFilename: FileName];
    'error': [error: Error];
}

// Extend EventEmitter using Declaration Merging
declare interface StorageWatcher {
    on<U extends keyof StorageWatcherEvents>(
        event: U, 
        listener: (...args: StorageWatcherEvents[U]) => void
    ): this;
    emit<U extends keyof StorageWatcherEvents>(
        event: U, 
        ...args: StorageWatcherEvents[U]
    ): boolean;
}

class StorageWatcher extends EventEmitter {
    private readonly dirPath: string;
    private watcher: FSWatcher | null = null;    
    private knownFiles: Set<string> = new Set();
    private pendingDeletes: Map<string, NodeJS.Timeout> = new Map();
    
    private readonly MOVE_DEBOUNCE_TIME = 50;

    constructor(dirPath: string) {
        super();
        this.dirPath = dirPath;
        this.initialize();
    }

    private initialize(): void {
        try {
            this.syncState();
            
            this.watcher = watch(this.dirPath, (eventType, filename) => {
                // Some OS's get null instead of a file name
                if (!filename) return; 
                
                this.handleEvent(eventType, filename);
            });

            this.watcher.on('error', (err) => {
                this.emit('error', err);
            });

        } catch (err) {
            this.emit('error', err instanceof Error ? err : new Error(String(err)));
        }
    }

    private syncState(): void {
        try {
            const entries = statSync(this.dirPath).isDirectory() 
                ? readdirSync(this.dirPath) 
                : [];
                
            this.knownFiles = new Set(
                entries.filter(file => {
                    try {
                        return statSync(join(this.dirPath, file)).isFile();
                    } catch {
                        return false;
                    }
                })
            );
        } catch (err) {
            this.emit('error', err instanceof Error ? err : new Error(String(err)));
        }
    }


    private handleEvent(eventType: string, filename: string): void {
        const filePath = join(this.dirPath, filename);
        const fileExists = existsSync(filePath);
        
        if (fileExists) {
            try {
                if (!statSync(filePath).isFile()) return;
            } catch {
                return;
            }
        }

        if (eventType === 'change') {
            if (this.knownFiles.has(filename)) {
                this.emit('update', join(this.dirPath, filename), filename);
            }
        } 
        else if (eventType === 'rename') {
            if (fileExists) {
                if (!this.knownFiles.has(filename)) {
                    if (this.pendingDeletes.size > 0) {
                        const [oldFilename, timer] = this.pendingDeletes.entries().next().value;
                        
                        clearTimeout(timer);
                        this.pendingDeletes.delete(oldFilename);
                        this.knownFiles.add(filename);
                        
                        this.emit('move', oldFilename, filename);
                    } else {
                        this.knownFiles.add(filename);
                        this.emit('create', join(this.dirPath, filename), filename);
                    }
                }
            } else {
                if (this.knownFiles.has(filename)) {
                    this.knownFiles.delete(filename);
                    
                    const timer = setTimeout(() => {
                        this.pendingDeletes.delete(filename);
                        this.emit('delete', join(this.dirPath, filename), filename);
                    }, this.MOVE_DEBOUNCE_TIME);
                    
                    this.pendingDeletes.set(filename, timer);
                }
            }
        }
    }

    public stop(): void {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }

        for (const timer of this.pendingDeletes.values()) {
            clearTimeout(timer);
        }

        this.pendingDeletes.clear();
        this.removeAllListeners();
    }
}

export default StorageWatcher;