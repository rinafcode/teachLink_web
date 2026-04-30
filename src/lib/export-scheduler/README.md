# Data Export Scheduler

**Issue #267 - Data Export Scheduling**

Automated recurring data exports with scheduling, multiple formats, email delivery, and history tracking.

## Features

- ✅ **Scheduled Exports**: Cron-based scheduling for recurring exports
- ✅ **Multiple Formats**: CSV, JSON, XLSX, PDF
- ✅ **Email Delivery**: Automatic email notifications with download links
- ✅ **Export History**: Track all exports with status and metadata
- ✅ **Template Management**: Reusable export templates
- ✅ **Queue System**: Background job processing with retry logic

## Architecture

### Components

1. **Scheduler Service** (`scheduler-service.ts`)
   - Main orchestrator for scheduled exports
   - Checks for due schedules periodically
   - Queues export jobs

2. **Storage Layer** (`storage.ts`)
   - IndexedDB-based persistence
   - Stores templates, schedules, and history

3. **Exporter** (`exporter.ts`)
   - Handles data export in various formats
   - Fetches data from sources
   - Generates export files

4. **Notification Service** (`notification-service.ts`)
   - Sends email notifications
   - Handles success and failure notifications

5. **Cron Parser** (`cron-parser.ts`)
   - Parses and validates cron expressions
   - Calculates next run times

## Usage

### Starting the Scheduler

```typescript
import { schedulerService } from '@/lib/export-scheduler';

// Start the scheduler (checks every 60 seconds)
schedulerService.start(60000);

// Stop the scheduler
schedulerService.stop();
```

### Creating a Template

```typescript
import { createTemplate } from '@/lib/export-scheduler';

const template = await createTemplate(
  {
    name: 'Monthly Course Report',
    description: 'All courses with enrollment data',
    format: 'csv',
    dataSource: 'courses',
    columns: ['id', 'name', 'enrollments', 'created_at'],
  },
  'user-123',
);
```

### Creating a Schedule

```typescript
import { createSchedule, getNextRunTime } from '@/lib/export-scheduler';

const nextRun = getNextRunTime('0 0 1 * *'); // First day of month

const schedule = await createSchedule(
  {
    templateId: template.id,
    name: 'Monthly Export',
    frequency: 'monthly',
    emailDelivery: true,
    emailRecipients: ['admin@example.com'],
  },
  'user-123',
  nextRun,
);
```

### Executing an Export Immediately

```typescript
import { schedulerService } from '@/lib/export-scheduler';

const result = await schedulerService.executeExport(
  {
    templateId: 'template-123',
    immediate: true,
  },
  'user-123',
);
```

## API Endpoints

### Templates

- `GET /api/exports/templates` - List templates
- `POST /api/exports/templates` - Create template
- `GET /api/exports/templates/:id` - Get template
- `PATCH /api/exports/templates/:id` - Update template
- `DELETE /api/exports/templates/:id` - Delete template

### Schedules

- `GET /api/exports/schedules` - List schedules
- `POST /api/exports/schedules` - Create schedule
- `GET /api/exports/schedules/:id` - Get schedule
- `PATCH /api/exports/schedules/:id` - Update schedule
- `DELETE /api/exports/schedules/:id` - Delete schedule

### History

- `GET /api/exports/history` - Get export history

### Execute

- `POST /api/exports/execute` - Execute export immediately

## UI Pages

- `/exports` - Main dashboard (templates, schedules, history)
- `/exports/templates/new` - Create new template
- `/exports/schedules/new` - Create new schedule

## Cron Expression Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-6, 0=Sunday)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

### Examples

- `0 0 * * *` - Daily at midnight
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 0 1 * *` - Monthly on the 1st at midnight
- `*/15 * * * *` - Every 15 minutes
- `0 9 * * 1-5` - Weekdays at 9 AM

## Testing

```bash
npm test src/lib/export-scheduler
```

## Future Enhancements

- [ ] Cloud storage integration (S3, Azure Blob)
- [ ] Advanced filtering and transformations
- [ ] Export compression (ZIP)
- [ ] Webhook notifications
- [ ] Export templates sharing
- [ ] Data encryption for sensitive exports
- [ ] Rate limiting and quotas
- [ ] Export preview before scheduling

## Dependencies

- `idb` - IndexedDB wrapper
- Task Queue (`@/lib/queue`)
- Email Service (`@/lib/email`)
- API Client (`@/lib/api`)

## License

Part of the TeachLink platform.
