import type {Blueprint} from "../core/types";

export function createBlueprint<T extends Blueprint>(bp: T): T {
    return bp;
}