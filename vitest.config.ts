import path from 'path';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        projects: [
            {
                resolve: {
                    alias: {
                        '@': path.resolve(__dirname, 'src')
                    }
                },
                test: {
                    root: './__tests__',
                    name: { label: 'core', color: 'green' },
                    environment: 'jsdom'
                }
            }
        ],
        coverage: {
            // Test coverage options
            enabled: false,
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [...coverageConfigDefaults.exclude]
        },
        typecheck: {
            // Type check options (optional)
            enabled: true
        }
    }
});
