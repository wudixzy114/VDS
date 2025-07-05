import {produce} from "immer";
import type {Blueprint, CoreState, StateListener} from "./types";
import type {Unsubscribe} from "./EventBus";

export class StateManager {
    private coreState: CoreState;
    private listeners: Set<StateListener> = new Set();

    constructor(blueprint: Blueprint) {
        this.coreState = this.initializeStateFromBlueprint(blueprint);
    }

    public getState(): CoreState {
        return this.coreState;
    }

    public subscribe(listener: StateListener): Unsubscribe {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    public _setState(newState: CoreState): void {
        if (this.coreState === newState) {
            return;
        }
        this.coreState = newState;
        this.notifyListeners();
    }

    private initializeStateFromBlueprint(blueprint: Blueprint): CoreState {
        const initialState: CoreState = {
            clusters: {}
        }

        return produce(initialState, draft => {
            for (const clusterId in blueprint.clusters) {
                if (Object.prototype.hasOwnProperty.call(blueprint.clusters, clusterId)) {
                    const clusterDef = blueprint.clusters[clusterId];
                    const clusterState: Record<string, string> = {};
                    for (const groupId in clusterDef.stateGroups) {
                        if (Object.prototype.hasOwnProperty.call(clusterDef.stateGroups, groupId)) {
                            const groupDef = clusterDef.stateGroups[groupId];
                            clusterState[groupId] = groupDef.initial;
                        }
                    }
                    draft.clusters[clusterId] = clusterState;
                }
            }
        });
    }

    private notifyListeners(): void {
        for (const listener of [...this.listeners]) {
            listener(this.coreState);
        }
    }
}