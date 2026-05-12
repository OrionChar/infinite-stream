import PipelineStage from "./pipiline-stage.js";

export default class PipelineLogger {
    log(stage: PipelineStage<unknown>) {
        stage.on('task:start', (stageName, payload) => {
            console.log('START', stageName, payload.location)
        })

        stage.on('task:complete', (stageName, payload) => {
            console.log('COMPLETE', stageName, payload.location)
        })

        stage.on('task:error', (error) => {
            console.error('ERROR', error)
        })
    }
}