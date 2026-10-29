/**
 * One past concert in the archive list: date block, title/venue/works, media chips.
 * @startingPoint section="Content" subtitle="Concert archive row with media chips" viewport="700x160"
 */
export interface ConcertMedia {
  label: string;
  glyph?: string;
  tone?: 'tandoor' | 'saffron' | 'cilantro' | 'subway' | 'jacaranda' | 'hibiscus' | 'roosevelt';
  muted?: boolean;
}
export interface ConcertRowProps {
  /** two-digit day, e.g. "18" */
  day?: string;
  /** three-letter month, e.g. "Mar" */
  month?: string;
  year?: string;
  title?: string;
  /** "Wed · 7:30 PM · Venue, Neighborhood" */
  venue?: string;
  /** works separated by " · " */
  works?: string;
  /** archive links; empty array renders the honest "no archive yet" placeholder */
  media?: ConcertMedia[];
  style?: React.CSSProperties;
}
export declare function ConcertRow(props: ConcertRowProps): JSX.Element;
