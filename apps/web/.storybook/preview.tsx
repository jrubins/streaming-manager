import type { Preview } from '@storybook/react-vite';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    // Fail stories on accessibility violations in the a11y panel.
    a11y: { test: 'error' },
  },
};

export default preview;
