/** Soloist / conductor portrait with name and role. Square on posters and IG, round in stories. */
export interface PortraitProps {
  src?: string;
  name?: string;
  /** all-caps role line, e.g. "Guest Conductor" */
  role?: string;
  /** px edge */
  size?: number;
  shape?: 'square' | 'round';
  /** name beside the image (soloist credits), or centred beneath it (poster masthead) */
  layout?: 'inline' | 'stacked';
  /** override the auto-scaled name size in px */
  nameSize?: number;
  /** override the all-caps role line size in px */
  roleSize?: number;
  tone?: 'light' | 'dark';
  style?: React.CSSProperties;
}
export declare function Portrait(props: PortraitProps): JSX.Element;
