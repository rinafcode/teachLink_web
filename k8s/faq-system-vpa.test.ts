import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const deploymentManifest = readFileSync(
  join(process.cwd(), 'k8s/faq-system-deployment.yaml'),
  'utf8',
);
const vpaManifest = readFileSync(join(process.cwd(), 'k8s/faq-system-vpa.yaml'), 'utf8');

describe('faq-system deployment manifest', () => {
  it('declares deployment metadata and namespace correctly', () => {
    expect(deploymentManifest).toContain('name: teachlink-faq-system');
    expect(deploymentManifest).toContain('namespace: production');
    expect(deploymentManifest).toContain('component: faq-system');
  });

  it('configures container image and port', () => {
    expect(deploymentManifest).toContain('image: rinafcode/teachlink-faq-system:latest');
    expect(deploymentManifest).toContain('imagePullPolicy: Always');
    expect(deploymentManifest).toContain('containerPort: 3000');
  });

  it('sets production environment variables', () => {
    expect(deploymentManifest).toContain('name: NODE_ENV');
    expect(deploymentManifest).toContain("value: 'production'");
    expect(deploymentManifest).toContain('name: PORT');
    expect(deploymentManifest).toContain("value: '3000'");
  });

  it('defines initial resource requests and limits compatible with VPA', () => {
    expect(deploymentManifest).toContain('cpu: 150m');
    expect(deploymentManifest).toContain('memory: 256Mi');
    expect(deploymentManifest).toContain('cpu: 500m');
    expect(deploymentManifest).toContain('memory: 512Mi');
  });

  it('includes readiness and liveness probes', () => {
    expect(deploymentManifest).toContain('readinessProbe');
    expect(deploymentManifest).toContain('livenessProbe');
    expect(deploymentManifest).toContain('path: /api/health');
  });
});

describe('faq-system VPA manifest', () => {
  it('uses the VPA API version and kind', () => {
    expect(vpaManifest).toContain('apiVersion: autoscaling.k8s.io/v1');
    expect(vpaManifest).toContain('kind: VerticalPodAutoscaler');
  });

  it('declares VPA name and namespace', () => {
    expect(vpaManifest).toContain('name: teachlink-faq-system-vpa');
    expect(vpaManifest).toContain('namespace: production');
    expect(vpaManifest).toContain('component: faq-system');
  });

  it('targets the faq-system deployment', () => {
    expect(vpaManifest).toContain('apiVersion: apps/v1');
    expect(vpaManifest).toContain('kind: Deployment');
    expect(vpaManifest).toContain('name: teachlink-faq-system');
  });

  it('sets update mode to Auto', () => {
    expect(vpaManifest).toContain('updateMode: "Auto"');
  });

  it('specifies container resource policy for faq-system container', () => {
    expect(vpaManifest).toContain('containerName: faq-system');
    expect(vpaManifest).toContain('controlledResources');
    expect(vpaManifest).toContain('- cpu');
    expect(vpaManifest).toContain('- memory');
  });

  it('enforces minimum resource allowances', () => {
    expect(vpaManifest).toContain('minAllowed');
    expect(vpaManifest).toContain('cpu: 100m');
    expect(vpaManifest).toContain('memory: 128Mi');
  });

  it('enforces maximum resource allowances', () => {
    expect(vpaManifest).toContain('maxAllowed');
    expect(vpaManifest).toContain('cpu: 2000m');
    expect(vpaManifest).toContain('memory: 2Gi');
  });

  it('controls both requests and limits', () => {
    expect(vpaManifest).toContain('controlledValues: RequestsAndLimits');
  });
});
