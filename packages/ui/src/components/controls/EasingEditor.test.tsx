import {EASING_PRESETS, Easing} from '@motion-canvas/core';
import {h} from 'preact';
import {render} from 'preact';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {EasingEditor} from './EasingEditor';

function createContainer() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

describe('EasingEditor', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = createContainer();
  });

  afterEach(() => {
    container.remove();
  });

  test('Renders all 8 preset buttons', () => {
    const onChange = vi.fn();
    const value = new Easing();
    render(<EasingEditor value={value} onChange={onChange} />, container);

    expect(EASING_PRESETS.length).toBe(8);
    for (const preset of EASING_PRESETS) {
      const button = Array.from(
        container.querySelectorAll('button'),
      ).find(btn => btn.textContent?.includes(preset.displayName));
      expect(button).toBeDefined();
    }
  });

  test('Preset selection triggers onChange with correct easing', () => {
    const onChange = vi.fn();
    const value = new Easing('linear');
    render(<EasingEditor value={value} onChange={onChange} />, container);

    const button = Array.from(container.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('Ease In Out Cubic'),
    );
    expect(button).toBeDefined();

    button?.dispatchEvent(new MouseEvent('click', {bubbles: true}));

    expect(onChange).toBeCalledTimes(1);
    const newEasing: Easing = onChange.mock.calls[0][0];
    expect(newEasing).toBeInstanceOf(Easing);
    expect(newEasing.presetName).toBe('easeInOutCubic');
  });

  test('Active preset button is highlighted', () => {
    const onChange = vi.fn();
    const value = new Easing('linear');
    render(<EasingEditor value={value} onChange={onChange} />, container);

    const buttons = Array.from(container.querySelectorAll('button'));
    const activeButtons = buttons.filter(btn =>
      btn.className.includes('active'),
    );
    expect(activeButtons.length).toBeGreaterThanOrEqual(1);

    const linearButton = buttons.find(btn =>
      btn.textContent?.includes('Linear'),
    );
    expect(linearButton?.className).toContain('active');
  });

  test('Renders SVG curve editor with handle points', () => {
    const onChange = vi.fn();
    const value = new Easing('easeInOutCubic');
    render(<EasingEditor value={value} onChange={onChange} />, container);

    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();

    const path = container.querySelector('[class*="easingCurvePath"]');
    expect(path).toBeDefined();
    expect(path?.getAttribute('d')).toBeDefined();

    const handles = container.querySelectorAll('[class*="easingHandlePoint"]');
    expect(handles.length).toBe(2);

    const endpoints = container.querySelectorAll('[class*="easingEndpoint"]');
    expect(endpoints.length).toBe(2);

    const handleLines = container.querySelectorAll('[class*="easingHandleLine"]');
    expect(handleLines.length).toBe(2);
  });

  test('Renders grid lines and axis lines', () => {
    const onChange = vi.fn();
    const value = new Easing();
    render(<EasingEditor value={value} onChange={onChange} />, container);

    const gridLines = container.querySelectorAll('[class*="easingGridLine"]');
    expect(gridLines.length).toBe(6);

    const axisLines = container.querySelectorAll('[class*="easingAxisLine"]');
    expect(axisLines.length).toBe(2);
  });

  test('Curve path changes when different preset is rendered', () => {
    const onChange = vi.fn();
    const linearValue = new Easing('linear');
    render(
      <EasingEditor value={linearValue} onChange={onChange} />,
      container,
    );

    const linearPath = container
      .querySelector('[class*="easingCurvePath"]')
      ?.getAttribute('d');

    container.remove();
    container = createContainer();

    const cubicValue = new Easing('easeInOutCubic');
    render(
      <EasingEditor value={cubicValue} onChange={onChange} />,
      container,
    );

    const cubicPath = container
      .querySelector('[class*="easingCurvePath"]')
      ?.getAttribute('d');

    expect(linearPath).not.toBe(cubicPath);
  });

  test('Renders preview section with ball animation', () => {
    const onChange = vi.fn();
    const value = new Easing('easeInOutCubic');
    render(<EasingEditor value={value} onChange={onChange} />, container);

    const preview = container.querySelector('[class*="easingPreview"]');
    expect(preview).toBeDefined();

    const previewLabel = container.querySelector(
      '[class*="easingPreviewLabel"]',
    );
    expect(previewLabel?.textContent).toContain('PREVIEW');

    const track = container.querySelector('[class*="easingPreviewTrack"]');
    expect(track).toBeDefined();

    const ball = container.querySelector('[class*="easingPreviewBall"]');
    expect(ball).toBeDefined();
    expect((ball as HTMLElement)?.style.left).toBeDefined();
  });

  test('Renders coordinate displays', () => {
    const onChange = vi.fn();
    const value = new Easing('easeInOutCubic');
    render(<EasingEditor value={value} onChange={onChange} />, container);

    const coords = container.querySelectorAll('[class*="easingCoord"]');
    expect(coords.length).toBe(2);

    const coordTexts = Array.from(coords).map(c => c.textContent);
    const hasP1 = coordTexts.some(t => t?.includes('P1'));
    const hasP2 = coordTexts.some(t => t?.includes('P2'));
    expect(hasP1).toBe(true);
    expect(hasP2).toBe(true);
  });

  test('Renders number input fields for bezier points', () => {
    const onChange = vi.fn();
    const value = new Easing();
    render(<EasingEditor value={value} onChange={onChange} />, container);

    const fields = container.querySelectorAll('[class*="easingFieldInput"]');
    expect(fields.length).toBe(4);
  });

  test('Swatch SVG is rendered for each preset button', () => {
    const onChange = vi.fn();
    const value = new Easing();
    render(<EasingEditor value={value} onChange={onChange} />, container);

    const swatches = container.querySelectorAll(
      '[class*="easingPresetSwatch"]',
    );
    expect(swatches.length).toBe(EASING_PRESETS.length);

    for (const swatch of swatches) {
      const svg = swatch.querySelector('svg');
      expect(svg).toBeDefined();
      const path = svg?.querySelector('path');
      expect(path?.getAttribute('d')).toBeDefined();
    }
  });

  test('Handle has data attributes for drag testing', () => {
    const onChange = vi.fn();
    const value = new Easing();
    render(<EasingEditor value={value} onChange={onChange} />, container);

    const p1Handle = container.querySelector('[data-handle="p1"]');
    const p2Handle = container.querySelector('[data-handle="p2"]');
    expect(p1Handle).toBeDefined();
    expect(p2Handle).toBeDefined();
  });
});
