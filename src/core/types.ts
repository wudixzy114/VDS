export interface Command<T extends string = string, P = any> {
    readonly name: T;
    readonly payload?: P;
}

export interface DomainEvent<T extends string = string, P = any> {
    readonly name: T;
    readonly payload?: P;
    readonly metadata?: EventMetadata;
}

export interface EphemeralFeedback<T extends string = string, P = any> {
    readonly name: T;
    readonly level: 'info' | 'success' | 'warning' | 'error';
    readonly message: string;
    readonly payload?: P;
}

export interface EventMetadata {
    readonly eventId: string;
    readonly timestamp: string;
    readonly correlationId?: string;
    readonly causationId?: string;
}

export interface StateGroupDefinition {
    readonly initial: string;
    readonly state: readonly string[];
    readonly description?: string;
}

export interface ClusterDefinition {
    readonly stateGroups: Record<string, StateGroupDefinition>;
    readonly transitions: TransitionDefinition;
    readonly description?: string;
}

export interface Blueprint {
    readonly version: string;
    readonly appName: string;
    readonly clusters: Record<string, ClusterDefinition>;
}

export interface TransitionRule {
    readonly target: TransitionTarget;
}

export interface TransitionDefinition {
    readonly on: Record<string, TransitionRule>;
    readonly description?: string;
}

export type TransitionTarget = Record<string, string>;

export type ClusterState = Record<string, string>

export interface CoreState {
    readonly clusters: Record<string, ClusterState>
}

export type StateListener = (newState: CoreState) => void;

export type BusEvent = DomainEvent | EphemeralFeedback;

export type Projector = (currentState: CoreState, event: DomainEvent) => CoreState;