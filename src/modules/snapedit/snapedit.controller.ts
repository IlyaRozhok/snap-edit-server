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

const FILE_MAX_SIZE =
  parseInt(process.env.APP_FILE_MAX_SIZE_MB || '50', 10) * 1024 * 1024;

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

@Controller('snap_edit')
@UseGuards(BearerGuard)
export class SnapEditController {
  constructor(private readonly client: SnapEditClient) {}

  @Post('auto_suggest')
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
    @Body('session_id') sessionId?: string,
  ) {
    const image = files.find(
      (f) => f.fieldname === 'image' || f.fieldname === 'input_image',
    );
    const maskBrush = files.find((f) => f.fieldname === 'mask_brush');

    assertFile(image, true);
    assertFile(maskBrush, false);

    // Process image up to 1200px (as per requirements for auto-suggest/erase)
    const imgProcessed = await processImage(image.buffer, { maxSize: 1200 });

    return runWithLimit(() =>
      withRetry(() =>
        this.client.erase(imgProcessed, maskBrush.buffer, sessionId),
      ),
    );
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

  @Post('remove_bg')
  @UseInterceptors(
    FileInterceptor('image', { storage: multer.memoryStorage() }),
  )
  async removeBg(@UploadedFile() file: Express.Multer.File) {
    assertFile(file, true);
    const image = await processImage(file.buffer, { maxSize: 1200 });
    return runWithLimit(() => withRetry(() => this.client.removeBg(image)));
  }
}
