import {Easing} from '@motion-canvas/core';
import {EasingEditor} from '../controls';
import {Expandable} from './Expandable';
import {Field, FieldSet} from './Layout';

export interface EasingFieldProps {
  value: Easing;
}

export function EasingField({value}: EasingFieldProps) {
  const presetLabel = value.presetName
    ? value.presetName.charAt(0).toUpperCase() + value.presetName.slice(1)
    : 'Custom';

  return (
    <FieldSet
      header={
        <Field copy={JSON.stringify(value.serialize())}>
          <Expandable>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '4px 0',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: 11,
                  color: 'rgba(255, 255, 255, 0.7)',
                  flexShrink: 0,
                }}
              >
                {presetLabel}
              </span>
              <div
                style={{
                  flexGrow: 1,
                  height: 16,
                  minWidth: 40,
                  position: 'relative',
                  backgroundColor: 'var(--background-color-dark)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                  }}
                >
                  {(() => {
                    const [x1, y1, x2, y2] = value.points;
                    const p0x = 0;
                    const p0y = 100;
                    const p3x = 100;
                    const p3y = 0;
                    const c1x = x1 * 100;
                    const c1y = 100 - y1 * 100;
                    const c2x = x2 * 100;
                    const c2y = 100 - y2 * 100;
                    const d = `M ${p0x} ${p0y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p3x} ${p3y}`;
                    return (
                      <path
                        d={d}
                        fill="none"
                        stroke="var(--theme)"
                        strokeWidth="4"
                      />
                    );
                  })()}
                </svg>
              </div>
            </div>
          </Expandable>
        </Field>
      }
    >
      <div style={{padding: '8px 0'}}>
        <EasingEditor
          value={value}
          onChange={() => {}}
        />
      </div>
    </FieldSet>
  );
}
