import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type HubrlDocument = HydratedDocument<Hubrl>;

@Schema({ _id: false })
export class HubrlLink {
  @Prop({ type: String, default: null })
  avatarImageUrl?: string | null;

  @Prop({ type: String, default: null })
  backgroundColor?: string | null;

  @Prop({ type: String, default: null })
  backgroundImageUrl?: string | null;

  @Prop({ type: String, default: null })
  backgroundGradientCss?: string | null;

  @Prop({ type: Boolean, default: false })
  backgroundImageLayerOn?: boolean;

  @Prop({ type: Number, default: 100 })
  backgroundImageLayerOpacity?: number;

  @Prop({ type: Boolean, default: false })
  backgroundSolidLayerOn?: boolean;

  @Prop({ type: Number, default: 100 })
  backgroundSolidLayerOpacity?: number;

  @Prop({ type: Boolean, default: true })
  backgroundGradientLayerOn?: boolean;

  @Prop({ type: Number, default: 100 })
  backgroundGradientLayerOpacity?: number;

  /** Legado: raio unico; ignorado se os quatro cantos estiverem definidos. */
  @Prop({ type: Number, default: null })
  borderRadiusPx?: number | null;

  @Prop({ type: Number, default: null })
  borderRadiusTopLeftPx?: number | null;

  @Prop({ type: Number, default: null })
  borderRadiusTopRightPx?: number | null;

  @Prop({ type: Number, default: null })
  borderRadiusBottomRightPx?: number | null;

  @Prop({ type: Number, default: null })
  borderRadiusBottomLeftPx?: number | null;

  @Prop({ required: true, trim: true })
  text: string;

  @Prop({ required: true, trim: true })
  url: string;

  @Prop({ required: true, default: false })
  isAdultOnly: boolean;

  /** Identificador estável para métricas de clique (UUID). */
  @Prop({ type: String, default: null, trim: true })
  linkId?: string | null;

  @Prop({ type: Number, default: 0 })
  clickCount?: number;
}

const HubrlLinkSchema = SchemaFactory.createForClass(HubrlLink);

@Schema({ timestamps: true })
export class Hubrl {
  /** ID publico estavel para uso externo (nao depende do _id do Mongo). */
  @Prop({ type: String, required: true, unique: true, index: true, trim: true })
  hubrlId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  /** Identificador publico exibido com @ (armazenado sem @). */
  @Prop({ type: String, default: null, trim: true })
  handle?: string | null;

  @Prop({ type: String, default: null, trim: true })
  description?: string | null;

  @Prop({ type: String, default: null })
  profileImageUrl?: string | null;

  @Prop({ type: String, default: null })
  backgroundColor?: string | null;

  @Prop({ type: String, default: null })
  backgroundImageUrl?: string | null;

  /** CSS completo para `background-image` (ex.: linear-gradient(...)). */
  @Prop({ type: String, default: null })
  backgroundGradientCss?: string | null;

  @Prop({ type: Boolean, default: false })
  backgroundImageLayerOn?: boolean;

  @Prop({ type: Number, default: 100 })
  backgroundImageLayerOpacity?: number;

  @Prop({ type: Boolean, default: false })
  backgroundSolidLayerOn?: boolean;

  @Prop({ type: Number, default: 100 })
  backgroundSolidLayerOpacity?: number;

  @Prop({ type: Boolean, default: true })
  backgroundGradientLayerOn?: boolean;

  @Prop({ type: Number, default: 100 })
  backgroundGradientLayerOpacity?: number;

  @Prop({ type: String, default: null })
  cardBackgroundColor?: string | null;

  @Prop({ type: String, default: null })
  cardBackgroundImageUrl?: string | null;

  /** CSS completo para `background-image` do card (ex.: linear-gradient(...)). */
  @Prop({ type: String, default: null })
  cardBackgroundGradientCss?: string | null;

  @Prop({ type: Boolean, default: false })
  cardBackgroundImageLayerOn?: boolean;

  @Prop({ type: Number, default: 100 })
  cardBackgroundImageLayerOpacity?: number;

  @Prop({ type: Boolean, default: false })
  cardBackgroundSolidLayerOn?: boolean;

  @Prop({ type: Number, default: 100 })
  cardBackgroundSolidLayerOpacity?: number;

  @Prop({ type: Boolean, default: true })
  cardBackgroundGradientLayerOn?: boolean;

  @Prop({ type: Number, default: 100 })
  cardBackgroundGradientLayerOpacity?: number;

  @Prop({ type: [HubrlLinkSchema], default: [] })
  links: HubrlLink[];

  @Prop({ type: Number, default: 0 })
  viewCount?: number;

  /**
   * Contagem de visualizações por código ISO do país (ex.: BR, PT).
   * Atualizado de forma best-effort a partir do IP ou cabeçalhos da edge.
   */
  @Prop({ type: Object, default: {} })
  viewsByCountry?: Record<string, number>;
}

export const HubrlSchema = SchemaFactory.createForClass(Hubrl);
