import {createContext, useContext} from "react";
import type {VDSEngine} from "../core/VDSEngine";

export const VDSEngineContext = createContext<VDSEngine | null>(null);

export function useVDSEngine(): VDSEngine {
    const engine = useContext(VDSEngineContext);
    if (!engine) {
        throw new Error('useVDSEngine must be used within a VDSProvider.');
    }
    return engine;
}

