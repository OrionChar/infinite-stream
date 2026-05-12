import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs'
import FileManipulator from '../utils/file-manipulator.js';

interface MouthCues {
    metadata: {
        soundFile: string,
        duration: number
    },
    mouthCues: Array<{ 
        start: number, 
        end: number, 
        value: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'X'
    }>
}

export default async function generateLipSyncMetadata(audioFilePath: string, outputName: string = 'lipsync'): Promise<MouthCues> {
    const rhubarbPath = '/home/user/Documents/Projects/infinite-ai-stream/bin/rhubarb-lip-sync/rhubarb'
    const rhubarbOutputJson = path.resolve('/home/user/Documents/Projects/infinite-ai-stream/storage/video', `${outputName}.json`);

    
    try {
        const fileManipulator = new FileManipulator()
        const result =  await fileManipulator.readJSON<MouthCues>(rhubarbOutputJson)

        if (result.isOk()) {
            return result.value
        }
    } catch (error) {
        // Run Rhubarb via command line. 
        // -o output.json -f json specifies JSON output format.
        execSync(`"${rhubarbPath}" -o "${rhubarbOutputJson}" -f json "${audioFilePath}"`, {
            stdio: 'inherit' // Shows Rhubarb's progress in the console
        });

        return JSON.parse(fs.readFileSync(rhubarbOutputJson, 'utf8')) as MouthCues;
    }
}