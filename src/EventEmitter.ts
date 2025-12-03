export type Listener<T> = (e: T) => void;

export class EventEmitter<T> {
	protected listeners = new Set<Listener<T>>();

	public add(callback: Listener<T>): void {
		this.listeners.add(callback);
	}

	public remove(callback: Listener<T>): void {
		this.listeners.delete(callback);
	}

	public trigger(event: T): void {
		this.listeners.forEach((fn) => fn(event));
	}

	public clear(): void {
		this.listeners.clear();
	}

}
