import cluster from 'cluster';
import { startSMSClusterWorker } from '../sms-cluster-worker';

jest.mock('cluster', () => ({
  isPrimary: true,
  fork: jest.fn(),
  on: jest.fn(),
}));

jest.mock('os', () => ({
  cpus: () => new Array(4).fill({}),
}));

describe('SMS Cluster Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fork a worker for each CPU if primary', () => {
    // Override cluster.isPrimary just in case
    Object.defineProperty(cluster, 'isPrimary', { value: true, configurable: true });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    startSMSClusterWorker();

    expect(cluster.fork).toHaveBeenCalledTimes(4);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Setting up cluster with 4 workers'),
    );

    consoleSpy.mockRestore();
  });

  it('should bind an exit handler to auto-heal workers', () => {
    Object.defineProperty(cluster, 'isPrimary', { value: true, configurable: true });

    startSMSClusterWorker();

    expect(cluster.on).toHaveBeenCalledWith('exit', expect.any(Function));
  });

  it('should execute worker logic if not primary', () => {
    Object.defineProperty(cluster, 'isPrimary', { value: false, configurable: true });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    startSMSClusterWorker();

    expect(cluster.fork).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Worker'));

    consoleSpy.mockRestore();
  });
});
