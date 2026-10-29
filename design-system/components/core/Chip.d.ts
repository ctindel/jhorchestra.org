/**
 * Small label. Two shapes: a tinted rectangle for archive media links, and a
 * pill outline for work titles on dark grounds.
 * @startingPoint section="Core" subtitle="Media chips and work-title pills" viewport="700x140"
 */
export interface ChipProps {
  /** palette hue name driving the 10% tint and text colour */
  tone?: 'tandoor' | 'saffron' | 'cilantro' | 'subway' | 'jacaranda' | 'hibiscus' | 'roosevelt';
  /** house unicode glyph — ▦ poster, ⛁ program, ▶ video, ♪ audio, ◉ photos, ✎ notes */
  glyph?: string;
  /** italic serif pill on a dark ground, for work titles */
  outline?: boolean;
  /** plain italic "no recording" placeholder */
  muted?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Chip(props: ChipProps): JSX.Element;
