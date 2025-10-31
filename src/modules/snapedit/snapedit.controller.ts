import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { BearerGuard } from '../../common/guards/bearer.guard';
import { SnapEditClient } from './snapedit-client.service';
import * as multer from 'multer';
import { runWithLimit } from '../../common/utils/queue';
import { withRetry } from '../../common/utils/retry';
import { processImage } from '../../common/utils/image-processor';

const FILE_MAX_SIZE = 50 * 1024 * 1024;

function assertFile(
  file: Express.Multer.File | undefined,
  mustImage = true,
): asserts file is Express.Multer.File {
  if (!file) throw new BadRequestException('File is required');
  if (file.size > FILE_MAX_SIZE)
    throw new BadRequestException('File too large');
  if (
    mustImage &&
    !['image/jpeg', 'image/png', 'image/heic', 'image/heif'].includes(
      file.mimetype,
    )
  ) {
    throw new BadRequestException('Unsupported file type');
  }
}

@Controller('v1')
@UseGuards(BearerGuard)
export class SnapEditController {
  constructor(private readonly client: SnapEditClient) {}

  @Post('auto-suggest')
  @UseInterceptors(
    FileInterceptor('image', { storage: multer.memoryStorage() }),
  )
  async autoSuggest(
    @UploadedFile() file: Express.Multer.File,
    @Body('session_id') sessionId?: string,
  ) {
    assertFile(file, true);
    const image = await processImage(file.buffer, { maxSize: 1200 });
    return runWithLimit(() =>
      withRetry(() => this.client.autoSuggest(image, sessionId)),
    );
  }

  @Post('erase')
  @UseInterceptors(AnyFilesInterceptor({ storage: multer.memoryStorage() }))
  async erase(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: any,
  ) {
    const image = files.find((f) => f.fieldname === 'image');
    const maskBrush = files.find((f) => f.fieldname === 'mask_brush');
    // const maskBase = files.find((f) => f.fieldname === 'mask_base');

    assertFile(image, true);
    assertFile(maskBrush, false);
    const imgProcessed = await processImage(image.buffer, { maxSize: 1200 });
    console.log('imgProcessedsed', imgProcessed);
    return runWithLimit(() =>
      withRetry(() =>
        this.client.erase(
          imgProcessed,
          maskBrush.buffer,
          body.session_id,
          // maskBase?.buffer,
        ),
      ),
    );
  }

  @Post('save')
  async save(
    @UploadedFile() filePreview: Express.Multer.File,
    @UploadedFile() file: Express.Multer.File,
    @Body('sessionId') sessionId: string,
    @Body('previewMaskToSave') previewMaskToSave: string,
    @Body('previewImageToSave') previewImageToSave: string,
    @Body('originalLargeImage') originalLargeImage: string,
  ) {
    if (!previewMaskToSave) {
      throw new BadRequestException('previewMaskToSave required');
    }

    if (!previewMaskToSave) {
      throw new BadRequestException(
        'previewImageToSave required. You can provide SessionId',
      );
    }

    if (!originalLargeImage) {
      throw new BadRequestException('originalLargeImage required');
    }

    assertFile(file, false);
    const image = filePreview.find((f) => f.fieldname === 'original_preview_image');
    return runWithLimit(() => withRetry(() => this.client.save(sessionId)));
  }

  @Post('enhance')
  @UseInterceptors(
    FileInterceptor('image', { storage: multer.memoryStorage() }),
  )
  async enhance(
    @UploadedFile() file: Express.Multer.File,
    @Body('quality') quality: 'fine' | 'ultra' = 'fine',
  ) {
    assertFile(file, true);
    const maxSize = 3000;
    const image = await processImage(file.buffer, { maxSize });
    if (quality !== 'fine' && quality !== 'ultra')
      throw new BadRequestException('Invalid quality');
    return runWithLimit(() =>
      withRetry(() => this.client.enhance(image, quality)),
    );
  }

  @Post('remove-bg')
  @UseInterceptors(
    FileInterceptor('image', { storage: multer.memoryStorage() }),
  )
  async removeBg(@UploadedFile() file: Express.Multer.File) {
    assertFile(file, true);
    const image = await processImage(file.buffer, { maxSize: 1200 });
    return runWithLimit(() => withRetry(() => this.client.removeBg(image)));
  }
}
