import { Result } from "neverthrow";

export default interface PipelineNode<P, V> {
    run(options: P): Promise<Result<V, unknown>>
}
