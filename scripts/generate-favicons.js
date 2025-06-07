const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 64, 128, 192, 512];
const inputFile = path.join(__dirname, '../public/teachlink-logo.png');
const outputDir = path.join(__dirname, '../public/favicons');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate different sizes
sizes.forEach(size => {
  sharp(inputFile)
    .resize(size, size)
    .toFile(path.join(outputDir, `favicon-${size}x${size}.png`))
    .then(() => console.log(`Generated ${size}x${size} favicon`))
    .catch(err => console.error(`Error generating ${size}x${size} favicon:`, err));
});

// Generate ICO file (16x16 and 32x32)
sharp(inputFile)
  .resize(32, 32)
  .toFile(path.join(outputDir, 'favicon.ico'))
  .then(() => console.log('Generated favicon.ico'))
  .catch(err => console.error('Error generating favicon.ico:', err));

// Generate Apple Touch Icon
sharp(inputFile)
  .resize(180, 180)
  .toFile(path.join(outputDir, 'apple-touch-icon.png'))
  .then(() => console.log('Generated apple-touch-icon.png'))
  .catch(err => console.error('Error generating apple-touch-icon.png:', err)); 