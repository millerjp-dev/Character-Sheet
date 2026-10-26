import { useLayoutEffect, useRef } from 'react';

interface FitTextProps {
  children: string;
  className?: string;
  minFontSize?: number;
}

export function FitText({ children, className, minFontSize = 6 }: FitTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;

    if (!container || !text) {
      return;
    }

    const fitText = () => {
      text.style.fontSize = '';
      const style = window.getComputedStyle(text);
      const maxFontSize = Number.parseFloat(style.fontSize);
      const availableWidth = container.clientWidth;

      if (availableWidth === 0 || maxFontSize === 0) {
        return;
      }

      const letterSpacing = Number.parseFloat(style.letterSpacing) || 0;
      const spacingWidth = Math.max(0, children.length - 1) * letterSpacing;
      const renderedWidth = text.getBoundingClientRect().width;
      const glyphWidth = renderedWidth - spacingWidth;
      if (renderedWidth === 0 || glyphWidth <= 0) {
        return;
      }

      const fontSize = Math.max(
        minFontSize,
        Math.min(
          maxFontSize,
          maxFontSize * ((availableWidth - 1 - spacingWidth) / glyphWidth),
        ),
      );

      text.style.fontSize = `${fontSize}px`;
    };

    fitText();
    let previousWidth = container.clientWidth;
    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width !== previousWidth) {
        previousWidth = width;
        fitText();
      }
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [children, minFontSize]);

  return (
    <span className={className} ref={containerRef}>
      <span ref={textRef}>{children}</span>
    </span>
  );
}
