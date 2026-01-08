/**
 * typography.js - Dynamic text fitting module
 * Computes optimal font size to fit text within containers
 */

const Typography = (() => {
  /**
   * Fit text inside an element by adjusting font size (binary search)
   * @param {HTMLElement} element - The element containing text
   * @param {object} options - Configuration options
   */
  const fitElementText = (element, options = {}) => {
    const {
      minSize = 10,
      maxSize = 32,
      padding = 8,
      allowWrap = false
    } = options;

    if (!element || !element.textContent.trim()) return;

    const text = element.textContent.trim();

    // Get element dimensions (accounting for padding)
    const style = getComputedStyle(element);
    const paddingLeft = parseFloat(style.paddingLeft) || padding;
    const paddingRight = parseFloat(style.paddingRight) || padding;
    const paddingTop = parseFloat(style.paddingTop) || padding;
    const paddingBottom = parseFloat(style.paddingBottom) || padding;

    const maxWidth = element.clientWidth - paddingLeft - paddingRight;
    const maxHeight = element.clientHeight - paddingTop - paddingBottom;

    if (maxWidth <= 0 || maxHeight <= 0) return;

    // Create a temporary element to measure text
    const measureEl = document.createElement('span');
    measureEl.style.cssText = `
      position: absolute;
      visibility: hidden;
      font-family: ${style.fontFamily};
      font-weight: ${style.fontWeight};
      line-height: ${style.lineHeight};
      ${allowWrap ? `width: ${maxWidth}px; white-space: normal;` : 'white-space: nowrap;'}
    `;
    measureEl.textContent = text;
    document.body.appendChild(measureEl);

    // Binary search for optimal font size
    let low = minSize;
    let high = maxSize;
    let optimalSize = minSize;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      measureEl.style.fontSize = `${mid}px`;

      const textWidth = measureEl.offsetWidth;
      const textHeight = measureEl.offsetHeight;

      if (textWidth <= maxWidth && textHeight <= maxHeight) {
        optimalSize = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // Clean up
    document.body.removeChild(measureEl);

    // Apply the optimal font size
    element.style.fontSize = `${optimalSize}px`;

    return optimalSize;
  };

  /**
   * Fit text for question display (allows text wrapping)
   */
  const fitQuestion = (element) => {
    return fitElementText(element, {
      minSize: 12,
      maxSize: 48,
      padding: 4,
      allowWrap: true
    });
  };

  /**
   * Fit text for answer buttons (no wrapping)
   */
  const fitAnswer = (button) => {
    return fitElementText(button, {
      minSize: 10,
      maxSize: 28,
      padding: 8,
      allowWrap: false
    });
  };

  /**
   * Fit all text elements on screen
   */
  const fitAllAnswers = () => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Fit questions first (they determine available space context)
      document.querySelectorAll('.zone-question').forEach(q => {
        if (q.textContent.trim() && !q.closest('.hidden') && !q.closest('.waiting')) {
          fitQuestion(q);
        }
      });

      // Then fit answer buttons
      document.querySelectorAll('.btn-answer').forEach(btn => {
        if (btn.textContent.trim() && !btn.closest('.hidden')) {
          fitAnswer(btn);
        }
      });
    });
  };

  /**
   * Truncate text with ellipsis if too long
   */
  const truncate = (text, maxLength = 15) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1) + '...';
  };

  return {
    fitQuestion,
    fitAnswer,
    fitAllAnswers,
    fitElementText,
    truncate
  };
})();
