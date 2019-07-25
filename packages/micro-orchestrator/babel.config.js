module.exports = function() {
  return {
    env: {
      test: {
        plugins: ['transform-es2015-modules-commonjs']
      }
    }
  };
};
