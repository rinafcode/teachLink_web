import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPDFCache, generatePDF } from '@/services/pdf-generation';

const mocks = vi.hoisted(() => ({
  pdf: vi.fn(),
  setDefaultTimeout: vi.fn(),
  setContent: vi.fn(),
  newPage: vi.fn(),
  close: vi.fn(),
  launch: vi.fn(),
}));

vi.mock('puppeteer', () => ({
  default: { launch: mocks.launch },
}));

mocks.newPage.mockResolvedValue({
  setDefaultTimeout: mocks.setDefaultTimeout,
  setContent: mocks.setContent,
  pdf: mocks.pdf,
});
mocks.launch.mockResolvedValue({ newPage: mocks.newPage, close: mocks.close });

describe('PDF generation cache', () => {
  beforeEach(() => {
    clearPDFCache();
    vi.clearAllMocks();
    mocks.pdf.mockResolvedValue(Buffer.from('pdf'));
  });

  it('returns cached output for identical content and options', async () => {
    const first = await generatePDF('<p>same</p>', { format: 'A4' });
    const second = await generatePDF('<p>same</p>', { format: 'A4' });

    expect(first).toEqual(Buffer.from('pdf'));
    expect(second).toEqual(first);
    expect(mocks.pdf).toHaveBeenCalledTimes(1);
  });

  it('generates a different cache entry when input changes', async () => {
    await generatePDF('<p>one</p>');
    await generatePDF('<p>two</p>');

    expect(mocks.pdf).toHaveBeenCalledTimes(2);
  });
});