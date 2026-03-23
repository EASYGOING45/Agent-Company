declare interface DurableObjectStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put<T = unknown>(key: string, value: T): Promise<void>;
}

declare interface DurableObjectState {
  storage: DurableObjectStorage;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
  acceptWebSocket(webSocket: WebSocket): void;
  getWebSockets(): WebSocket[];
  setAlarm(scheduledTime: number | Date): Promise<void>;
}

declare interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

declare interface DurableObjectId {
  toString(): string;
}

declare interface DurableObjectStub {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

declare var WebSocketPair: {
  new (): {
    0: WebSocket;
    1: WebSocket;
  };
};
