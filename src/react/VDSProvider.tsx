import React, {ReactNode} from "react";
import type {VDSEngine} from "../core/VDSEngine";
import {VDSEngineContext} from "./context";

interface VDSProviderProps {
    engine: VDSEngine;
    children: ReactNode;
}

export function VDSProvider({engine, children}: VDSProviderProps) {
    return (
        <VDSEngineContext.Provider value={engine}>
            {children}
        </VDSEngineContext.Provider>
    );
}