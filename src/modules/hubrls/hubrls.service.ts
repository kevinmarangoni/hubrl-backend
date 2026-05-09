import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { CloudinaryService } from '../uploads/cloudinary.service';
import { CreateHubrlDto } from './dto/create-hubrl.dto';
import { Hubrl, HubrlDocument } from './schemas/hubrl.schema';

function sanitizeBackgroundGradientCss(raw: string | undefined | null): string | null {
  const s = raw?.trim();
  if (!s || s.length > 2048) {
    return null;
  }
  const head = s.slice(0, 32).trimStart().toLowerCase();
  if (!head.startsWith('linear-gradient(') && !head.startsWith('radial-gradient(')) {
    return null;
  }
  if (/url\s*\(|expression\s*\(|javascript:|@import|\/\*/i.test(s)) {
    return null;
  }
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s)) {
    return null;
  }
  return s;
}

function normalizeLayerOpacity(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return 100;
  }
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Legado: raio unico (min 4 px ou pílula). */
function normalizeLinkBorderRadiusPx(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return 9999;
  }
  if (n >= 500) {
    return 9999;
  }
  return Math.min(48, Math.max(4, Math.round(n)));
}

/** Um canto: 0–48 px ou >=500 como pílula (9999). */
function normalizeLinkCornerRadiusPx(raw: unknown, fallback: number): number {
  if (raw === undefined || raw === null) {
    return fallback;
  }
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  if (n >= 500) {
    return 9999;
  }
  return Math.min(48, Math.max(0, Math.round(n)));
}

function legacyUniformRadiusFromLink(link: {
  borderRadiusPx?: number | null;
  borderRadiusTopLeftPx?: number | null;
  borderRadiusTopRightPx?: number | null;
  borderRadiusBottomRightPx?: number | null;
  borderRadiusBottomLeftPx?: number | null;
}): number {
  const hasAnyCorner =
    link.borderRadiusTopLeftPx != null ||
    link.borderRadiusTopRightPx != null ||
    link.borderRadiusBottomRightPx != null ||
    link.borderRadiusBottomLeftPx != null;
  if (hasAnyCorner) {
    return 9999;
  }
  if (link.borderRadiusPx != null) {
    return normalizeLinkBorderRadiusPx(link.borderRadiusPx);
  }
  return 9999;
}

function generateHubrlPublicId(): string {
  return randomUUID();
}

