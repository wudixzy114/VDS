import type {BusEvent} from "./types";

type Listener<E extends BusEvent> = (event: E) => void | Promise<void>;
export type Unsubscribe = () => void;

export class EventBus<T extends BusEvent = BusEvent> {
    private listeners: Map<string, Set<Listener<T>>> = new Map();

    public subscribe(eventName: string, listener: Listener<T>): Unsubscribe {
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
        const eventListeners = this.listeners.get(event.name);
        if (!eventListeners || eventListeners.size === 0) {
            return;
        }

        for (const listener of [...eventListeners]) {
            try {
                const result = listener(event);
                if (result instanceof Promise) {
                    result.catch(error => {
                        // TODO
                        console.error(`[EventBus] Asynchronous listener for event "${event.name}" rejected with error:`, error);
                    });
                }
            } catch (error) {
                // TODO
                console.error(`[EventBus] Synchronous listener for event "${event.name}" threw an error:`, error);
            }
        }
    }
}