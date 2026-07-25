/**
 * DataWarehouseService
 *
 * A singleton service for tracking events to a data warehouse.
 * Currently uses a console mock, but designed to be easily extensible
 * for providers like BigQuery, Snowflake, Mixpanel, etc.
 */

import { createLogger } from '@/lib/logging';

const logger = createLogger('data-warehouse');

export interface TrackEventPayload {
  eventName: string;
  timestamp: string;
  properties?: Record<string, unknown>;
}

class DataWarehouseService {
  private static instance: DataWarehouseService;

  private constructor() {}

  public static getInstance(): DataWarehouseService {
    if (!DataWarehouseService.instance) {
      DataWarehouseService.instance = new DataWarehouseService();
    }
    return DataWarehouseService.instance;
  }

  public async trackEvent(eventName: string, properties?: Record<string, unknown>): Promise<void> {
    const payload: TrackEventPayload = {
      eventName,
      timestamp: new Date().toISOString(),
      properties,
    };

    // Mock implementation for the data warehouse integration
    if (process.env.NODE_ENV !== 'test') {
      logger.info('[DataWarehouse] Event tracked', { payload });
    }

    // In a real implementation, you would do something like:
    // await fetch('https://api.datawarehouse.com/track', { method: 'POST', body: JSON.stringify(payload) })
  }
}

export const dataWarehouse = DataWarehouseService.getInstance();
