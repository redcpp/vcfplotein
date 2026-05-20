import mitt from 'mitt'

// Lightweight event emitter replacing the old Vue-2 `new Vue()` bus.
// Currently only used for the `fullscreen` channel (Navbar -> Graph view).
const eventBus = mitt()

export default eventBus
