import Stage from "./stages/stage.js";
import chalk, { ChalkInstance } from "chalk";
import { StageInput, StageOutput } from "./stages/types.js";

export default class PipelineLogger {
    log(...stages: Stage<StageInput, StageOutput>[]) {
        stages.forEach(stage => {
            stage.on('task:start', (stageName) => {
                console.log(this.infoStyle('START'), stageName)
            })

            stage.on('task:complete', (stageName) => {
                console.log(this.successStyle('COMPLETE'), stageName)
            })

            stage.on('task:error', (error) => {
                console.log(this.errorStyle('ERROR'), error)
            })
        })

    }

    private errorStyle: ChalkInstance = chalk.bgRed.white
    private infoStyle: ChalkInstance = chalk.bgBlue.white
    private successStyle: ChalkInstance = chalk.bgGreen.white
}