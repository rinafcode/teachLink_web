import cluster from 'cluster';
import os from 'os';
import { sendSMS } from '../utils/notificationUtils'; // Assuming we have this or we'll mock it
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

const smsQueue = new SMSQueue();

// Seed queue for demonstration
for (let i = 0; i < 50; i++) {
  smsQueue.enqueue(`+155512345${i.toString().padStart(2, '0')}`, `Test message ${i}`);
}

export const startSMSClusterWorker = () => {
  if (cluster.isPrimary) {
    logger.info(`Primary ${process.pid} is running`);
    logger.info(`Setting up cluster with ${numCPUs} workers for SMS processing...`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
      logger.info('Starting a new worker...');
      cluster.fork(); // Auto-heal workers
    });
  } else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server or a message queue listener
    logger.info(`Worker ${process.pid} started for SMS processing`);

    const processQueue = async () => {
      // Basic mock of polling a queue
      const messageJob = smsQueue.dequeue();
      if (messageJob) {
        try {
          logger.debug(`[Worker ${process.pid}] Processing SMS for ${messageJob.to}...`);
          // Note: In a real app we'd use sendSMS(messageJob.to, messageJob.message)
          // For now we just mock the delay
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 100));
          logger.info(`[Worker ${process.pid}] Successfully sent SMS to ${messageJob.to}`);
        } catch (error) {
          logger.error(`[Worker ${process.pid}] Failed to send SMS`, { error });
        }
      }

      // Continue polling with a small delay to prevent tight loop
      setTimeout(processQueue, 1000);
    };

    processQueue();
  }
};

// In a real entrypoint file, you'd call this:
// if (require.main === module) {
//   startSMSClusterWorker();
// }
