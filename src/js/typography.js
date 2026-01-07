/**
 * typography.js - Dynamic text fitting module
 * Computes optimal font size to fit text within containers
 */

const Typography = (() => {
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
      minSize: 16,
      maxSize: 32,
      widthRatio: 0.95,
      heightRatio: 0.9
    });
  };

  /**
   * Fit text for answer buttons
   */
  const fitAnswer = (element) => {
    return fitText(element, {
      minSize: 14,
      maxSize: 24,
      widthRatio: 0.9,
      heightRatio: 0.7
    });
  };

  /**
   * Fit all answer buttons on screen
   */
  const fitAllAnswers = () => {
    document.querySelectorAll('.btn-answer').forEach(btn => {
      if (btn.textContent.trim()) {
        fitAnswer(btn);
      }
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
    truncate
  };
})();
