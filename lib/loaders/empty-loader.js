/**
 * Turbopack loader that replaces its input with an empty ES module.
 * Used to stub satellite.js WASM runtimes that use node: built-ins.
 */
module.exports = function emptyLoader() {
  return "export default {};"
};
