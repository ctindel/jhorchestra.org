/** Secondary mark: three colored tiles spelling J·H·O. Favicon, avatar, lapel pin, social thumbnail. */
export interface MonogramProps {
  color?: 'subway' | 'tandoor' | 'cilantro' | 'saffron' | 'jacaranda' | 'hibiscus' | 'roosevelt';
  /** tile edge in px */
  size?: number;
  /** show the word beside each tile */
  showWords?: boolean;
  /** ground the mark sits on, for the word color */
  tone?: 'light' | 'dark';
  style?: React.CSSProperties;
}
export declare function Monogram(props: MonogramProps): JSX.Element;
