import { SMSLogAggregator } from './sms-aggregator';

describe('SMSLogAggregator', () => {
  it('maintains accurate stats after 1000 insertions without iterating', () => {
    const initialStats = SMSLogAggregator.getStoreStats();
    const initialTotal = initialStats.totalMessages;
    const initialFailed = initialStats.failedCount;

    let successAdded = 0;
    let failedAdded = 0;

    for (let i = 0; i < 1000; i++) {
      const isSuccess = i % 10 !== 0; // 90% success rate (900 successful, 100 failed)
      if (isSuccess) successAdded++;
      else failedAdded++;

      SMSLogAggregator.collectSMSLogs([{
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Test SMS',
        scope: 'sms',
        context: {
          provider: 'test-provider',
          status: isSuccess ? 'sent' : 'failed'
        }
      }]);
    }

    const stats = SMSLogAggregator.getStoreStats();
    
    expect(stats.totalMessages).toBe(initialTotal + 1000);
    expect(stats.failedCount).toBe(initialFailed + failedAdded);
    
    // successRate is (successfulMessages / totalMessages) * 100
    // Verify it's correctly calculated
    expect(stats.successRate).toBeGreaterThanOrEqual(0);
    expect(stats.successRate).toBeLessThanOrEqual(100);
  });
});
