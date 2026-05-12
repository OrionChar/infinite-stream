import path from "path";
import { exec } from 'child_process';

export default function convertFlacToOgg(flacFilePath: string): Promise<string> {
    const scriptPath = path.join(process.env.SH_FOLDER, 'convert-flac-to-ogg.sh')

    return new Promise((resolve, reject) => {
        exec(
            `sh ${scriptPath} ${flacFilePath}`,
            { cwd: process.env.SH_FOLDER },
            (error, stdout, stderr) => {
                if (error) {
                    reject(error)
                    return;
                } else if (stderr) {
                    reject(stderr)
                    return;
                }

                resolve(stdout)
            });
    })

}
