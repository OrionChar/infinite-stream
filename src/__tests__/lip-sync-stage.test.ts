import { describe, expect, test, beforeAll } from 'vitest';
import LipSyncStage from '../pipeline/stages/lip-sync-stage.js';
import { DubbingOutput, LipSyncInput } from '../pipeline/stages/types.js';
import path from 'path';
import FileManipulator from '../utils/file-manipulator.js';
import { StageEvents } from '../pipeline/stages/types.js';

type EventsNames = keyof StageEvents<any, any>

describe('Lip Sync data generation', () => {
    const id = '111111111-8284-4e25-84b0-a2ded0232500'
    const lypSync = new LipSyncStage()
    let mockPayload: DubbingOutput;

    beforeAll(async () => {
        mockPayload = await createMockPayload(id)
    })

    test(`should be emitted ${'task:start' as EventsNames} and ${'task:complete' as EventsNames}`, { timeout: 120_000 }, async () => {
        const startPromise = new Promise<{ stageName: string; payload: LipSyncInput }>((resolve) => {
            lypSync.on('task:start', (stageName, payload) => {
                resolve({ stageName, payload });
            });
        });

        const completePromise = new Promise<{ stageName: string; payload: any }>((resolve) => {
            lypSync.on('task:complete', (stageName, payload) => {
                resolve({ stageName, payload });
            });
        });

        lypSync.scheduleTask(mockPayload);

        const { payload: startPayload } = await startPromise;
        expect(startPayload.id).toBe(id);

        const { payload: completePayload } = await completePromise;
        expect(completePayload.id).toBe(id);
        expect(completePayload.lipSync).not.toBeUndefined();
    })
})

async function createMockPayload(id: string) {
    const fileManipulator = new FileManipulator()
    const scriptFilepath = path.join(process.env.SCRIPT_STORAGE, `${id}.txt`);
    const audioFilepath = path.join(process.env.AUDIO_STORAGE, `${id}.ogg`);
    const script = await fileManipulator.readFile(scriptFilepath)

    if (script.isErr()) {
        throw script.error
    }

    const mockPayload: LipSyncInput = {
        id,
        script: script.value,
        scriptFilepath,
        audioFilepath,
        article: undefined
    }

    return mockPayload
}