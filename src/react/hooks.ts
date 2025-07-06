import {useEffect, useSyncExternalStore} from "react";
import {useVDSEngine} from "./context";
import type {CoreState, EphemeralFeedback} from "../core/types";

type StateSelector<S> = (state: CoreState) => S;

export function useVDSState<S>(selector: StateSelector<S>): S {
    const engine = useVDSEngine();
    return useSyncExternalStore(
        (onStoreChange) => engine.subscribeToState(onStoreChange),
        () => selector(engine.getState()),
        () => selector(engine.getState())
    );
}

export function useVDSFeedback(
    eventName: string,
    onFeedback: (feedback: EphemeralFeedback) => void
): void {
    const engine = useVDSEngine();
    useEffect(() => {
        const unsubscribe = engine.subscribeToFeedback(eventName, onFeedback);
        return () => {
            unsubscribe();
        };
    }, [engine, eventName, onFeedback]);
}