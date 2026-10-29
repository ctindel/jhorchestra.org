/** All-caps Inter label that sits above nearly every JHO headline. */
export interface EyebrowProps {
  tone?: 'tandoor' | 'saffron' | 'subway' | 'muted' | 'ink' | 'paper';
  size?: 'sm' | 'md' | 'lg';
  as?: keyof JSX.IntrinsicElements;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Eyebrow(props: EyebrowProps): JSX.Element;
