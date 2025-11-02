import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';
import { extractErrorMessage } from 'src/common/utils/extractErrorMessage';
import {
  convertHeicToJpeg,
  resizeByLongestSide,
} from 'src/common/utils/image-processor';

const ENDPOINTS = {
  autoSuggest: '/object_removal/v1/auto_suggest',
  erase: '/object_removal/v1/erase',
  superErase: '/object_removal/v1/super_erase',
  save: '/object_removal/v1/save',
  enhance: '/image_enhancement/v1/enhance',
  removeBg: '/background_removal/v1/erase',
};

function toUpstreamError(e: any) {
  const fallback = 'SnapEdit upstream error';
  const data = e?.response?.data;
  const messageFromData = extractErrorMessage(data);
  const message = messageFromData || e?.message || fallback;
  const err: any = new Error(message);
  err.response = e?.response;
  err.code = 'UPSTREAM_ERROR';
  throw err;
}

async function normalizeLargeToJpeg4000(
  buf: Buffer,
  mime?: string,
): Promise<Buffer> {
  let b = buf;

  if (mime && /heic|heif/i.test(mime)) {
    b = await convertHeicToJpeg(b);
  }

  b = await resizeByLongestSide(b, 4000);

  b = await sharp(b)
    .rotate()
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toBuffer();
  return b;
}

@Injectable()
export class SnapEditClient {
  private readonly baseUrl: string | undefined;
  private readonly apiKey: string | undefined;

  constructor() {
    this.baseUrl = process.env.APP_SNAPEDIT_BASE_URL;
    this.apiKey = process.env.APP_SNAPEDIT_API_KEY;

    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'SnapEdit API key is not configured. Set SNAPEDIT_API_KEY in .env',
      );
    }
  }

  private getHeaders() {
    return { 'X-API-KEY': this.apiKey as string };
  }

  async autoSuggest(image: Buffer, sessionId?: string) {
    const fd = new FormData();
    fd.append('original_preview_image', image, {
      filename: 'image.jpg',
      contentType: 'image/jpeg',
    });
    if (sessionId) fd.append('session_id', sessionId);
    try {
      const res = await axios.post(this.baseUrl + ENDPOINTS.autoSuggest, fd, {
        headers: { ...fd.getHeaders(), ...this.getHeaders() },
        timeout: 60000,
      });
      return res.data;
    } catch (e) {
      toUpstreamError(e);
    }
  }

  async erase(
    image: Buffer,
    maskBrush: Buffer,
    sessionId?: string,
    maskBase?: Buffer,
  ) {
    const fd = new FormData();

    fd.append('image', image, { filename: 'image.jpg' });
    fd.append('mask_brush', maskBrush, { filename: 'mask_brush.png' });
    if (sessionId) fd.append('session_id', sessionId);
    console.log(fd);
    if (maskBase)
      fd.append('mask_base', maskBase, { filename: 'mask_base.png' });
    try {
      const res = await axios.post(this.baseUrl + ENDPOINTS.erase, fd, {
        headers: { ...fd.getHeaders(), ...this.getHeaders() },
        timeout: 120000,
      });
      return res.data;
    } catch (e) {
      toUpstreamError(e);
    }
  }

  async save(
    image: Buffer,
    sessionId: string,
    previewMaskFile: Buffer,
    previewImageToSave: Buffer,
    originalLargeImage: Express.Multer.File,
  ) {
    const fd = new FormData();
    if (image && image.length > 0) {
      const previewBuf = await sharp(image)
        .rotate()
        .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
        .toBuffer();
      fd.append('original_preview_image', previewBuf, {
        filename: 'preview.jpg',
        contentType: 'image/jpeg',
      });
    }
    const maskBuf = await sharp(previewMaskFile).ensureAlpha().png().toBuffer();
    const maskBase64 = maskBuf.toString('base64');
    fd.append('preview_mask_to_save', maskBase64);
    if (!sessionId) {
      if (!previewImageToSave || previewImageToSave.length === 0) {
        throw new Error(
          'preview_image_to_save is required when session_id is not provided',
        );
      }
      const prevResized = await sharp(previewImageToSave)
        .rotate()
        .resize({
          width: 1200,
          height: 1200,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
        .toBuffer();

      fd.append('preview_image_to_save', prevResized, {
        filename: 'preview_result.jpg',
        contentType: 'image/jpeg',
      });
    } else if (previewImageToSave && previewImageToSave.length > 0) {
      const prevResized = await sharp(previewImageToSave)
        .rotate()
        .resize({
          width: 1200,
          height: 1200,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
        .toBuffer();

      fd.append('preview_image_to_save', prevResized, {
        filename: 'preview_result.jpg',
        contentType: 'image/jpeg',
      });
    }
    if (!originalLargeImage?.buffer) {
      throw new Error('original_large_image file buffer missing');
    }
    const largeJpeg = await normalizeLargeToJpeg4000(
      originalLargeImage.buffer,
      originalLargeImage.mimetype,
    );

    const largeBase64 = largeJpeg.toString('base64');
    fd.append('original_large_image', largeBase64);

    if (sessionId) {
      fd.append('session_id', sessionId);
    }

    try {
      const headers = { ...fd.getHeaders(), ...this.getHeaders() };
      console.log('SAVE request fields:', {
        hasOriginalPreview: image && image.length > 0,
        hasPreviewMask: previewMaskFile && previewMaskFile.length > 0,
        hasPreviewImageToSave:
          previewImageToSave && previewImageToSave.length > 0,
        hasOriginalLarge:
          originalLargeImage?.buffer && originalLargeImage.buffer.length > 0,
        hasSessionId: !!sessionId,
      });
      const res = await axios.post(this.baseUrl + ENDPOINTS.save, fd, {
        headers,
        timeout: 120_000,
      });
      return res.data;
    } catch (e) {
      console.error('SAVE error detail:', {
        status: e?.response?.status,
        statusText: e?.response?.statusText,
        data: e?.response?.data,
        headers: e?.response?.headers,
      });
      toUpstreamError(e);
    }
  }

  async enhance(image: Buffer, quality: 'fine' | 'ultra') {
    const fd = new FormData();
    fd.append('image', image, { filename: 'image.jpg' });
    fd.append('quality', quality);
    try {
      const res = await axios.post(this.baseUrl + ENDPOINTS.enhance, fd, {
        headers: { ...fd.getHeaders(), ...this.getHeaders() },
        timeout: 120000,
      });
      return res.data;
    } catch (e) {
      toUpstreamError(e);
    }
  }

  async removeBg(image: Buffer) {
    const fd = new FormData();
    fd.append('input_image', image, {
      filename: 'image.jpg',
      contentType: 'image/jpeg',
    });
    console.log(fd);
    try {
      const res = await axios.post(this.baseUrl + ENDPOINTS.removeBg, fd, {
        headers: { ...fd.getHeaders(), ...this.getHeaders() },
        timeout: 60000,
      });

      return res.data;
    } catch (e) {
      toUpstreamError(e);
    }
  }
}
