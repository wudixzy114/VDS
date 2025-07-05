import {EventBus} from "./EventBus";
import {StateManager} from "./StateManager";
import {createProjector} from "./ProjectorFactory";

import type {
    Blueprint,
    Command,
    CommandHandlerMap,
    CoreState,
    DomainEvent,
    EphemeralFeedback,
    HandlerResult,
    Projector,
    StateListener,
} from './types';

import type {Unsubscribe} from "./EventBus";

export class VDSEngine {
    private readonly stateManager: StateManager;
    private readonly domainEventBus: EventBus<DomainEvent>;
    private readonly feedbackBus: EventBus<EphemeralFeedback>;
    private readonly commandHandlers: CommandHandlerMap;
    private readonly projector: Projector;

    constructor(blueprint: Blueprint, handlers: CommandHandlerMap) {
        this.commandHandlers = handlers;
        this.stateManager = new StateManager(blueprint);
        this.projector = createProjector(blueprint);

        const engineErrorHandler = (error: unknown, context: { eventName: string }) => {
            const feedback: EphemeralFeedback = {
                name: 'INTERNAL_LISTENER_ERROR',
                level: 'error',
                message: `An error occurred in a listener for event: ${context.eventName}.`,
                payload: {error: error instanceof Error ? error.stack : String(error)}
            };
            this.feedbackBus.publish(feedback);
        }


        const fatalErrorHandler = (error: unknown, context: { eventName: string }) => {
            console.error(
                `[VDS FATAL] Unhandled error in FeedbackBus listener for "${context.eventName}". ` +
                `Publishing aborted to prevent infinite loops. Error:`, error
            );
        }

        this.domainEventBus = new EventBus<DomainEvent>(engineErrorHandler);
        this.feedbackBus = new EventBus<EphemeralFeedback>(fatalErrorHandler);

        this.domainEventBus.subscribe('*', (event: DomainEvent) => {
            const currentState = this.stateManager.getState();
            const nextState = this.projector(currentState, event);
            this.stateManager._setState(nextState);
        })
    }

    public async dispatch(command: Command): Promise<void> {
        const handler = this.commandHandlers[command.name];
        if (!handler) {
            const feedback: EphemeralFeedback = {
                name: 'NO_HANDLER_EXCEPTION',
                level: 'error',
                message: `Command handler for "${command.name}" does not exist.`,
                payload: {}
            }
            this.feedbackBus.publish(feedback);
            return;
        }

        try {
            const result = await handler(() => this.stateManager.getState(), command);
            this.processHandlerResult(result);
        } catch (error) {
            const feedback: EphemeralFeedback = {
                name: 'UNHANDLED_HANDLER_EXCEPTION',
                level: 'error',
                message: `Command handler for "${command.name}" threw an unhandled exception.`,
                payload: {error: error instanceof Error ? error.message : String(error)}
            };
            this.feedbackBus.publish(feedback);
        }
    }

    public getState = (): CoreState => this.stateManager.getState();
    public subscribeToState = (listener: StateListener): Unsubscribe => this.stateManager.subscribe(listener);
    public subscribeToFeedback = (eventName: string, listener: (feedback: EphemeralFeedback) => void): Unsubscribe => this.feedbackBus.subscribe(eventName, listener);

    private processHandlerResult(result: HandlerResult | void): void {
        if (!result) {
            return;
        }

        const results = Array.isArray(result) ? result : [result];
        for (const item of results) {
            if ('level' in item && typeof item.level === 'string') {
                this.feedbackBus.publish(item as EphemeralFeedback);
            } else {
                this.domainEventBus.publish(item as DomainEvent);
            }
        }
    }
}