import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

function sanitizeValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') {
    return value.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/javascript:/gi, '');
  }
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  // Guard against circular references (e.g. Socket objects passed by NestJS)
  if (seen.has(value)) return undefined;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, seen));
  }
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    result[k] = sanitizeValue(v, seen);
  }
  return result;
}

@Injectable()
export class XssPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // Only sanitize message body params; skip socket/context params to avoid circular refs
    if (metadata.type !== 'body') return value;
    return sanitizeValue(value);
  }
}
