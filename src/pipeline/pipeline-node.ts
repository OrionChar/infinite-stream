import { Result } from "neverthrow";

export default interface PipelineNode<PARAM, RESULT> {
    run(options: PARAM): Promise<Result<RESULT, unknown>>
}
