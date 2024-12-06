// util.log.ts

type LogCategory = 'dots' | 'mouse' | 'keyboard' | 'general' | 'debug';

const ENABLED_CATEGORIES: LogCategory[] = [
    'mouse',
    'keyboard',
    'debug',
    //'general',
    'dots'  // Enable all categories for debugging
];

export default function log(message: string, category: LogCategory = 'general', ...args: any[]) {
    try {
        if (ENABLED_CATEGORIES.includes(category)) {
            console.log(`[${category}]`, message, ...args);
        }
    } catch (error) {
        // Silently fail
    }
}