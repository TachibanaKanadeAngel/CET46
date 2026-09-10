export { UI } from './ui/toast.js';
export { playTone, speak } from './ui/audio.js';
export { fireConfetti } from './ui/confetti.js';
export { announceForAccessibility, trapFocus } from './ui/accessibility.js';
export { setSafeWordHeader } from './ui/word-header.js';
export { generateCloze, initClozeMode } from './ui/cloze.js';
export { toggleTheme, initTheme, THEME_KEY } from './ui/theme.js';
export { showLoadingOverlay, updateLoadingProgress } from './ui/loading.js';
export {
  renderAlgorithmTransparency,
  createAlgorithmHeatmap,
  renderEFDisplay,
} from './ui/transparency.js';
export { Skeleton } from './ui/skeleton.js';

import './ui/toast-ext.js';
