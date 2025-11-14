import ziggyRouteFunction from 'ziggy-js';

declare global {
    // This declares a global function named `route`.
    // It uses the `Route` type from ziggy-js for type-safety.
    const route: typeof ziggyRouteFunction;
}
