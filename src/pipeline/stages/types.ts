import Article from "../../data-models/article.js"
import { FilePath } from "../../types/alias.js"
import { LipSyncResult } from "../../types/rhubarb-events.js"

export interface StageEvents<INPUT extends StageInput, OUTPUT extends StageOutput> {
    'task:start': [
        stageName: string,
        payload: INPUT
    ],
    'task:progress': [
        stageName: string,
        progressValue: number
    ],
    'task:complete': [
        stageName: string,
        payload: OUTPUT
    ],
    'task:error': [unknown],
}

export interface StageInput extends Partial<WritingInput>, Partial<DubbingInput>, Partial<LipSyncInput>, Partial<RenderingInput> { }

export type StageOutput = ScraperOutput[] | WritingOutput | DubbingOutput | LipSyncOutput | RenderingOutput

export interface ScraperOutput {
    id: string,
    article: Article
}

export type WritingInput = ScraperOutput;
export interface WritingOutput extends WritingInput {
    script: string
    scriptFilepath: FilePath,
}

export type DubbingInput = WritingOutput;
export interface DubbingOutput extends DubbingInput  {
    audioFilepath: FilePath
}

export type LipSyncInput = DubbingOutput
export interface LipSyncOutput extends LipSyncInput {
    lipSync: LipSyncResult
}

export type RenderingInput = LipSyncOutput
export interface RenderingOutput extends RenderingInput {}