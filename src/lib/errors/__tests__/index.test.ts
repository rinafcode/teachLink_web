import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  init,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  getBreadcrumbs,
  isInitialized,
  _resetForTesting,
  errorReportingService,
} from '../index';
import { queryLogs } from '@/lib/logging';

describe('error tracking public API', () => {
  beforeEach(() => {
    // Reset the singleton state between tests
    _resetForTesting();
    errorReportingService.clearBreadcrumbs();
    errorReportingService.clearUserId();
    errorReportingService.clearBreadcrumbs();

    // Reset the in-memory log store so each test starts clean
    globalThis.__TEACHLINK_LOG_RECORDS__ = [];
  });

  describe('init()', () => {
    it('marks the system as initialized', () => {
      expect(isInitialized()).toBe(false);
      init();
      expect(isInitialized()).toBe(true);
    });

    it('is idempotent — calling twice does not re-initialize', () => {
      init('https://dsn@example.com');
      const firstState = isInitialized();
      init(); // second call should be a no-op
      expect(isInitialized()).toBe(firstState);
    });

    it('passes the DSN to the reporting service', () => {
      const configureSpy = vi.spyOn(errorReportingService, 'configure');
      init('https://examplePublicKey@o0.ingest.sentry.io/0');
      expect(configureSpy).toHaveBeenCalledWith({
        dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
      });
      configureSpy.mockRestore();
    });

    it('passes null DSN when no DSN is provided', () => {
      const configureSpy = vi.spyOn(errorReportingService, 'configure');
      init();
      expect(configureSpy).toHaveBeenCalledWith({ dsn: null });
      configureSpy.mockRestore();
    });
  });

  describe('captureException()', () => {
    beforeEach(() => {
      init();
    });

    it('reports an Error to the reporting service', async () => {
      const reportSpy = vi
        .spyOn(errorReportingService, 'reportError')
        .mockResolvedValue({} as any);

      const error = new Error('test failure');
      captureException(error);

      expect(reportSpy).toHaveBeenCalledTimes(1);
      expect(reportSpy).toHaveBeenCalledWith(error, undefined);
      reportSpy.mockRestore();
    });

    it('wraps non-Error values in an Error', async () => {
      const reportSpy = vi
        .spyOn(errorReportingService, 'reportError')
        .mockResolvedValue({} as any);

      captureException('string error');

      const reportedError = reportSpy.mock.calls[0]?.[0];
      expect(reportedError).toBeInstanceOf(Error);
      expect(reportedError.message).toBe('string error');
      reportSpy.mockRestore();
    });

    it('passes context tags and extra to the reporting service', async () => {
      const reportSpy = vi
        .spyOn(errorReportingService, 'reportError')
        .mockResolvedValue({} as any);

      const error = new Error('tagged error');
      captureException(error, {
        userId: 'usr_123',
        tags: { feature: 'billing' },
        extra: { orderId: 'ord_456' },
      });

      expect(reportSpy).toHaveBeenCalledWith(error, {
        tags: { feature: 'billing' },
        extra: { orderId: 'ord_456' },
      });
      reportSpy.mockRestore();
    });

    it('sets the user ID when context.userId is provided', async () => {
      const setUserIdSpy = vi.spyOn(errorReportingService, 'setUserId');
      const reportSpy = vi
        .spyOn(errorReportingService, 'reportError')
        .mockResolvedValue({} as any);

      captureException(new Error('user error'), { userId: 'usr_789' });

      expect(setUserIdSpy).toHaveBeenCalledWith('usr_789');
      reportSpy.mockRestore();
      setUserIdSpy.mockRestore();
    });

    it('adds a breadcrumb for the exception', () => {
      const addBreadcrumbSpy = vi.spyOn(errorReportingService, 'addBreadcrumb');

      captureException(new Error('breadcrumb error'));

      expect(addBreadcrumbSpy).toHaveBeenCalledWith(
        'exception',
        expect.objectContaining({
          message: 'breadcrumb error',
          level: 'error',
        }),
      );
      addBreadcrumbSpy.mockRestore();
    });
  });

  describe('captureMessage()', () => {
    beforeEach(() => {
      init();
    });

    it('reports a message as an Error to the reporting service', async () => {
      const reportSpy = vi
        .spyOn(errorReportingService, 'reportError')
        .mockResolvedValue({} as any);

      captureMessage('something happened');

      const reportedError = reportSpy.mock.calls[0]?.[0];
      expect(reportedError).toBeInstanceOf(Error);
      expect(reportedError.message).toBe('something happened');
      reportSpy.mockRestore();
    });

    it('passes context to the reporting service', async () => {
      const reportSpy = vi
        .spyOn(errorReportingService, 'reportError')
        .mockResolvedValue({} as any);

      captureMessage('info message', { tags: { page: 'home' } });

      expect(reportSpy).toHaveBeenCalledTimes(1);
      reportSpy.mockRestore();
    });
  });

  describe('addBreadcrumb()', () => {
    beforeEach(() => {
      init();
    });

    it('forwards breadcrumbs to the reporting service', () => {
      const spy = vi.spyOn(errorReportingService, 'addBreadcrumb');

      addBreadcrumb({
        category: 'navigation',
        message: 'User clicked button',
        data: { buttonId: 'submit' },
        level: 'info',
      });

      expect(spy).toHaveBeenCalledWith('navigation', {
        message: 'User clicked button',
        level: 'info',
        buttonId: 'submit',
      });
      spy.mockRestore();
    });
  });

  describe('setUser()', () => {
    beforeEach(() => {
      init();
    });

    it('sets the user ID on the reporting service', () => {
      const spy = vi.spyOn(errorReportingService, 'setUserId');

      setUser({ id: 'usr_123', email: 'test@example.com' });

      expect(spy).toHaveBeenCalledWith('usr_123');
      spy.mockRestore();
    });

    it('clears the user ID when null is passed', () => {
      const spy = vi.spyOn(errorReportingService, 'clearUserId');

      setUser(null);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('getBreadcrumbs()', () => {
    beforeEach(() => {
      init();
    });

    it('returns breadcrumbs from the reporting service', () => {
      errorReportingService.addBreadcrumb('test-action', { detail: 'test' });

      const breadcrumbs = getBreadcrumbs();

      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0]?.action).toBe('test-action');
    });
  });

  describe('isInitialized()', () => {
    it('returns false before init is called', () => {
      expect(isInitialized()).toBe(false);
    });

    it('returns true after init is called', () => {
      init();
      expect(isInitialized()).toBe(true);
    });
  });

  describe('structured logging integration', () => {
    beforeEach(() => {
      init();
    });

    it('writes error reports to the structured logger', async () => {
      const error = new Error('logged error');
      await captureException(error);

      const errorLogs = queryLogs({ level: 'error', scope: 'error-reporting' });
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0]?.message).toContain('Error Report');
    });

    it('includes the error message in the log record', async () => {
      const error = new Error('specific error message');
      await captureException(error);

      const errorLogs = queryLogs({ level: 'error', scope: 'error-reporting' });
      const logContent = JSON.stringify(errorLogs[0]);
      expect(logContent).toContain('specific error message');
    });
  });
});
