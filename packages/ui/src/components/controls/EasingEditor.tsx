import {BezierPoints, EASING_PRESETS, Easing} from '@motion-canvas/core';
import clsx from 'clsx';
import {h, JSX} from 'preact';
import {useEffect, useMemo, useRef, useState} from 'preact/hooks';
import {useSize} from '../../hooks';
import {MouseButton, clamp} from '../../utils';
import styles from './Controls.module.scss';
import {NumberInput} from './NumberInput';

export interface EasingEditorProps {
  value: Easing;
  onChange: (value: Easing) => void;
  className?: string;
}

const PADDING = 16;
const HANDLE_RADIUS = 7;
const ENDPOINT_RADIUS = 5;

function buildCurvePath(points: BezierPoints, width: number, height: number) {
  const [x1, y1, x2, y2] = points;
  const p0x = PADDING;
  const p0y = height - PADDING;
  const p3x = width - PADDING;
  const p3y = PADDING;
  const c1x = PADDING + x1 * (width - 2 * PADDING);
  const c1y = height - PADDING - y1 * (height - 2 * PADDING);
  const c2x = PADDING + x2 * (width - 2 * PADDING);
  const c2y = height - PADDING - y2 * (height - 2 * PADDING);
  return {
    d: `M ${p0x} ${p0y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p3x} ${p3y}`,
    p0: {x: p0x, y: p0y},
    p1: {x: c1x, y: c1y},
    p2: {x: c2x, y: c2y},
    p3: {x: p3x, y: p3y},
  };
}

function buildPreviewSwatchPath(points: BezierPoints) {
  const [x1, y1, x2, y2] = points;
  return `M 0 20 C ${x1 * 20} ${20 - y1 * 20}, ${x2 * 20} ${20 - y2 * 20}, 20 0`;
}

function EasingSwatch({points}: {points: BezierPoints}) {
  const d = buildPreviewSwatchPath(points);
  return (
    <svg viewBox="0 0 20 20" preserveAspectRatio="none">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </svg>
  );
}

