# Notification Persistent Volumes

The production notification system stores durable notification data on a Kubernetes
PersistentVolumeClaim so pod restarts do not discard queued or cached notification
state.

## Kubernetes Resources

Apply `k8s/notification-system-persistence.yaml` with the rest of the production
manifests:

```bash
kubectl apply -f k8s/notification-system-persistence.yaml
```

The manifest creates:

- `PersistentVolumeClaim/teachlink-notification-data` with `1Gi` requested storage.
- `Deployment/teachlink-notification-system` with the PVC mounted at
  `/var/lib/teachlink/notifications`.
- `NOTIFICATION_STORAGE_PATH=/var/lib/teachlink/notifications` for the application.

The deployment uses one replica and the `Recreate` strategy because the PVC uses
`ReadWriteOnce`. If the cluster provides a `ReadWriteMany` storage class, the
replica count can be raised after updating the PVC access mode and validating
concurrent writes.

## Validation

Run the manifest regression test before deploying:

```bash
pnpm test k8s/notification-system-persistence.test.ts
```

This confirms the deployment still mounts the notification PVC and keeps the
storage-safe rollout settings.
