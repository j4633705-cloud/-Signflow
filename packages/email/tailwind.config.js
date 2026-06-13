/* eslint-disable @typescript-eslint/no-var-requires */
const baseConfig = require('@signflow/tailwind-config');
const _path = require('node:path');

module.exports = {
  ...baseConfig,
  content: [`templates/**/*.{ts,tsx}`],
};
