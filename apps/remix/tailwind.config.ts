/* eslint-disable @typescript-eslint/no-var-requires */
const baseConfig = require('@signflow/ui/tailwind.config.cjs');
const path = require('path');

module.exports = {
  presets: [baseConfig],
  content: [
    './app/**/*.{ts,tsx}',
    `${path.join(require.resolve('@signflow/ui'), '..')}/components/**/*.{ts,tsx}`,
    `${path.join(require.resolve('@signflow/ui'), '..')}/icons/**/*.{ts,tsx}`,
    `${path.join(require.resolve('@signflow/ui'), '..')}/lib/**/*.{ts,tsx}`,
    `${path.join(require.resolve('@signflow/ui'), '..')}/primitives/**/*.{ts,tsx}`,
    `${path.join(require.resolve('@signflow/email'), '..')}/templates/**/*.{ts,tsx}`,
    `${path.join(require.resolve('@signflow/email'), '..')}/template-components/**/*.{ts,tsx}`,
    `${path.join(require.resolve('@signflow/email'), '..')}/providers/**/*.{ts,tsx}`,
  ],
};
