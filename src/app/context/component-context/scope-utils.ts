
// Helper functions for deep merging scopes without mutating original references

export function isPlainObject(value: any): boolean {
    return (
        value !== null &&
        typeof value === 'object' &&
        Object.getPrototypeOf(value) === Object.prototype
    );
}

export function deepMergeScope(target: any, source: any) {
    Object.keys(source).forEach((key) => {
        const sourceVal = source[key];
        const targetVal = target[key];

        if (targetVal && isPlainObject(targetVal) && isPlainObject(sourceVal)) {
            // Copy-on-write: create a shallow copy of the target object
            // before merging into it, to ensure we don't mutate the original
            // reference from the context.
            target[key] = { ...targetVal };
            deepMergeScope(target[key], sourceVal);
        } else {
            target[key] = sourceVal;
        }
    });
}
