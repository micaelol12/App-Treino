export type TelemetryEventName =
  | 'account_deletion_failed'
  | 'legacy_document_rejected'
  | 'remote_operation_failed'
  | 'unhandled_render_error';

type ErrorContext = {
  readonly collection?: string;
  readonly failureCode?: string;
  readonly issueCodes?: readonly string[];
  readonly issuePaths?: readonly string[];
};

type RuntimeMetadata = {
  readonly appVersion: string;
  readonly platform: string;
  readonly variant: string;
};

export type SanitizedErrorEvent = {
  readonly appVersion: string;
  readonly collection?: string;
  readonly errorType: 'application' | 'firebase' | 'invalid-document' | 'unknown';
  readonly event: TelemetryEventName;
  readonly failureCode?: string;
  readonly issueCodes?: readonly string[];
  readonly issuePaths?: readonly string[];
  readonly platform: string;
  readonly recordedAt: string;
  readonly variant: string;
};

const SAFE_TOKEN = /^[A-Za-z0-9_.-]{1,64}$/;

function safeToken(value: string | undefined): string | undefined {
  return value && SAFE_TOKEN.test(value) ? value : undefined;
}

function safeTokens(
  values: readonly string[] | undefined,
): readonly string[] | undefined {
  const sanitized = values?.map((value) => safeToken(value)).filter(Boolean) as
    string[] | undefined;
  return sanitized?.length ? sanitized.slice(0, 12) : undefined;
}

function classifyError(error: unknown): SanitizedErrorEvent['errorType'] {
  if (typeof error !== 'object' || error === null) return 'unknown';
  const name = 'name' in error && typeof error.name === 'string' ? error.name : '';
  if (name === 'InvalidFirestoreDocumentError') return 'invalid-document';
  if (name === 'FirebaseError') return 'firebase';
  return name.endsWith('Failure') ? 'application' : 'unknown';
}

let configuredRuntime: RuntimeMetadata = {
  appVersion: 'unknown',
  platform: 'unknown',
  variant: 'unknown',
};

export function configureTelemetryRuntime(runtime: RuntimeMetadata): void {
  configuredRuntime = runtime;
}

export function buildSanitizedErrorEvent(
  event: TelemetryEventName,
  error: unknown,
  context: ErrorContext = {},
  runtime: RuntimeMetadata = configuredRuntime,
  now: Date = new Date(),
): SanitizedErrorEvent {
  const collection = safeToken(context.collection);
  const failureCode = safeToken(context.failureCode);
  const issueCodes = safeTokens(context.issueCodes);
  const issuePaths = safeTokens(context.issuePaths);

  return {
    appVersion: runtime.appVersion,
    errorType: classifyError(error),
    event,
    platform: runtime.platform,
    recordedAt: now.toISOString(),
    variant: runtime.variant,
    ...(collection ? { collection } : {}),
    ...(failureCode ? { failureCode } : {}),
    ...(issueCodes ? { issueCodes } : {}),
    ...(issuePaths ? { issuePaths } : {}),
  };
}

function reportingEndpoint(): string | null {
  const endpoint = process.env.EXPO_PUBLIC_ERROR_REPORTING_ENDPOINT?.trim();
  if (!endpoint) return null;

  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function reportError(
  event: TelemetryEventName,
  error: unknown,
  context: ErrorContext = {},
): void {
  const endpoint = reportingEndpoint();
  if (!endpoint) return;

  const payload = buildSanitizedErrorEvent(event, error, context);
  void fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}
