/** Playfair Display headline at the six system sizes. End the text with a period — house style. */
export interface HeadlineProps {
  level?: 'hero' | 'display' | 'h1' | 'h2' | 'h3' | 'h4';
  /** override the rendered tag */
  as?: keyof JSX.IntrinsicElements;
  /** set the whole headline in Playfair italic 500 */
  italic?: boolean;
  color?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Headline(props: HeadlineProps): JSX.Element;
