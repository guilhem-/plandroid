/**
 * typography.js - Dynamic text fitting module
 * Computes optimal font size to fit text within containers
 */

const Typography = (() => {
  /**
   * Fit text inside a button by adjusting font size
   * @param {HTMLElement} button - The button element
   * @param {object} options - Configuration options
   */
  const fitButtonText = (button, options = {}) => {
    const {
      minSize = 10,
      maxSize = 32,
      padding = 8
    } = options;

    if (!button || !button.textContent.trim()) return;

    const text = button.textContent.trim();

    // Get button dimensions (accounting for padding)
    const style = getComputedStyle(button);
    const paddingLeft = parseFloat(style.paddingLeft) || padding;
    const paddingRight = parseFloat(style.paddingRight) || padding;
    const paddingTop = parseFloat(style.paddingTop) || padding;
    const paddingBottom = parseFloat(style.paddingBottom) || padding;

    const maxWidth = button.clientWidth - paddingLeft - paddingRight;
    const maxHeight = button.clientHeight - paddingTop - paddingBottom;

    if (maxWidth <= 0 || maxHeight <= 0) return;

    // Create a temporary span to measure text
    const measureSpan = document.createElement('span');
    measureSpan.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: nowrap;
      font-family: ${style.fontFamily};
      font-weight: ${style.fontWeight};
    `;
    measureSpan.textContent = text;
    document.body.appendChild(measureSpan);

    // Binary search for optimal font size
    let low = minSize;
    let high = maxSize;
    let optimalSize = minSize;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      measureSpan.style.fontSize = `${mid}px`;

      const textWidth = measureSpan.offsetWidth;
      const textHeight = measureSpan.offsetHeight;

      if (textWidth <= maxWidth && textHeight <= maxHeight) {
        optimalSize = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // Clean up
    document.body.removeChild(measureSpan);

    // Apply the optimal font size
    button.style.fontSize = `${optimalSize}px`;

    return optimalSize;
  };

  /**
   * Fit text within a container by adjusting font size
   * @param {HTMLElement} element - The text element to resize
   * @param {object} options - Configuration options
   */
  const fitText = (element, options = {}) => {
    const {
      minSize = 12,
      maxSize = 48,
      widthRatio = 0.9,
      heightRatio = 0.8,
      step = 2
    } = options;

    if (!element || !element.parentElement) return;

    const container = element.parentElement;
    const maxWidth = container.clientWidth * widthRatio;
    const maxHeight = container.clientHeight * heightRatio;

    // Start with max size
    let fontSize = maxSize;
    element.style.fontSize = `${fontSize}px`;

    // Reduce until it fits or reaches minimum
    while (
      (element.scrollWidth > maxWidth || element.scrollHeight > maxHeight) &&
      fontSize > minSize
    ) {
      fontSize -= step;
      element.style.fontSize = `${fontSize}px`;
    }

    return fontSize;
  };

  /**
   * Fit text for question display
   */
  const fitQuestion = (element) => {
    return fitText(element, {
      minSize: 14,
      maxSize: 28,
      widthRatio: 0.95,
      heightRatio: 0.9
    });
  };

  /**
   * Fit text for answer buttons
   */
  const fitAnswer = (button) => {
    return fitButtonText(button, {
      minSize: 10,
      maxSize: 28,
      padding: 8
    });
  };

  /**
   * Fit all answer buttons on screen
   */
  const fitAllAnswers = () => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      document.querySelectorAll('.btn-answer').forEach(btn => {
        if (btn.textContent.trim() && !btn.closest('.hidden')) {
          fitAnswer(btn);
        }
      });

      // Also fit questions
      document.querySelectorAll('.zone-question').forEach(q => {
        if (q.textContent.trim() && !q.closest('.hidden')) {
          fitQuestion(q);
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
    fitText,
    fitQuestion,
    fitAnswer,
    fitAllAnswers,
    fitButtonText,
    truncate
  };
})();