@Injectable()
export class HubrlsService {
  constructor(
    @InjectModel(Hubrl.name) private readonly hubrlModel: Model<HubrlDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(ownerId: string, input: CreateHubrlDto) {
    const title = input?.title?.trim();
    if (!title) {
      throw new BadRequestException('Titulo do hubrl e obrigatorio');
    }

    const links =
      input.links?.map((link) => {
        const fb = legacyUniformRadiusFromLink(link);
        return {
          avatarImageUrl: link.avatarImageUrl?.trim() || null,
          backgroundColor: link.backgroundColor?.trim() || null,
          backgroundImageUrl: link.backgroundImageUrl?.trim() || null,
          backgroundGradientCss: sanitizeBackgroundGradientCss(link.backgroundGradientCss),
          backgroundImageLayerOn: Boolean(link.backgroundImageLayerOn),
          backgroundImageLayerOpacity: normalizeLayerOpacity(link.backgroundImageLayerOpacity),
          backgroundSolidLayerOn: Boolean(link.backgroundSolidLayerOn),
          backgroundSolidLayerOpacity: normalizeLayerOpacity(link.backgroundSolidLayerOpacity),
          backgroundGradientLayerOn:
            link.backgroundGradientLayerOn === undefined ? true : Boolean(link.backgroundGradientLayerOn),
          backgroundGradientLayerOpacity: normalizeLayerOpacity(link.backgroundGradientLayerOpacity),
          borderRadiusPx: null,
          borderRadiusTopLeftPx: normalizeLinkCornerRadiusPx(link.borderRadiusTopLeftPx, fb),
          borderRadiusTopRightPx: normalizeLinkCornerRadiusPx(link.borderRadiusTopRightPx, fb),
          borderRadiusBottomRightPx: normalizeLinkCornerRadiusPx(link.borderRadiusBottomRightPx, fb),
          borderRadiusBottomLeftPx: normalizeLinkCornerRadiusPx(link.borderRadiusBottomLeftPx, fb),
          text: link.text?.trim(),
          url: link.url?.trim(),
          isAdultOnly: Boolean(link.isAdultOnly),
        };
      }) ?? [];

    for (const link of links) {
      if (!link.text || !link.url) {
        throw new BadRequestException('Cada link precisa de texto e url');
      }
    }

    const rawHandle = input.handle?.trim() ?? '';
    const handleNormalized = rawHandle.replace(/^@+/, '').trim() || null;

    const descriptionRaw = input.description?.trim() ?? '';
    const descriptionNormalized =
      descriptionRaw.length > 2000 ? descriptionRaw.slice(0, 2000) : descriptionRaw;
    const descriptionFinal = descriptionNormalized.length ? descriptionNormalized : null;

    const hubrl = await this.hubrlModel.create({
      hubrlId: generateHubrlPublicId(),
      ownerId: new Types.ObjectId(ownerId),
      title,
      handle: handleNormalized,
      description: descriptionFinal,
      profileImageUrl: input.profileImageUrl?.trim() || null,
      backgroundColor: input.backgroundColor?.trim() || null,
      backgroundImageUrl: input.backgroundImageUrl?.trim() || null,
      backgroundGradientCss: sanitizeBackgroundGradientCss(input.backgroundGradientCss),
      backgroundImageLayerOn: Boolean(input.backgroundImageLayerOn),
      backgroundImageLayerOpacity: normalizeLayerOpacity(input.backgroundImageLayerOpacity),
      backgroundSolidLayerOn: Boolean(input.backgroundSolidLayerOn),
      backgroundSolidLayerOpacity: normalizeLayerOpacity(input.backgroundSolidLayerOpacity),
      backgroundGradientLayerOn:
        input.backgroundGradientLayerOn === undefined ? true : Boolean(input.backgroundGradientLayerOn),
      backgroundGradientLayerOpacity: normalizeLayerOpacity(input.backgroundGradientLayerOpacity),
      cardBackgroundColor: input.cardBackgroundColor?.trim() || null,
      cardBackgroundImageUrl: input.cardBackgroundImageUrl?.trim() || null,
      cardBackgroundGradientCss: sanitizeBackgroundGradientCss(input.cardBackgroundGradientCss),
      cardBackgroundImageLayerOn: Boolean(input.cardBackgroundImageLayerOn),
      cardBackgroundImageLayerOpacity: normalizeLayerOpacity(input.cardBackgroundImageLayerOpacity),
      cardBackgroundSolidLayerOn: Boolean(input.cardBackgroundSolidLayerOn),
      cardBackgroundSolidLayerOpacity: normalizeLayerOpacity(input.cardBackgroundSolidLayerOpacity),
      cardBackgroundGradientLayerOn:
        input.cardBackgroundGradientLayerOn === undefined
          ? true
          : Boolean(input.cardBackgroundGradientLayerOn),
      cardBackgroundGradientLayerOpacity: normalizeLayerOpacity(input.cardBackgroundGradientLayerOpacity),
      links,
    });

    return this.toResponse(hubrl);
  }

  async listMine(ownerId: string) {
    const hubrls = await this.hubrlModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .sort({ createdAt: -1 });

    return hubrls.map((hubrl) => this.toResponse(hubrl));
  }

  async getByHubrlId(hubrlId: string) {
    const normalized = hubrlId?.trim();
    if (!normalized) {
      throw new BadRequestException('hubrlId e obrigatorio');
    }

    const hubrl =
      (await this.hubrlModel.findOne({ hubrlId: normalized })) ||
      (Types.ObjectId.isValid(normalized) ? await this.hubrlModel.findById(new Types.ObjectId(normalized)) : null);
    if (!hubrl) {
      throw new NotFoundException('Hubrl nao encontrado');
    }

    return this.toResponse(hubrl);
  }

  async updateByHubrlId(ownerId: string, hubrlId: string, input: CreateHubrlDto) {
    const normalizedHubrlId = hubrlId?.trim();
    if (!normalizedHubrlId) {
      throw new BadRequestException('hubrlId e obrigatorio');
    }

    const title = input?.title?.trim();
    if (!title) {
      throw new BadRequestException('Titulo do hubrl e obrigatorio');
    }

    const links =
      input.links?.map((link) => {
        const fb = legacyUniformRadiusFromLink(link);
        return {
          avatarImageUrl: link.avatarImageUrl?.trim() || null,
          backgroundColor: link.backgroundColor?.trim() || null,
          backgroundImageUrl: link.backgroundImageUrl?.trim() || null,
          backgroundGradientCss: sanitizeBackgroundGradientCss(link.backgroundGradientCss),
          backgroundImageLayerOn: Boolean(link.backgroundImageLayerOn),
          backgroundImageLayerOpacity: normalizeLayerOpacity(link.backgroundImageLayerOpacity),
          backgroundSolidLayerOn: Boolean(link.backgroundSolidLayerOn),
          backgroundSolidLayerOpacity: normalizeLayerOpacity(link.backgroundSolidLayerOpacity),
          backgroundGradientLayerOn:
            link.backgroundGradientLayerOn === undefined ? true : Boolean(link.backgroundGradientLayerOn),
          backgroundGradientLayerOpacity: normalizeLayerOpacity(link.backgroundGradientLayerOpacity),
          borderRadiusPx: null,
          borderRadiusTopLeftPx: normalizeLinkCornerRadiusPx(link.borderRadiusTopLeftPx, fb),
          borderRadiusTopRightPx: normalizeLinkCornerRadiusPx(link.borderRadiusTopRightPx, fb),
          borderRadiusBottomRightPx: normalizeLinkCornerRadiusPx(link.borderRadiusBottomRightPx, fb),
          borderRadiusBottomLeftPx: normalizeLinkCornerRadiusPx(link.borderRadiusBottomLeftPx, fb),
          text: link.text?.trim(),
          url: link.url?.trim(),
          isAdultOnly: Boolean(link.isAdultOnly),
        };
      }) ?? [];

    for (const link of links) {
      if (!link.text || !link.url) {
        throw new BadRequestException('Cada link precisa de texto e url');
      }
    }

    const rawHandle = input.handle?.trim() ?? '';
    const handleNormalized = rawHandle.replace(/^@+/, '').trim() || null;

    const descriptionRaw = input.description?.trim() ?? '';
    const descriptionNormalized =
      descriptionRaw.length > 2000 ? descriptionRaw.slice(0, 2000) : descriptionRaw;
    const descriptionFinal = descriptionNormalized.length ? descriptionNormalized : null;

    const query =
      Types.ObjectId.isValid(normalizedHubrlId)
        ? {
            ownerId: new Types.ObjectId(ownerId),
            $or: [{ hubrlId: normalizedHubrlId }, { _id: new Types.ObjectId(normalizedHubrlId) }],
          }
        : { ownerId: new Types.ObjectId(ownerId), hubrlId: normalizedHubrlId };

    const hubrl = await this.hubrlModel.findOneAndUpdate(
      query,
      {
        $set: {
          title,
          handle: handleNormalized,
          description: descriptionFinal,
          profileImageUrl: input.profileImageUrl?.trim() || null,
          backgroundColor: input.backgroundColor?.trim() || null,
          backgroundImageUrl: input.backgroundImageUrl?.trim() || null,
          backgroundGradientCss: sanitizeBackgroundGradientCss(input.backgroundGradientCss),
          backgroundImageLayerOn: Boolean(input.backgroundImageLayerOn),
          backgroundImageLayerOpacity: normalizeLayerOpacity(input.backgroundImageLayerOpacity),
          backgroundSolidLayerOn: Boolean(input.backgroundSolidLayerOn),
          backgroundSolidLayerOpacity: normalizeLayerOpacity(input.backgroundSolidLayerOpacity),
          backgroundGradientLayerOn:
            input.backgroundGradientLayerOn === undefined ? true : Boolean(input.backgroundGradientLayerOn),
          backgroundGradientLayerOpacity: normalizeLayerOpacity(input.backgroundGradientLayerOpacity),
          cardBackgroundColor: input.cardBackgroundColor?.trim() || null,
          cardBackgroundImageUrl: input.cardBackgroundImageUrl?.trim() || null,
          cardBackgroundGradientCss: sanitizeBackgroundGradientCss(input.cardBackgroundGradientCss),
          cardBackgroundImageLayerOn: Boolean(input.cardBackgroundImageLayerOn),
          cardBackgroundImageLayerOpacity: normalizeLayerOpacity(input.cardBackgroundImageLayerOpacity),
          cardBackgroundSolidLayerOn: Boolean(input.cardBackgroundSolidLayerOn),
          cardBackgroundSolidLayerOpacity: normalizeLayerOpacity(input.cardBackgroundSolidLayerOpacity),
          cardBackgroundGradientLayerOn:
            input.cardBackgroundGradientLayerOn === undefined
              ? true
              : Boolean(input.cardBackgroundGradientLayerOn),
          cardBackgroundGradientLayerOpacity: normalizeLayerOpacity(input.cardBackgroundGradientLayerOpacity),
          links,
        },
      },
      { new: true },
    );

    if (!hubrl) {
      throw new NotFoundException('Hubrl nao encontrado');
    }

    return this.toResponse(hubrl);
  }

  async uploadImageAsset(ownerId: string, file?: Express.Multer.File) {
    if (!file?.buffer) {
      throw new BadRequestException('Envie um arquivo de imagem');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Apenas arquivos de imagem sao permitidos');
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      throw new BadRequestException('Imagem deve ter no maximo 5MB');
    }

    const uploadResult = await this.cloudinaryService.uploadImage({
      fileBuffer: file.buffer,
      folder: 'hubrl/hubrl-images',
      publicId: `owner-${ownerId}-${Date.now()}`,
    });

    return { url: uploadResult.secure_url };
  }

  private toResponse(hubrl: HubrlDocument) {
    return {
      id: hubrl._id.toString(),
      hubrlId: hubrl.hubrlId?.trim() || hubrl._id.toString(),
      ownerId: hubrl.ownerId.toString(),
      title: hubrl.title,
      handle: hubrl.handle ?? null,
      description: hubrl.description ?? null,
      profileImageUrl: hubrl.profileImageUrl ?? null,
      backgroundColor: hubrl.backgroundColor ?? null,
      backgroundImageUrl: hubrl.backgroundImageUrl ?? null,
      backgroundGradientCss: hubrl.backgroundGradientCss ?? null,
      backgroundImageLayerOn:
        hubrl.backgroundImageLayerOn !== undefined && hubrl.backgroundImageLayerOn !== null
          ? Boolean(hubrl.backgroundImageLayerOn)
          : Boolean(hubrl.backgroundImageUrl),
      backgroundImageLayerOpacity: normalizeLayerOpacity(hubrl.backgroundImageLayerOpacity ?? 100),
      backgroundSolidLayerOn:
        hubrl.backgroundSolidLayerOn !== undefined && hubrl.backgroundSolidLayerOn !== null
          ? Boolean(hubrl.backgroundSolidLayerOn)
          : Boolean(hubrl.backgroundColor),
      backgroundSolidLayerOpacity: normalizeLayerOpacity(hubrl.backgroundSolidLayerOpacity ?? 100),
      backgroundGradientLayerOn:
        hubrl.backgroundGradientLayerOn !== undefined && hubrl.backgroundGradientLayerOn !== null
          ? Boolean(hubrl.backgroundGradientLayerOn)
          : Boolean(hubrl.backgroundGradientCss),
      backgroundGradientLayerOpacity: normalizeLayerOpacity(hubrl.backgroundGradientLayerOpacity ?? 100),
      cardBackgroundColor: hubrl.cardBackgroundColor ?? hubrl.backgroundColor ?? null,
      cardBackgroundImageUrl: hubrl.cardBackgroundImageUrl ?? hubrl.backgroundImageUrl ?? null,
      cardBackgroundGradientCss: hubrl.cardBackgroundGradientCss ?? hubrl.backgroundGradientCss ?? null,
      cardBackgroundImageLayerOn:
        hubrl.cardBackgroundImageLayerOn !== undefined && hubrl.cardBackgroundImageLayerOn !== null
          ? Boolean(hubrl.cardBackgroundImageLayerOn)
          : hubrl.backgroundImageLayerOn !== undefined && hubrl.backgroundImageLayerOn !== null
            ? Boolean(hubrl.backgroundImageLayerOn)
            : Boolean(hubrl.cardBackgroundImageUrl ?? hubrl.backgroundImageUrl),
      cardBackgroundImageLayerOpacity: normalizeLayerOpacity(
        hubrl.cardBackgroundImageLayerOpacity ?? hubrl.backgroundImageLayerOpacity ?? 100,
      ),
      cardBackgroundSolidLayerOn:
        hubrl.cardBackgroundSolidLayerOn !== undefined && hubrl.cardBackgroundSolidLayerOn !== null
          ? Boolean(hubrl.cardBackgroundSolidLayerOn)
          : hubrl.backgroundSolidLayerOn !== undefined && hubrl.backgroundSolidLayerOn !== null
            ? Boolean(hubrl.backgroundSolidLayerOn)
            : Boolean(hubrl.cardBackgroundColor ?? hubrl.backgroundColor),
      cardBackgroundSolidLayerOpacity: normalizeLayerOpacity(
        hubrl.cardBackgroundSolidLayerOpacity ?? hubrl.backgroundSolidLayerOpacity ?? 100,
      ),
      cardBackgroundGradientLayerOn:
        hubrl.cardBackgroundGradientLayerOn !== undefined && hubrl.cardBackgroundGradientLayerOn !== null
          ? Boolean(hubrl.cardBackgroundGradientLayerOn)
          : hubrl.backgroundGradientLayerOn !== undefined && hubrl.backgroundGradientLayerOn !== null
            ? Boolean(hubrl.backgroundGradientLayerOn)
            : Boolean(hubrl.cardBackgroundGradientCss ?? hubrl.backgroundGradientCss),
      cardBackgroundGradientLayerOpacity: normalizeLayerOpacity(
        hubrl.cardBackgroundGradientLayerOpacity ?? hubrl.backgroundGradientLayerOpacity ?? 100,
      ),
      links: hubrl.links.map((link) => {
        const fb = legacyUniformRadiusFromLink(link);
        return {
          avatarImageUrl: link.avatarImageUrl ?? null,
          backgroundColor: link.backgroundColor ?? null,
          backgroundImageUrl: link.backgroundImageUrl ?? null,
          backgroundGradientCss: link.backgroundGradientCss ?? null,
          backgroundImageLayerOn:
            link.backgroundImageLayerOn !== undefined && link.backgroundImageLayerOn !== null
              ? Boolean(link.backgroundImageLayerOn)
              : Boolean(link.backgroundImageUrl),
          backgroundImageLayerOpacity: normalizeLayerOpacity(link.backgroundImageLayerOpacity ?? 100),
          backgroundSolidLayerOn:
            link.backgroundSolidLayerOn !== undefined && link.backgroundSolidLayerOn !== null
              ? Boolean(link.backgroundSolidLayerOn)
              : Boolean(link.backgroundColor),
          backgroundSolidLayerOpacity: normalizeLayerOpacity(link.backgroundSolidLayerOpacity ?? 100),
          backgroundGradientLayerOn:
            link.backgroundGradientLayerOn !== undefined && link.backgroundGradientLayerOn !== null
              ? Boolean(link.backgroundGradientLayerOn)
              : Boolean(link.backgroundGradientCss),
          backgroundGradientLayerOpacity: normalizeLayerOpacity(link.backgroundGradientLayerOpacity ?? 100),
          borderRadiusTopLeftPx: normalizeLinkCornerRadiusPx(link.borderRadiusTopLeftPx, fb),
          borderRadiusTopRightPx: normalizeLinkCornerRadiusPx(link.borderRadiusTopRightPx, fb),
          borderRadiusBottomRightPx: normalizeLinkCornerRadiusPx(link.borderRadiusBottomRightPx, fb),
          borderRadiusBottomLeftPx: normalizeLinkCornerRadiusPx(link.borderRadiusBottomLeftPx, fb),
          text: link.text,
          url: link.url,
          isAdultOnly: link.isAdultOnly,
        };
      }),
    };
  }
}
