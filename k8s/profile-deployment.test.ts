import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const deploymentManifest = readFileSync(join(process.cwd(), 'k8s/profile-deployment.yaml'), 'utf8');
const hpaManifest = readFileSync(join(process.cwd(), 'k8s/profile-hpa.yaml'), 'utf8');

describe('profile deployment manifest', () => {
  it('declares the deployment metadata and namespace correctly', () => {
    expect(deploymentManifest).toContain('name: teachlink-profile');
    expect(deploymentManifest).toContain('namespace: production');
    expect(deploymentManifest).toContain('component: profile');
  });

  it('configures container port and image pull policy', () => {
    expect(deploymentManifest).toContain('image: rinafcode/teachlink-profile:latest');
    expect(deploymentManifest).toContain('imagePullPolicy: Always');
    expect(deploymentManifest).toContain('containerPort: 3000');
  });

  it('sets production environment variables', () => {
    expect(deploymentManifest).toContain('name: NODE_ENV');
    expect(deploymentManifest).toContain("value: 'production'");
    expect(deploymentManifest).toContain('name: PORT');
    expect(deploymentManifest).toContain("value: '3000'");
  });

  it('defines resource requests and limits', () => {
    expect(deploymentManifest).toContain('cpu: 250m');
    expect(deploymentManifest).toContain('memory: 256Mi');
    expect(deploymentManifest).toContain('cpu: 1000m');
    expect(deploymentManifest).toContain('memory: 512Mi');
  });
});

describe('profile hpa manifest', () => {
  it('references the correct deployment target', () => {
    expect(hpaManifest).toContain('name: teachlink-profile-hpa');
    expect(hpaManifest).toContain('name: teachlink-profile');
    expect(hpaManifest).toContain('kind: Deployment');
  });

  it('configures replication scale limits', () => {
    expect(hpaManifest).toContain('minReplicas: 2');
    expect(hpaManifest).toContain('maxReplicas: 10');
  });

  it('defines CPU and memory utilization thresholds', () => {
    expect(hpaManifest).toContain('averageUtilization: 70');
    expect(hpaManifest).toContain('averageUtilization: 80');
  });
});
