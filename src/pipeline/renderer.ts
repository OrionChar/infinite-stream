import { spawn } from 'child_process';
import path from 'path';
import { FilePath } from '../types/alias.js';
import PipelineNode from './pipeline-node.js';
import { err, ok, Result } from 'neverthrow';

class Renderer implements PipelineNode<RendererOptions, number> {
    run(options: RendererOptions): Promise<Result<number, unknown>> {
        const {sourceAudioLocation, destinationVideoLocation} = options

        return new Promise(async (resolve, reject) => {
            const folder = path.dirname(destinationVideoLocation)
            const videoFileName = path.basename(destinationVideoLocation)

            const executionProcess = spawn('python3', [
                path.join(process.env.PYTHON_FOLDER, 'render-video.py'),
                `--images=${path.join(process.env.MEDIA_FOLDER, 'lips')}`,
                `--rhubarb_path=${path.join(process.env.BIN_FOLDER, 'rhubarb-lip-sync/rhubarb')}`,
                `--output_folder=${folder}`,
                `--output_filename=${videoFileName}`,
                `--audio=${sourceAudioLocation}`,
            ]);

            executionProcess.stderr.on('error', (error) => reject(err(error)))

            executionProcess.on('error', (error) => reject(err(error)))  

            executionProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(ok(code))
                } else {
                    reject(err(code))
                }
            })
        })
    }
}

interface RendererOptions {
    sourceAudioLocation: FilePath, 
    destinationVideoLocation: FilePath
}

export default Renderer
