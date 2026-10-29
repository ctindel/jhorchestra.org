/** The brand's entire icon inventory: four solid-fill social glyphs at 24px. Do not substitute a CDN icon set. */
export interface SocialIconsProps {
  networks?: Array<'youtube' | 'facebook' | 'instagram' | 'x'>;
  /** glyph size inside the 24px hit area */
  size?: number;
  /** ground the icons sit on */
  tone?: 'light' | 'dark';
  gap?: number;
  style?: React.CSSProperties;
}
export declare function SocialIcons(props: SocialIconsProps): JSX.Element;
