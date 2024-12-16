/**
 * Copyright (c) 2024 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import sharp from 'sharp';
import fetch from 'node-fetch';
import fs from 'fs/promises';
// import path from 'node:path';
import { Readable } from 'stream';
import mime from 'mime-types';

class FileHandler {
  constructor(options = {}) {
    this.options = {
      maxWidth: options.maxWidth || 500,
      maxHeight: options.maxHeight || 500,
      quality: options.quality || 90,
      format: options.format || 'jpeg',
      skipImageOptimization: options.skipImageOptimization || false,
    };
    this.buffer = null;
    this.mimeType = null;
  }

  static async handle(input, options = {}) {
    this.handler = new FileHandler(options);
    await this.handler.processInput(input);

    return this.handler;
  }

  isImage() {
    return this.mimeType?.startsWith('image/');
  }

  async processInput(input) {
    let buffer;
    let mimeType;

    if (typeof input === 'string') {
      // Check if input is URL
      if (input.startsWith('http://') || input.startsWith('https://')) {
        const response = await fetch(input);
        buffer = Buffer.from(await response.arrayBuffer());
        mimeType = response.headers.get('content-type');
      } else {
        // Treat as file path
        buffer = await fs.readFile(input);
        mimeType = mime.lookup(input) || 'application/octet-stream';
      }
    } else if (input instanceof Buffer) {
      buffer = input;
      // Try to detect mime type from buffer
      mimeType = await FileHandler.detectMimeType(buffer);
    } else if (input instanceof Readable) {
      // Handle streams
      const chunks = [];
      for await (const chunk of input) {
        chunks.push(chunk);
      }
      buffer = Buffer.concat(chunks);
      mimeType = await FileHandler.detectMimeType(buffer);
    } else if (input instanceof Blob) {
      buffer = await input.arrayBuffer();
      buffer = Buffer.from(buffer);
      mimeType = input.type || 'application/octet-stream';
    } else {
      throw new Error('Unsupported input format');
    }

    this.mimeType = mimeType;

    // Only optimize if it's an image and optimization isn't explicitly skipped
    if (this.isImage() && !this.options.skipImageOptimization) {
      await this.optimizeImage(buffer);
    } else {
      this.buffer = buffer;
    }

    return this;
  }

  async optimizeImage(buffer) {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Only resize if image is larger than max dimensions
    if (
      metadata.width > this.options.maxWidth ||
      metadata.height > this.options.maxHeight
    ) {
      image.resize(this.options.maxWidth, this.options.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    let img = image.toFormat(this.options.format, {
      quality: this.options.quality,
    });

    this.buffer = await img.toBuffer();

    // Update mime type to reflect the new format
    this.mimeType = `image/${this.options.format}`;
  }

  static async detectMimeType(buffer) {
    // This is a simple check. In production, you might want to use
    // more robust solutions like 'file-type' npm package
    try {
      const metadata = await sharp(buffer).metadata();
      return `image/${metadata.format}`;
    } catch {
      return 'application/octet-stream';
    }
  }

  toFile(path, isIntermediary = false) {
    fs.writeFile(path, this.buffer);
    return isIntermediary ? this : path;
  }

  toBase64URL() {
    const base64 = this.buffer.toString('base64');
    return `data:${this.mimeType};base64,${base64}`;
  }

  toBase64() {
    const base64 = this.buffer.toString('base64');
    return base64;
  }

  toStream() {
    return Readable.from(this.buffer);
  }

  toBuffer() {
    return this.buffer;
  }

  toBase64Buffer() {
    return Buffer.from(this.buffer.toString('base64'));
  }

  toBlob() {
    return new Blob([this.buffer], { type: this.mimeType });
  }
}

export default FileHandler;
