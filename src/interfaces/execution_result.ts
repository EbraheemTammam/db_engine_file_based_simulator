import { premitive } from "./catalog"

export interface ExecutionResult {
    type: "ROWS" | "COMMAND",
    headers?: string[]
    rows?: premitive[][]
    row_count?: number,
    tag: string
}