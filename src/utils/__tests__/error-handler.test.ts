import { describe, expect, it, vi } from 'vitest';
import { errorReportingService } from '@/services/errorReporting';
import { ErrorType } from '@/utils/errorUtils';
import { parseApiError } from '@/utils/error-handler';

describe('parseApiError', () => {
  it('reports handled errors through the central reporting service', () => {
    const reportError = vi.spyOn(errorReportingService, 'reportError').mockResolvedValue({} as any);
    const error = new TypeError('fetch failed');

    const result = parseApiError(error);

    expect(result.type).toBe(ErrorType.NETWORK);
    expect(reportError).toHaveBeenCalledWith(error, {
      handled: true,
      errorType: ErrorType.NETWORK,
      statusCode: undefined,
    });
    reportError.mockRestore();
  });
});