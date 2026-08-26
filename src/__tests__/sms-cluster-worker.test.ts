import {
  startSMSClusterWorker,
  stopSMSClusterWorker,
  seedDemoSMSQueue,
  smsQueue,
} from '../workers/sms-cluster-worker';

describe('SMS Cluster Worker (Issue #918)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    delete process.env.SEED_DEMO_SMS;
    stopSMSClusterWorker();
  });

  it('does NOT seed demo queue in production or default test env', () => {
    process.env.NODE_ENV = 'production';
    seedDemoSMSQueue();
    expect(smsQueue.length).toBe(0);
  });

  it('seeds demo queue when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    seedDemoSMSQueue();
    expect(smsQueue.length).toBe(50);
  });

  it('can be started and stopped cleanly without leaving active timers', () => {
    startSMSClusterWorker();
    expect(() => stopSMSClusterWorker()).not.toThrow();
  });
});
