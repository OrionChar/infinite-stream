import { spawn } from 'child_process';
import path from 'path';
import { FilePath } from '../types/alias.js';
import PipelineNode from './pipeline-node.js';
import { ok, Result } from 'neverthrow';
import { LipSyncResult, MouthCue, MouthShape } from '../types/rhubarb-events.js';
import { once } from 'events';

class Renderer implements PipelineNode<RendererOptions, number> {
    constructor(private translationEndpoint: string) { }

    async run(options: RendererOptions): Promise<Result<number, unknown>> {

        if (options.lipSync.mouthCues.length === 0) {
            throw new Error('No mouth cues')
        }

        await this.generateVideoSequence(options.lipSync.mouthCues, this.translationEndpoint, options.audioLocation)

        return ok(1)
    }

    private async generateVideoSequence(mouthCues: MouthCue[], outputLocation: string, audioLocation: FilePath) {
        const executionProcess = spawn(path.join(process.env.BIN_FOLDER, 'ffmpeg/bin/ffmpeg'), [
            '-protocol_whitelist', 'file,pipe',
            '-f', 'concat',
            '-safe', '0',
            '-i', 'pipe:0',
            '-i', audioLocation,
            '-c:v', 'libx264',
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
            '-r', '24',
            outputLocation
        ])

        for (const mouthCue of mouthCues) {
            const writingResult = executionProcess.stdin.write(this.generateConcatDemuxerRules(mouthCue))

            if (!writingResult) {
                await once(executionProcess.stdin, 'drain')
            }
        }

        executionProcess.stdin.end()

        executionProcess.stderr.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                console.log('stderr', chunk.toString())
            }
        })

        executionProcess.stdout.on('data', (chunk) => console.log('stdout', chunk))
    }

    private generateConcatDemuxerRules(mouthCue: MouthCue) {
        return `file 'file:${this.choiceMouthShape(mouthCue.value)}'\nduration ${mouthCue.end - mouthCue.start}\n`
    }

    private choiceMouthShape(mouthShape: MouthShape) {
        switch (mouthShape) {
            case MouthShape.A:
                return path.join(process.env.MEDIA_FOLDER, 'lips/A.png');

            case MouthShape.B:
                return path.join(process.env.MEDIA_FOLDER, 'lips/B.png');

            case MouthShape.C:
                return path.join(process.env.MEDIA_FOLDER, 'lips/C.png');

            case MouthShape.D:
                return path.join(process.env.MEDIA_FOLDER, 'lips/D.png');

            case MouthShape.E:
                return path.join(process.env.MEDIA_FOLDER, 'lips/E.png');

            case MouthShape.F:
                return path.join(process.env.MEDIA_FOLDER, 'lips/F.png');

            case MouthShape.G:
                return path.join(process.env.MEDIA_FOLDER, 'lips/G.png');

            case MouthShape.H:
                return path.join(process.env.MEDIA_FOLDER, 'lips/H.png');

            default:
                return path.join(process.env.MEDIA_FOLDER, 'lips/X.png');
        }
    }
}

interface RendererOptions {
    audioLocation: FilePath,
    lipSync: LipSyncResult
}

export default Renderer
