function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sanitizeForFirebase(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      const sanitizedItem = sanitizeForFirebase(item);
      return sanitizedItem === undefined ? null : sanitizedItem;
    });
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) => {
        const sanitizedItem = sanitizeForFirebase(item);
        return sanitizedItem === undefined ? [] : [[key, sanitizedItem]];
      }),
    );
  }

  return value;
}

export function sanitizeUpdatePayload(value: Record<string, unknown>) {
  const sanitizedValue = sanitizeForFirebase(value);

  if (!isPlainObject(sanitizedValue)) {
    throw new Error("Firebase に保存する更新データはオブジェクトである必要があります。");
  }

  return sanitizedValue;
}
