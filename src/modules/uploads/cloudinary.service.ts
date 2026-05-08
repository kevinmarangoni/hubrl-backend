import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

type UploadImageInput = {
  fileBuffer: Buffer;
  folder: string;
  publicId: string;
};

@Injectable()
export class CloudinaryService {
  private initialized = false;

  private ensureConfigured() {
    if (this.initialized) {
      return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET sao obrigatorias',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.initialized = true;
  }

  async uploadImage(input: UploadImageInput): Promise<UploadApiResponse> {
    this.ensureConfigured();

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: input.folder,
          public_id: input.publicId,
          overwrite: true,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Falha ao subir imagem no Cloudinary'));
            return;
          }

          resolve(result);
        },
      );

      stream.end(input.fileBuffer);
    });
  }

  async destroyImage(publicId: string) {
    this.ensureConfigured();
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  }
}
