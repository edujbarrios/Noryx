export interface MemoryRecord<TValue = unknown> {
  readonly key: string;
  readonly value: TValue;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface MemoryStore {
  save<TValue>(key: string, value: TValue): Promise<MemoryRecord<TValue>>;
  load<TValue>(key: string): Promise<MemoryRecord<TValue> | undefined>;
  clear(key?: string): Promise<void>;
}

export class InMemoryStore implements MemoryStore {
  private readonly records = new Map<string, MemoryRecord>();

  async save<TValue>(key: string, value: TValue): Promise<MemoryRecord<TValue>> {
    const existing = this.records.get(key);
    const now = new Date();
    const record: MemoryRecord<TValue> = {
      key,
      value,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    this.records.set(key, record);
    return record;
  }

  async load<TValue>(key: string): Promise<MemoryRecord<TValue> | undefined> {
    return this.records.get(key) as MemoryRecord<TValue> | undefined;
  }

  async clear(key?: string): Promise<void> {
    if (key) {
      this.records.delete(key);
      return;
    }
    this.records.clear();
  }
}
