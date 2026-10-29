/** Flat container. Never carries a shadow — separation comes from ground change or a hairline. */
export interface CardProps {
  /** newsprint content card | reversed ink feature | tandoor accent | white bordered list row */
  tone?: 'newsprint' | 'ink' | 'accent' | 'raised';
  radius?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: number | string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
