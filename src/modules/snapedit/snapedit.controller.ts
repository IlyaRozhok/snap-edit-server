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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { TokenDeductInterceptor } from '../../common/interceptors/token-deduct.interceptor';
import { SnapEditClient } from './snapedit.service';
import * as multer from 'multer';
import { runWithLimit } from '../../common/utils/queue';
import { withRetry } from '../../common/utils/retry';
import { processImage } from '../../common/utils/image-processor';
import sharp from 'sharp';

class AutoSuggestBodyDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Image file (JPEG, PNG, HEIC). Max 50 MB.' })
  image: Express.Multer.File;

  @ApiProperty({ required: false, description: 'Session ID to group multiple edits', example: 'sess_abc123' })
  @IsOptional() @IsString()
  session_id?: string;
}

class EraseBodyDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Original image (JPEG, PNG, HEIC). Max 50 MB.' })
  image: Express.Multer.File;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Mask brush file — black/white mask indicating area to erase.' })
  mask_brush: Express.Multer.File;

  @ApiProperty({ required: false, description: 'Session ID to group multiple edits', example: 'sess_abc123' })
  @IsOptional() @IsString()
  session_id?: string;
}

class EnhanceBodyDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Image file (JPEG, PNG, HEIC). Max 50 MB.' })
  image: Express.Multer.File;

  @ApiProperty({ required: false, enum: ['fine', 'ultra'], default: 'fine', description: '`fine` — standard quality, `ultra` — maximum quality (slower)' })
  quality?: 'fine' | 'ultra';
}

class RemoveBgBodyDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Image file (JPEG, PNG, HEIC). Max 50 MB.' })
  image: Express.Multer.File;
}

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

@ApiTags('snap_edit')
@ApiBearerAuth()
@Controller('snap_edit')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TokenDeductInterceptor)
export class SnapEditController {
  constructor(private readonly client: SnapEditClient) {}

  @Post('auto_suggest')
  @ApiOperation({
    summary: 'Auto suggest edits for an image',
    description: 'Analyzes the image and returns AI-generated edit suggestions. Costs 1 token.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AutoSuggestBodyDto })
  @ApiResponse({ status: 201, description: 'Edit suggestions returned successfully' })
  @ApiResponse({ status: 400, description: 'File missing, too large, or unsupported format' })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid' })
  @ApiResponse({ status: 402, description: 'Insufficient tokens — top up required' })
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
  @ApiOperation({
    summary: 'Erase object from image using a mask',
    description: 'Removes a selected area defined by the mask brush from the image. Costs 1 token.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: EraseBodyDto })
  @ApiResponse({ status: 201, description: 'Processed image returned successfully' })
  @ApiResponse({ status: 400, description: 'File missing, too large, or unsupported format' })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid' })
  @ApiResponse({ status: 402, description: 'Insufficient tokens — top up required' })
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

    const imgProcessed = await processImage(image.buffer, { maxSize: 1200 });

    return runWithLimit(() =>
      withRetry(() =>
        this.client.erase(imgProcessed, maskBrush.buffer, sessionId),
      ),
    );
  }

  @Post('enhance')
  @ApiOperation({
    summary: 'Enhance image quality',
    description: 'Upscales and sharpens the image. Use `quality=ultra` for maximum detail (slower). Costs 1 token.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: EnhanceBodyDto })
  @ApiResponse({ status: 201, description: 'Enhanced image returned successfully' })
  @ApiResponse({ status: 400, description: 'File missing, too large, unsupported format, or invalid quality value' })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid' })
  @ApiResponse({ status: 402, description: 'Insufficient tokens — top up required' })
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
      withRetry(() => this.client.enhance(image, quality, '0')),
    );
  }

  @Post('remove_bg')
  @ApiOperation({
    summary: 'Remove background from image',
    description: 'Detects and removes the background, returning an image with a transparent background (PNG). Costs 1 token.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: RemoveBgBodyDto })
  @ApiResponse({ status: 201, description: 'Image with background removed returned successfully' })
  @ApiResponse({ status: 400, description: 'File missing, too large, or unsupported format' })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid' })
  @ApiResponse({ status: 402, description: 'Insufficient tokens — top up required' })
  @UseInterceptors(
    FileInterceptor('image', { storage: multer.memoryStorage() }),
  )
  async removeBg(@UploadedFile() file: Express.Multer.File) {
    assertFile(file, true);
    const image = await processImage(file.buffer, { maxSize: 1200 });
    return runWithLimit(() => withRetry(() => this.client.removeBg(image)));
  }
}
