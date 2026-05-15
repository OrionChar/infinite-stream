import PipelineStage from "./pipiline-stage.js";
import chalk, { ChalkInstance } from "chalk";

export default class PipelineLogger {
    log(stage: PipelineStage<unknown>) {
        stage.on('task:start', (stageName, payload) => {
            console.log(this.infoStyle('START'), stageName, payload.location)
        })

        stage.on('task:complete', (stageName, payload) => {
            console.log(this.successStyle('COMPLETE'), stageName, payload.location)
        })

        stage.on('task:error', (error) => {
            console.log(this.errorStyle('ERROR'), error.toString())
        })
    }

    private errorStyle: ChalkInstance = chalk.bgRed.white
    private infoStyle: ChalkInstance = chalk.bgBlue.white
    private successStyle: ChalkInstance = chalk.bgGreen.white
}