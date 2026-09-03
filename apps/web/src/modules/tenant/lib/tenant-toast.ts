import { toastApiError, toastApiSuccess, maybeToastSuccess } from '../../../lib/api/toast-api';

export { toastApiError, toastApiSuccess, maybeToastSuccess };

export function handleTenantMutationSuccess(res: unknown): void {
  maybeToastSuccess(res);
}

export function handleTenantMutationError(error: unknown, fallback: string): void {
  toastApiError(error, fallback);
}
