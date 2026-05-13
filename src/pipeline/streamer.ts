import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { FilePath } from "../types/alias.js";
import PipelineNode from "./pipeline-node.js";
import { err, ok, Result } from "neverthrow";
import path from "path";
import fs from 'fs'

export default class Streamer implements PipelineNode<FilePath, unknown> {
    private connectionEndpoint: string
    private ffmpegProcess: ChildProcessWithoutNullStreams

    constructor(host: string, key: string) {
        this.connectionEndpoint = `${host}/${key}`
        this.ffmpegProcess = spawn(
            path.join(process.env.BIN_FOLDER, 'ffmpeg/bin/ffmpeg'), [
            '-re',
            `-i`, 'pipe:0',
            `-c:v`, 'libx264',
            `-preset`, 'ultrafast',
            '-tune', 'zerolatency',
            `-b:v`, '3500k',
            '-maxrate', '3500k',
            '-bufsize', '7000k',
            '-pix_fmt', 'yuv420p',
            '-g', '50',
            '-c:a', 'aac',
            '-b:a', '160k',
            '-ac', '2',
            '-ar', '44100',
            `-f`, 'flv',
            this.connectionEndpoint
        ])

        //TODO: Log this using a special tool
        this.ffmpegProcess.on('error', (error) => console.error(error))
        this.ffmpegProcess.stderr.on('error', (error) => console.log(error))
    }

    run(videoFilepath: FilePath): Promise<Result<number, Error>> {
        return new Promise((resolve, reject) => {
            const videoStream = fs.createReadStream(videoFilepath)
            videoStream.pipe(this.ffmpegProcess.stdin)
            videoStream.on('data', (chunk) => console.log(chunk))
            videoStream.on('end', () => resolve(ok(0)))
            videoStream.on('error', (error) => reject(err(error)))
        })
    }
}