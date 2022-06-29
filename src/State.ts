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

	public getValue() {
		return this.value;
	}
}

interface StorageEngine {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

export class StateHandler {

	private state: { [key: string]: any } = {};

	constructor(
		private storage: StorageEngine = window.localStorage,
		private key: string = "CircleGeneratorState"
	) {
		const state = storage.getItem(key);
		if (state) {
			this.state = JSON.parse(state);
		}
	}

	public get<T extends object>(name: string, defaultValue: T): StateItem<T> {
		const stored = this.state[name] as Partial<T> || {};

		Object.assign(defaultValue, stored);

		const si = new StateItem<T>(defaultValue);
		si.changeEmitter.add(() => {
			this.state[name] = si.getValue();
			this.save();
		});
		return si;
	}

	public save() {
		this.storage.setItem(this.key, JSON.stringify(this.state));
	}

}
