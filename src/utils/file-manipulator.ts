import fs from 'fs'
import path from 'path'
import { ok, err, Result } from 'neverthrow';
import { FilePath } from '../types/alias.js';

export default class FileManipulator {
    readFile(filepath: FilePath): Promise<Result<FilePath, NodeJS.ErrnoException>> {
        return new Promise((resolve, reject) => {
            fs.readFile(filepath, 'utf-8', (error, content) => error ? reject(err(error)) : resolve(ok(content)))
        })
    }

    readJSON<J>(filepath: FilePath): Promise<Result<J, NodeJS.ErrnoException>> {
        return new Promise(async (resolve, reject) => {
            const result = await this.readFile(filepath)
            result.isOk() ? resolve(ok(JSON.parse(result.value) as J)) : reject(err(result.error))
        })
    }

    createFile(filepath: FilePath, data: string | NodeJS.ArrayBufferView): Promise<Result<FilePath, NodeJS.ErrnoException>> {
        return new Promise((resolve, reject) => {
            fs.writeFile(
                filepath,
                data,
                (error) => error ? reject(err(error)) : resolve(ok(filepath))
            )
        })

    }

    deleteFile(filepath: FilePath): Promise<Result<FilePath, NodeJS.ErrnoException>> {
        return new Promise((resolve, reject) => fs.rm(filepath, error => error ? reject(err(error)) : resolve(ok(filepath))))
    }

    moveFile(filepath: FilePath, destinationFolder: string): Promise<Result<FilePath, NodeJS.ErrnoException>> {
        const newFilepath = path.join(destinationFolder, path.basename(filepath))

        return new Promise((resolve, reject) => {
            fs.rename(
                filepath,
                newFilepath,
                error => error ? reject(err(error)) : resolve(ok(newFilepath))
            );
        })
    }
}