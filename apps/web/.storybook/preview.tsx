import type { Preview } from '@storybook/react-vite';
import { TooltipProvider } from '../src/components/ui/tooltip';
import '../src/index.css';

const preview: Preview = {
  // The app provides tooltips at its root (components/root-layout.tsx); stories need the same.
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    // Fail stories on accessibility violations in the a11y panel.
    a11y: { test: 'error' },
  },
};

export default preview;
