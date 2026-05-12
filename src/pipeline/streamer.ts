import { exec, spawn } from "child_process";
import { FilePath } from "../types/alias.js";
import PipelineNode from "./pipeline-node.js";
import { err, ok, Result } from "neverthrow";
import path from "path";

export default class Streamer implements PipelineNode<FilePath, unknown> {
    private connectionEndpoint: string

    constructor(host: string, key: string) {
        this.connectionEndpoint = `${host}/${key}`
    }

    run(videoFilepath: FilePath): Promise<Result<number, unknown>> {
        return new Promise((resolve, reject) => {
            // const executingProcess = exec(`${path.join(process.env.BIN_FOLDER, 'ffmpeg/bin/ffmpeg')} -re -i ${videoFilepath} -c:v libx264 -preset veryfast -b:v 3500k -maxrate 3500k -bufsize 7000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 160k -ac 2 -ar 44100 -f flv ${this.connectionEndpoint}`)

            const executingProcess = spawn(
                path.join(process.env.BIN_FOLDER, 'ffmpeg/bin/ffmpeg'), [
                '-re',
                `-i`, videoFilepath,
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


            executingProcess.stderr.on('error', (error) => reject(err(error)))

            executingProcess.on('error', (error) => reject(err(error)))

            executingProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(ok(code))
                } else {
                    reject(err(code))
                }
            })
        })
    }
}