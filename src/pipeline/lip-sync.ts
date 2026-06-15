import { spawn } from "child_process";
import path from "path";
import PipelineNode from "./pipeline-node.js";
import { isProgressEvent, isFailureEvent, isStartEvent, isSuccessEvent, RhubarbEvent, LipSyncResult, FailureEvent } from "../types/rhubarb-events.js";
import { FilePath } from "../types/alias.js";
import { ok, err, Result } from "neverthrow";

export interface LipSyncOptions {
    audioFilepath: FilePath,
    script?: string
}

export default class LipSync implements PipelineNode<LipSyncOptions, LipSyncResult> {
    constructor() { }

    run(options: LipSyncOptions): Promise<Result<LipSyncResult, FailureEvent>> {
        return new Promise((resolve, reject) => {
            const executionProcess = spawn(
                path.join(process.env.BIN_FOLDER, 'rhubarb-lip-sync/rhubarb'),
                [
                    `--extendedShapes`, 'GHX',
                    `-f`, 'json',
                    `--machineReadable`,
                    options.audioFilepath
                ],
            );

            let jsonStringBuffer = ''

            executionProcess.stderr.on('data', (logs) => {
                if (!Buffer.isBuffer(logs)) {
                    return
                }

                logs.toString().split('\n').forEach(log => {
                    try {
                        const isEmptyString = log.length <= 2

                        if (isEmptyString) {
                            return
                        }

                        const event = JSON.parse(log) as RhubarbEvent

                        if (isStartEvent(event)) {
                            //onStart
                        } else if (isProgressEvent(event)) {
                            //onProgress
                        } else if (isFailureEvent(event)) {
                            reject(err(event))
                        } else if (isSuccessEvent(event)) {
                            //onFinished
                            resolve(ok(JSON.parse(jsonStringBuffer) as LipSyncResult));
                            jsonStringBuffer = ''
                        }
                    } catch (error) {
                        console.error(error)
                    }
                })
            })

            executionProcess.stdout.on('data', (visemesSyncData) => {
                if (Buffer.isBuffer(visemesSyncData)) {
                    jsonStringBuffer += visemesSyncData.toString()
                }
            })
        })
    }
}
