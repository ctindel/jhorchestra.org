/** Secondary mark: a layered waveform over a lightweight wordmark. Programs, letterhead, editorial layouts. */
export interface WaveformMarkProps {
  /** waveform height in px */
  height?: number;
  showWord?: boolean;
  /** flatten every bar to a single colour (e.g. on an accent ground) */
  color?: string;
  style?: React.CSSProperties;
}
export declare function WaveformMark(props: WaveformMarkProps): JSX.Element;
