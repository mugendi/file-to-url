<!--
 Copyright (c) 2024 Anthony Mugendi
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

```javascript 

// Handle an image with optimization
const optimizedImage = await FileHandler.handle('image.jpg');
await optimizedImage.toFile('optimized.jpg');

// Handle an image but skip optimization
const unoptimizedImage = await FileHandler.handle('image.jpg', {
  skipImageOptimization: true
});
const imageBase64 = unoptimizedImage.toBase64URL();

// Handle a PDF or any other file type
const pdfHandler = await FileHandler.handle('document.pdf');
const pdfStream = pdfHandler.toStream();

// Handle an image with custom options
const customImage = await FileHandler.handle('large-image.png', {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 85,
  format: 'webp'
});
const webpBlob = customImage.toBlob();

// Check if file is an image before doing image-specific operations
const handler = await FileHandler.handle('unknown-file');
if (handler.isImage()) {
  console.log('Processing image...');
} else {
  console.log('Processing other file type...');
}

```