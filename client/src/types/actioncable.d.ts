declare module "@rails/actioncable" {
    export interface Consumer {
        subscriptions: Subscriptions;
        disconnect(): void;
    }

    export interface Subscriptions {
        create(
            channel: string | object,
            mixin?: Partial<Subscription>
        ): Subscription;
    }

    export interface Subscription {
        unsubscribe(): void;
        perform(action: string, data?: object): void;
        send(data: object): void;
        connected?(): void;
        disconnected?(): void;
        received?(data: unknown): void;
        rejected?(): void;
    }

    export function createConsumer(url?: string): Consumer;
}
