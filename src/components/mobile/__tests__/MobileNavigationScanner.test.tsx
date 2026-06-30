import { afterEach, beforeEach, beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@/context/ToastContext';
import { MobileNavigationScanner } from '../MobileNavigationScanner';
import jsQR from 'jsqr';

vi.mock('jsqr', () => ({ __esModule: true, default: vi.fn() }));

beforeAll(() => {
  // Mock URL helpers used when creating object URLs for uploaded images
  // Provide deterministic values for tests
  // @ts-ignore
  global.URL.createObjectURL = vi.fn(() => 'mock-url');
  // @ts-ignore
  global.URL.revokeObjectURL = vi.fn();
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('MobileNavigationScanner Component', () => {
  const originalMediaDevices = navigator.mediaDevices;
  const originalImage = global.Image;

  beforeEach(() => {
    vi.resetAllMocks();

    Object.defineProperty(global, 'Image', {
      configurable: true,
      writable: true,
      value: class {
        onload?: () => void;
        onerror?: () => void;
        width = 100;
        height = 100;
        set src(_src: string) {
          this.onload?.();
        }
      },
    });

    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: vi.fn(() => ({
        drawImage: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray([0, 0, 0, 0]),
          width: 1,
          height: 1,
        })),
      })),
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'Image', {
      configurable: true,
      writable: true,
      value: originalImage,
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: originalMediaDevices,
    });
    vi.restoreAllMocks();
  });

  function renderScanner() {
    return render(
      <ToastProvider>
        <MobileNavigationScanner isOpen={true} onClose={vi.fn()} />
      </ToastProvider>,
    );
  }

  it('renders the scanner dialog when open', () => {
    renderScanner();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /mobile scanner/i })).toBeInTheDocument();
  });

  it('shows a camera permission fallback when camera access is unavailable', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    renderScanner();

    await userEvent.click(screen.getByRole('button', { name: /start camera scan/i }));

    expect(await screen.findByText(/camera access is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/use image upload instead/i)).toBeInTheDocument();
  });

  it('uploads an image and shows a successful QR scan result', async () => {
    // jsQR is mocked as an ES module default; the imported `jsQR` is the mock function itself.
    (jsQR as unknown as any).mockReturnValue({ data: 'TEST-QR' });

    renderScanner();

    const uploadInput = screen.getByLabelText(/Upload QR image/i) as HTMLInputElement;
    const file = new File(['dummy'], 'qrcode.png', { type: 'image/png' });

    await userEvent.upload(uploadInput, file);

    await waitFor(() => {
      // Toast shows scanned message
      expect(screen.getByText(/scanned: TEST-QR/i)).toBeInTheDocument();
    });
  });
});