export function EasingEditor({value, onChange, className}: EasingEditorProps) {
  const containerRef = useRef<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>();
  const rect = useSize(containerRef);
  const [dragging, setDragging] = useState<0 | 1 | null>(null);
  const [previewTime, setPreviewTime] = useState(0);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const PREVIEW_DURATION = 1500;

  const points = useMemo<BezierPoints>(
    () => [...value.points] as BezierPoints,
    [value],
  );

  const width = Math.max(rect.width, 100);
  const height = 200;

  const {d, p0, p1, p2, p3} = useMemo(
    () => buildCurvePath(points, width, height),
    [points, width, height],
  );

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const t = (elapsed % PREVIEW_DURATION) / PREVIEW_DURATION;
      setPreviewTime(t);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const easing = useMemo(() => value.toTimingFunction(), [value]);
  const ballPosition = easing(previewTime);

  const screenToPoints = (clientX: number, clientY: number) => {
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return null;
    const x = clientX - svgRect.left;
    const y = clientY - svgRect.top;
    const px = clamp(0, 1, (x - PADDING) / (width - 2 * PADDING));
    const py = clamp(-0.5, 1.5, 1 - (y - PADDING) / (height - 2 * PADDING));
    return {x: px, y: py};
  };

  const handlePointerDown = (
    event: JSX.TargetedPointerEvent<SVGCircleElement>,
    index: 0 | 1,
  ) => {
    if (event.button === MouseButton.Left) {
      event.preventDefault();
      event.stopPropagation();
      (event.currentTarget as Element).setPointerCapture(event.pointerId);
      setDragging(index);
    }
  };

  const handlePointerMove = (event: JSX.TargetedPointerEvent<SVGSVGElement>) => {
    if (dragging === null) return;
    const pos = screenToPoints(event.clientX, event.clientY);
    if (!pos) return;
    const newPoints: BezierPoints = [...points] as BezierPoints;
    if (dragging === 0) {
      newPoints[0] = pos.x;
      newPoints[1] = pos.y;
    } else {
      newPoints[2] = pos.x;
      newPoints[3] = pos.y;
    }
    onChange(new Easing(newPoints));
  };

  const handlePointerUp = (event: JSX.TargetedPointerEvent<SVGSVGElement>) => {
    if (dragging !== null) {
      (event.currentTarget as Element).releasePointerCapture(event.pointerId);
      setDragging(null);
    }
  };

  const handlePointChange = (index: number, val: number) => {
    const newPoints: BezierPoints = [...points] as BezierPoints;
    newPoints[index] = val;
    onChange(new Easing(newPoints));
  };

  return (
    <div className={clsx(styles.easingEditor, className)}>
      <div className={styles.easingEditorMain}>
        <div className={styles.easingPresets}>
          {EASING_PRESETS.map(preset => (
            <button
              key={preset.name}
              className={clsx(
                styles.easingPresetButton,
                value.presetName === preset.name && styles.active,
              )}
              onClick={() => onChange(new Easing(preset))}
              title={preset.displayName}
            >
              <span className={styles.easingPresetSwatch} style={{color: value.presetName === preset.name ? 'rgba(0,0,0,0.87)' : 'var(--theme)'}}>
                <EasingSwatch points={preset.points} />
              </span>
              <span>{preset.displayName}</span>
            </button>
          ))}
        </div>

        <div className={styles.easingEditorRight}>
          <div
            ref={containerRef}
            className={styles.easingCurveEditor}
            style={{height}}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {[0.25, 0.5, 0.75].map(t => {
                const gx = PADDING + t * (width - 2 * PADDING);
                const gy = PADDING + t * (height - 2 * PADDING);
                return (
                  <g key={t}>
                    <line
                      x1={gx}
                      y1={PADDING}
                      x2={gx}
                      y2={height - PADDING}
                      className={styles.easingGridLine}
                    />
                    <line
                      x1={PADDING}
                      y1={gy}
                      x2={width - PADDING}
                      y2={gy}
                      className={styles.easingGridLine}
                    />
                  </g>
                );
              })}
              <line
                x1={PADDING}
                y1={height - PADDING}
                x2={width - PADDING}
                y2={height - PADDING}
                className={styles.easingAxisLine}
              />
              <line
                x1={PADDING}
                y1={PADDING}
                x2={PADDING}
                y2={height - PADDING}
                className={styles.easingAxisLine}
              />

              <line
                x1={p0.x}
                y1={p0.y}
                x2={p1.x}
                y2={p1.y}
                className={styles.easingHandleLine}
              />
              <line
                x1={p3.x}
                y1={p3.y}
                x2={p2.x}
                y2={p2.y}
                className={styles.easingHandleLine}
              />

              <path d={d} className={styles.easingCurvePath} />

              <circle
                cx={p0.x}
                cy={p0.y}
                r={ENDPOINT_RADIUS}
                className={styles.easingEndpoint}
              />
              <circle
                cx={p3.x}
                cy={p3.y}
                r={ENDPOINT_RADIUS}
                className={styles.easingEndpoint}
              />

              <circle
                cx={p1.x}
                cy={p1.y}
                r={HANDLE_RADIUS}
                className={clsx(styles.easingHandlePoint, styles.p1)}
                onPointerDown={e => handlePointerDown(e, 0)}
                data-handle="p1"
              />
              <circle
                cx={p2.x}
                cy={p2.y}
                r={HANDLE_RADIUS}
                className={clsx(styles.easingHandlePoint, styles.p2)}
                onPointerDown={e => handlePointerDown(e, 1)}
                data-handle="p2"
              />

              {(() => {
                const t = previewTime;
                const y = easing(t);
                const px = PADDING + t * (width - 2 * PADDING);
                const py = height - PADDING - y * (height - 2 * PADDING);
                return (
                  <circle
                    cx={px}
                    cy={py}
                    r={5}
                    fill="white"
                    opacity={0.9}
                    style={{pointerEvents: 'none'}}
                  />
                );
              })()}
            </svg>
          </div>

          <div className={styles.easingCoords}>
            <span className={styles.easingCoord}>P1: ({points[0].toFixed(2)}, {points[1].toFixed(2)})</span>
            <span className={styles.easingCoord}>P2: ({points[2].toFixed(2)}, {points[3].toFixed(2)})</span>
          </div>

          <div className={styles.easingFields}>
            <div className={styles.easingFieldInput}>
              <NumberInput
                value={points[0]}
                onChange={v => handlePointChange(0, v)}
                min={0}
                max={1}
                step={0.01}
                decimalPlaces={3}
                label="X1"
              />
            </div>
            <div className={styles.easingFieldInput}>
              <NumberInput
                value={points[1]}
                onChange={v => handlePointChange(1, v)}
                min={-0.5}
                max={1.5}
                step={0.01}
                decimalPlaces={3}
                label="Y1"
              />
            </div>
            <div className={styles.easingFieldInput}>
              <NumberInput
                value={points[2]}
                onChange={v => handlePointChange(2, v)}
                min={0}
                max={1}
                step={0.01}
                decimalPlaces={3}
                label="X2"
              />
            </div>
            <div className={styles.easingFieldInput}>
              <NumberInput
                value={points[3]}
                onChange={v => handlePointChange(3, v)}
                min={-0.5}
                max={1.5}
                step={0.01}
                decimalPlaces={3}
                label="Y2"
              />
            </div>
          </div>

          <div className={styles.easingPreview}>
            <span className={styles.easingPreviewLabel}>PREVIEW</span>
            <div className={styles.easingPreviewTrack}>
              <div
                className={styles.easingPreviewBall}
                style={{
                  left: `calc(${ballPosition * 100}% - 10px)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
