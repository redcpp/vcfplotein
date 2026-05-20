// Minimal browser-safe assert (replaces Node's `assert` module, which Vite
// cannot bundle for the browser).
export default function assert (condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}
