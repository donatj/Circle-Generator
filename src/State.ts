import { EventEmitter } from "./EventEmitter";


export class StateItem<T> {

	readonly changeEmitter = new EventEmitter<void>;

	constructor(
		private value: T
	) { }

	public get<K extends keyof T>(key: K): T[K] {
		return this.value[key];
	}

	public set<K extends keyof T>(key: K, value: T[K]): void {
		this.value[key] = value;
		this.changeEmitter.trigger();
	}

	public getValue(): T {
		return this.value;
	}
}

interface StorageEngine {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

type StoredState = { [name: string]: { [key: string]: unknown } };

function isRecord(value: unknown): value is { [key: string]: unknown } {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStoredState(value: unknown): value is StoredState {
	return isRecord(value) && Object.values(value).every(isRecord);
}

export class StateHandler {

	private state: StoredState = {};

	constructor(
		private storage: StorageEngine = window.localStorage,
		private key: string = "CircleGeneratorState"
	) {
		try {
			const state = storage.getItem(key);
			if (state) {
				const parsed = JSON.parse(state) as unknown;
				if (isStoredState(parsed)) {
					this.state = parsed;
				}
			}
		} catch {
			this.state = {};
		}
	}

	public get<T extends object>(name: string, defaultValue: T): StateItem<T> {
		const stored = this.state[name];

		if (stored) {
			for (const key of Object.keys(defaultValue) as (keyof T)[]) {
				const storedValue = stored[key as string];
				if (typeof storedValue === typeof defaultValue[key]) {
					defaultValue[key] = storedValue as T[keyof T];
				}
			}
		}

		const si = new StateItem<T>(defaultValue);
		si.changeEmitter.add(() => {
			this.state[name] = si.getValue() as { [key: string]: unknown };
			this.save();
		});
		return si;
	}

	public save(): void {
		try {
			this.storage.setItem(this.key, JSON.stringify(this.state));
		} catch {
			// Continue to render when storage is unavailable or full.
		}
	}

}
