import cluster from 'cluster';
import os from 'os';
import { createLogger } from '../lib/logging';

const logger = createLogger('sms-cluster-worker');
const numCPUs = os.cpus().length;

// Mock Queue implementation
class SMSQueue {
  private messages: { to: string; message: string }[] = [];

  enqueue(to: string, message: string) {
    this.messages.push({ to, message });
  }

  dequeue() {
    return this.messages.shift();
  }

  get length() {
    return this.messages.length;
  }
}

export const smsQueue = new SMSQueue();

// Seed queue for demonstration only when explicitly enabled
export const seedDemoSMSQueue = () => {
  if (process.env.NODE_ENV === 'development' || process.env.SEED_DEMO_SMS === 'true') {
    for (let i = 0; i < 50; i++) {
      smsQueue.enqueue(`+155512345${i.toString().padStart(2, '0')}`, `Test message ${i}`);
    }
  }
};

let queueTimer: NodeJS.Timeout | null = null;
let isRunning = false;

export const stopSMSClusterWorker = () => {
  isRunning = false;
  if (queueTimer) {
    clearTimeout(queueTimer);
    queueTimer = null;
  }
  logger.info(`Worker ${process.pid} stopped SMS processing`);
};

export const startSMSClusterWorker = () => {
  // Gate demo queue seeding behind environment check
  seedDemoSMSQueue();

  if (cluster.isPrimary) {
    logger.info(`Primary ${process.pid} is running`);
    logger.info(`Setting up cluster with ${numCPUs} workers for SMS processing...`);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
      if (isRunning) {
        logger.info('Starting a new worker...');
        cluster.fork(); // Auto-heal workers only if active
      }
    });
  } else {
    logger.info(`Worker ${process.pid} started for SMS processing`);
    isRunning = true;

    const processQueue = async () => {
      if (!isRunning) return;

      const messageJob = smsQueue.dequeue();
      if (messageJob) {
        try {
          logger.debug(`[Worker ${process.pid}] Processing SMS for ${messageJob.to}...`);
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 100));
          logger.info(`[Worker ${process.pid}] Successfully sent SMS to ${messageJob.to}`);
        } catch (error) {
          logger.error(`[Worker ${process.pid}] Failed to send SMS`, { error });
        }
      }

      if (isRunning) {
        queueTimer = setTimeout(processQueue, 1000);
        if (queueTimer && typeof queueTimer === 'object' && 'unref' in queueTimer) {
          queueTimer.unref();
        }
      }
    };

    processQueue();
  }
};
