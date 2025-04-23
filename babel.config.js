export default {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
        modules: false // This tells Babel to preserve ES modules
      },
    ],
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current',
            },
            modules: 'auto' // This allows Jest to handle the modules appropriately in test environment
          },
        ],
      ],
    },
  },
};
