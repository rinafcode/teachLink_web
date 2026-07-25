import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const manifest = readFileSync(
  join(process.cwd(), 'k8s/notification-system-persistence.yaml'),
  'utf8',
);

describe('notification system persistence manifest', () => {
  it('declares a persistent volume claim for notification data', () => {
    expect(manifest).toContain('kind: PersistentVolumeClaim');
    expect(manifest).toContain('name: teachlink-notification-data');
    expect(manifest).toContain('component: notification-system');
    expect(manifest).toContain('storage: 1Gi');
  });

  it('mounts the notification PVC into the deployment', () => {
    expect(manifest).toContain('kind: Deployment');
    expect(manifest).toContain('name: teachlink-notification-system');
    expect(manifest).toContain('mountPath: /var/lib/teachlink/notifications');
    expect(manifest).toContain('claimName: teachlink-notification-data');
  });

  it('uses a single replica with Recreate for ReadWriteOnce storage safety', () => {
    expect(manifest).toMatch(/replicas:\s*1/);
    expect(manifest).toMatch(/strategy:\s*\n\s*type: Recreate/);
    expect(manifest).toContain('ReadWriteOnce');
  });
});
