import {produce} from "immer";
import type {Blueprint, CoreState, DomainEvent, Projector, TransitionRule} from './types';

interface CompiledTransitionRule {
    readonly clusterId: string;
    readonly rule: TransitionRule;
}

export function createProjector(blueprint: Blueprint): Projector {
    const transitionMap = new Map<string, CompiledTransitionRule[]>;
    for (const clusterId in blueprint.clusters) {
        if (Object.prototype.hasOwnProperty.call(blueprint.clusters, clusterId)) {
            const clusterDef = blueprint.clusters[clusterId];
            const transitionsOn = clusterDef.transitions.on;
            for (const eventName in transitionsOn) {
                if (Object.prototype.hasOwnProperty.call(transitionsOn, eventName)) {
                    const rule = transitionsOn[eventName];
                    if (!transitionMap.has(eventName)) {
                        transitionMap.set(eventName, []);
                    }
                    transitionMap.get(eventName)!.push({clusterId, rule});
                }
            }
        }
    }

    return (currentState: CoreState, event: DomainEvent): CoreState => {
        const rulesForEvent = transitionMap.get(event.name);
        if (!rulesForEvent) {
            return currentState;
        }

        return produce(currentState, draft => {
            for (const {clusterId, rule} of rulesForEvent) {
                const clusterState = draft.clusters[clusterId];
                if (clusterState) {
                    for (const stateGroupId in rule.target) {
                        if (Object.prototype.hasOwnProperty.call(rule.target, stateGroupId)) {
                            clusterState[stateGroupId] = rule.target[stateGroupId];
                        }
                    }
                }
            }
        });
    }
}