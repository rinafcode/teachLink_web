import puppeteer from 'puppeteer';

/**
 * Generate a PDF from the provided HTML string using Puppeteer.
 *
 * The function launches a headless Chromium instance, creates a new page,
 * sets a default navigation/operation timeout of 25 seconds (as per the
 * specification), renders the HTML, and returns the PDF as a Buffer.
 *
 * @param html - The HTML content to render.
 * @param options - Optional Puppeteer PDF options (e.g., format, margins).
 * @returns A Promise that resolves with the generated PDF Buffer.
 */
export async function generatePDF(
  html: string,
  options?: puppeteer.PDFOptions
): Promise<Buffer> {
  // Launch a headless browser. The flags ensure compatibility in most CI
  // and server environments without a sandbox.
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    // Apply the required default timeout (25 000 ms) to prevent indefinite hangs.
    page.setDefaultTimeout(25000);

    // Load the HTML content. Use "domcontentloaded" instead of "networkidle0"
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // Generate the PDF. Caller may supply additional options.
    const pdfBuffer = await page.pdf({ format: 'A4', ...options });
    return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  } finally {
    // Ensure the browser process is always cleaned up, even on errors or timeouts.
    await browser.close();
  }
}