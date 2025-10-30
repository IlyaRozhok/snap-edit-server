import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';

const ENDPOINTS = {
  autoSuggest: '/object_removal/v1/auto_suggest',
  erase: '/object_removal/v1/erase',
  superErase: '/object_removal/v1/super_erase',
  save: '/object_removal/v1/save',
  enhance: '/image_enhancement/v1/enhance',
  removeBg: '/background_removal/v1/erase',
};

function toUpstreamError(e: any) {
  let message = 'SnapEdit upstream error';
  if (e.response && e.response.data) {
    message =
      e.response.data?.error?.message || JSON.stringify(e.response.data);
  } else if (e.message) {
    message = e.message;
  }
  const err: any = new Error(message);
  err.response = e.response;
  err.code = 'UPSTREAM_ERROR';
  throw err;
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

  async save(sessionId: string) {
    const fd = new FormData();
    fd.append('session_id', sessionId);
    try {
      const res = await axios.post(this.baseUrl + ENDPOINTS.save, fd, {
        headers: { ...fd.getHeaders(), ...this.getHeaders() },
        timeout: 120000,
      });
      return res.data;
    } catch (e) {
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
