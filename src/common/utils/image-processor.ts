import sharp from 'sharp';

export async function validateImage(
  buffer: Buffer,
  mime: string,
  maxSizeMB = 50,
): Promise<void> {
  const allowed = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
  if (!allowed.includes(mime)) {
    throw new Error('Unsupported image type');
  }
  if (buffer.length > maxSizeMB * 1024 * 1024) {
    throw new Error('File size exceeds limit');
  }
}

export async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  // HEIC->JPEG: sharp автоматически определяет формат
  return sharp(buffer).jpeg().toBuffer();
}

export async function resizeByLongestSide(
  buffer: Buffer,
  maxSide: number,
): Promise<Buffer> {
  const img = sharp(buffer);
  const metadata = await img.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (width <= maxSide && height <= maxSide) return buffer;
  const opts: { width?: number; height?: number } = {};
  if (width >= height) {
    opts.width = maxSide;
  } else {
    opts.height = maxSide;
  }
  return img.resize(opts).toBuffer();
}

export interface ProcessImageOptions {
  maxSize: number;
}

function isHeic(mime: string) {
  return (
    mime === 'image/heic' ||
    mime === 'image/heif' ||
    mime === 'heic' ||
    mime === 'heif'
  );
}

export async function processImage(
  buffer: Buffer,
  options: ProcessImageOptions,
): Promise<Buffer> {
  let img = sharp(buffer, { failOnError: false });
  let metadata = await img.metadata();

  // Определяем MIME
  let mime = metadata.format;

  // HEIC/HEIF поддержка
  if (isHeic(mime || '')) {
    const heifSupported = (sharp.format as any)?.heif?.input;
    if (!heifSupported) {
      throw new Error('HEIC/HEIF format not supported by sharp.');
    }
    // sharp сам декодирует HEIC/HEIF → JPEG, если вызвать .jpeg()
    img = sharp(buffer).jpeg();
    metadata = await img.metadata();
    mime = 'jpeg';
  }

  // Нормализация ориентации
  img = img.rotate();

  // Ресайз по длинной стороне (width > height ? width : height → maxSize)
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const max = options.maxSize;
  let resizeOptions: { width?: number; height?: number } = {};
  if (width > max || height > max) {
    if (width >= height) {
      resizeOptions.width = max;
    } else {
      resizeOptions.height = max;
    }
    img = img.resize(resizeOptions);
  }

  // Сжимаем в JPEG
  img = img.jpeg({ quality: 92, chromaSubsampling: '4:4:4' });
  return img.toBuffer();
}
