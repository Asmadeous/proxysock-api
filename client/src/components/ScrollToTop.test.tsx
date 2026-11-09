import { lazy, Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ScrollToTop from './ScrollToTop';

function Navigation() {
  const navigate = useNavigate();
  return <nav>
    <Link to="/second">Next page</Link>
    <Link to="/first?filter=active">Filter</Link>
    <Link to="/first#details">Details</Link>
    <button onClick={() => navigate(-1)}>Back</button>
  </nav>;
}

function Shell({ children }: { children?: React.ReactNode }) {
  return <MemoryRouter initialEntries={['/first']}>
    <Navigation />
    <main data-page-scroll data-testid="page-scroll">
      <Suspense fallback={<p>Loading page</p>}>
        <ScrollToTop />
        {children}
      </Suspense>
    </main>
    <aside data-testid="sidebar">Sidebar</aside>
  </MemoryRouter>;
}

let windowScroll: ReturnType<typeof vi.fn>;
const originalElementScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');
beforeEach(() => {
  window.history.scrollRestoration = 'auto';
  windowScroll = vi.fn();
  vi.stubGlobal('scrollTo', windowScroll);
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: function (this: HTMLElement, options: ScrollToOptions) {
      this.scrollTop = options.top ?? this.scrollTop;
      this.scrollLeft = options.left ?? this.scrollLeft;
    },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalElementScroll) {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalElementScroll);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
  }
});

describe('Page navigation scroll', () => {
  it('resets the window and page container while preserving sidebar position', () => {
    render(<Shell />);
    const page = screen.getByTestId('page-scroll');
    const sidebar = screen.getByTestId('sidebar');
    page.scrollTop = 600;
    page.scrollLeft = 40;
    sidebar.scrollTop = 150;
    windowScroll.mockClear();
    fireEvent.click(screen.getByText('Next page'));
    expect(windowScroll).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
    expect(page.scrollTop).toBe(0);
    expect(page.scrollLeft).toBe(0);
    expect(sidebar.scrollTop).toBe(150);
  });

  it('keeps the position when only filters or an in-page anchor change', () => {
    render(<Shell />);
    const page = screen.getByTestId('page-scroll');
    page.scrollTop = 450;
    windowScroll.mockClear();
    fireEvent.click(screen.getByText('Filter'));
    fireEvent.click(screen.getByText('Details'));
    expect(page.scrollTop).toBe(450);
    expect(windowScroll).not.toHaveBeenCalled();
  });

  it('resets body scrolling even when the browser window is already at the top', () => {
    render(<Shell />);
    // index.html uses h-full on html/body; overflow-x: hidden in index.css
    // makes the body scroll independently of the viewport.
    document.body.scrollTop = 1400;
    document.body.scrollLeft = 20;
    expect(window.scrollY).toBe(0);
    fireEvent.click(screen.getByText('Next page'));
    expect(document.body.scrollTop).toBe(0);
    expect(document.body.scrollLeft).toBe(0);
    document.body.scrollTop = 700;
    fireEvent.click(screen.getByText('Back'));
    expect(document.body.scrollTop).toBe(0);
  });

  it('resets on back navigation and disables browser position restoration while mounted', () => {
    const { unmount } = render(<Shell />);
    expect(window.history.scrollRestoration).toBe('manual');
    fireEvent.click(screen.getByText('Next page'));
    const page = screen.getByTestId('page-scroll');
    page.scrollTop = 800;
    windowScroll.mockClear();
    fireEvent.click(screen.getByText('Back'));
    expect(page.scrollTop).toBe(0);
    expect(windowScroll).toHaveBeenCalledTimes(1);
    unmount();
    expect(window.history.scrollRestoration).toBe('auto');
  });

  it('resets again after a lazy destination finishes loading', async () => {
    let resolvePage!: (value: { default: () => JSX.Element }) => void;
    const NextPage = lazy(() => new Promise<{ default: () => JSX.Element }>((resolve) => {
      resolvePage = resolve;
    }));
    render(<Shell><Routes>
      <Route path="/first" element={<p>First page</p>} />
      <Route path="/second" element={<NextPage />} />
    </Routes></Shell>);
    fireEvent.click(screen.getByText('Next page'));
    expect(screen.getByText('Loading page')).toBeInTheDocument();
    const page = screen.getByTestId('page-scroll');
    page.scrollTop = 900;
    windowScroll.mockClear();
    await act(async () => {
      resolvePage({ default: () => <p>Second page</p> });
    });
    expect(screen.getByText('Second page')).toBeInTheDocument();
    expect(page.scrollTop).toBe(0);
    expect(windowScroll).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });
});
