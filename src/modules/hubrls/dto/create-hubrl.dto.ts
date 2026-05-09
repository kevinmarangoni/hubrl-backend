export class CreateHubrlLinkDto {
  avatarImageUrl?: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundGradientCss?: string;
  backgroundImageLayerOn?: boolean;
  backgroundImageLayerOpacity?: number;
  backgroundSolidLayerOn?: boolean;
  backgroundSolidLayerOpacity?: number;
  backgroundGradientLayerOn?: boolean;
  backgroundGradientLayerOpacity?: number;
  borderRadiusTopLeftPx?: number;
  borderRadiusTopRightPx?: number;
  borderRadiusBottomRightPx?: number;
  borderRadiusBottomLeftPx?: number;
  /** Legado: raio unico se os quatro cantos forem omitidos. */
  borderRadiusPx?: number;
  text: string;
  url: string;
  isAdultOnly?: boolean;
}

export class CreateHubrlDto {
  title: string;
  /** Texto do @nome (com ou sem @ na entrada; normalizado no servico). */
  handle?: string;
  description?: string;
  profileImageUrl?: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundGradientCss?: string;
  backgroundImageLayerOn?: boolean;
  backgroundImageLayerOpacity?: number;
  backgroundSolidLayerOn?: boolean;
  backgroundSolidLayerOpacity?: number;
  backgroundGradientLayerOn?: boolean;
  backgroundGradientLayerOpacity?: number;
  cardBackgroundColor?: string;
  cardBackgroundImageUrl?: string;
  cardBackgroundGradientCss?: string;
  cardBackgroundImageLayerOn?: boolean;
  cardBackgroundImageLayerOpacity?: number;
  cardBackgroundSolidLayerOn?: boolean;
  cardBackgroundSolidLayerOpacity?: number;
  cardBackgroundGradientLayerOn?: boolean;
  cardBackgroundGradientLayerOpacity?: number;
  links?: CreateHubrlLinkDto[];
}
