import { customType } from 'drizzle-orm/pg-core';

/** Tipo bytea para dados binários (imagens, arquivos). */
export const bytea = customType<{
  data: Buffer | null;
  notNull: false;
  default: false;
}>({
  dataType() {
    return 'bytea';
  },
  toDriver(val: Buffer | null) {
    return val;
  },
  fromDriver(value: unknown) {
    if (value === null) {
      return null;
    }

    if (value instanceof Buffer) {
      return value;
    }

    if (typeof value === 'string') {
      return Buffer.from(value, 'hex');
    }

    throw new Error(`Unexpected type received from driver: ${typeof value}`);
  }
});

