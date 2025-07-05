import type {BusEvent, EphemeralFeedback} from "./types";

type Listener<E extends BusEvent> = (event: E) => void | Promise<void>;
export type Unsubscribe = () => void;
type ErrorHandler = (error: unknown, context: { eventName: string, listener: Function }) => void;

export class EventBus<T extends BusEvent = BusEvent> {
    private globalListeners: Set<Listener<T>> = new Set();
    private listeners: Map<string, Set<Listener<T>>> = new Map();
    private onUnhandledError: ErrorHandler;

    constructor(onUnhandledError: ErrorHandler = (error, context) => {
        console.error(`[EventBus] Unhandled error in listener for event "${context.eventName}":`, error);
    }) {
        this.onUnhandledError = onUnhandledError;
    }

    public subscribe(eventName: string, listener: Listener<T>): Unsubscribe {
        if (eventName === '*') {
            this.globalListeners.add(listener);
            return () => this.globalListeners.delete(listener);
        }
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }

        const eventListeners = this.listeners.get(eventName)!;
        eventListeners.add(listener);

        return () => {
            eventListeners.delete(listener);
            if (eventListeners.size === 0) {
                this.listeners.delete(eventName);
            }
        }
    }

    public publish(event: T): void {
        const specificListeners = this.listeners.get(event.name);
        const allListeners = new Set([...(specificListeners || []), ...this.globalListeners]);

        if (allListeners.size === 0) return;

        for (const listener of [...allListeners]) {
            try {
                const result = listener(event);
                if (result instanceof Promise) {
                    result.catch(error => {
                        this.onUnhandledError(error, {eventName: event.name, listener});
                    });
                }
            } catch (error) {
                this.onUnhandledError(error, {eventName: event.name, listener});
            }
        }
    }
}