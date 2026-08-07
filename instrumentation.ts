/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically loaded by Next.js when the application starts.
 * Use it to initialize services that need to run on server startup.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { SMSLogAggregator } from '@/lib/logging/sms-aggregator';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize SMS log aggregator for server-side
    SMSLogAggregator.initialize();
    
    console.log('[Instrumentation] SMS Log Aggregator initialized');
  }
}
