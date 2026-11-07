import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Journey } from './Journey';

let reducedMotion = false;
vi.mock('framer-motion', () => ({ useInView: () => true, useReducedMotion: () => reducedMotion }));
let tick: FrameRequestCallback;
const originalLength = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getTotalLength');
const originalPoint = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getPointAtLength');
beforeEach(() => {
  reducedMotion = false;
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { tick = callback; return 1; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const year = Number(this.parentElement?.querySelector('time')?.dateTime ?? 2019);
    const left = this.classList.contains('about-milestone-node') ? (year - 2019) * 100 : 0;
    return { x: left, y: 0, left, top: 0, right: left + 7, bottom: 7, width: 7, height: 7, toJSON: () => ({}) };
  });
  Object.defineProperty(SVGElement.prototype, 'getTotalLength', { configurable: true, value: () => 500 });
  Object.defineProperty(SVGElement.prototype, 'getPointAtLength', { configurable: true, value: (distance: number) => ({ x: distance, y: 0 }) });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const [name, descriptor] of [['getTotalLength', originalLength], ['getPointAtLength', originalPoint]] as const) {
    if (descriptor) Object.defineProperty(SVGElement.prototype, name, descriptor);
    else Reflect.deleteProperty(SVGElement.prototype, name);
  }
});

it('moves one node and highlights each arrival for one second during a 26-second journey', () => {
  const { container } = render(<Journey />);
  expect(container.querySelectorAll('.about-timeline-traveler')).toHaveLength(1);
  const second = screen.getByText('2020').closest('li')!;
  act(() => tick(0));
  act(() => tick(5100));
  expect(second).toHaveAttribute('data-active', 'false');
  act(() => tick(5200));
  expect(second).toHaveAttribute('data-active', 'true');
  expect(second.style.getPropertyValue('--milestone-glow')).toBe('1');
  act(() => tick(5700));
  expect(second.style.getPropertyValue('--milestone-glow')).toBe('0.5');
  act(() => tick(6201));
  expect(second).toHaveAttribute('data-active', 'false');
  act(() => tick(26000));
  expect(screen.getByText('2024').closest('li')).toHaveAttribute('data-active', 'true');
  act(() => tick(27001));
  expect(screen.getByText('2024').closest('li')).toHaveAttribute('data-active', 'false');
});

it('keeps all milestones readable without animation when reduced motion is requested', () => {
  reducedMotion = true;
  const { container } = render(<Journey />);
  expect(screen.getByText('2024')).toBeInTheDocument();
  expect(container.querySelector('.about-timeline-traveler')).toBeNull();
  expect(requestAnimationFrame).not.toHaveBeenCalled();
});
