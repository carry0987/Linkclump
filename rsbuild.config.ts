import { defineConfig } from '@rsbuild/core';
import { pluginPreact } from '@rsbuild/plugin-preact';
import tailwind from '@tailwindcss/postcss';
import { createRequire } from 'module';

export default defineConfig({
    // Disable HMR; Chrome MV3 can't use it
    dev: { hmr: false, writeToDisk: true },
    // Do not open a dev server window; we build-and-load unpacked instead
    server: { open: false },

    tools: {
        rspack(config, { rspack }) {
            const pkg = createRequire(import.meta.url)('./package.json');
            config.plugins ??= [];
            config.plugins.push(
                new rspack.CopyRspackPlugin({
                    patterns: [
                        {
                            from: 'public/manifest.json',
                            to: 'manifest.json',
                            transform(content: Buffer) {
                                // Inject package.json version & name to manifest
                                const m = JSON.parse(content.toString());
                                m.version = pkg.version;
                                m.name = m.name ?? pkg.name;
                                return Buffer.from(JSON.stringify(m, null, 2));
                            }
                        },
                        { from: 'public/icons', to: 'icons' },
                        { from: 'public/assets', to: 'assets', noErrorOnMissing: true }
                    ]
                })
            );

            // Optimize/minify for production builds
            if (config.mode === 'production') {
                config.optimization ??= {};
                config.optimization.minimize = true;
                config.optimization.minimizer ??= [];
            }

            // Return the modified config
            return config;
        },
        postcss: (opts, { addPlugins }) => {
            addPlugins([tailwind()]);
        }
    },

    output: {
        // Disable filename hash to keep paths stable for manifest.json
        filenameHash: false,
        distPath: { root: 'dist' }
    },

    environments: {
        // UI/DOM context: popup, options, content script
        web: {
            plugins: [pluginPreact()],
            source: {
                entry: {
                    // Each entry becomes js/[name].js after build
                    popup: './src/pages/popup/index.tsx',
                    options: './src/pages/options/index.tsx',
                    content: {
                        import: './src/content/index.tsx',
                        html: false // No HTML for content script
                    }
                }
            },
            html: {
                // Pick template by entry name
                template: ({ entryName }) => {
                    if (entryName === 'popup') return 'public/popup.html';
                    if (entryName === 'options') return 'public/options.html';
                    // Return undefined for entries that shouldn't emit HTML
                    return undefined;
                },
                title: ({ entryName }) => entryName, // optional
                mountId: 'root',
                inject: 'head',
                outputStructure: 'flat'
            },
            output: {
                target: 'web',
                injectStyles: false, // ensure css files are emitted instead of inlined
                filename: {
                    js: '[name].js',
                    css: '[name].css',
                    assets: 'assets/[name][ext]'
                }
            }
        },

        // Worker context: background service worker
        worker: {
            // No preact plugin needed; it's a plain TS entry
            source: {
                entry: {
                    background: {
                        import: './src/background/index.ts',
                        html: false // No HTML for service worker
                    }
                }
            },
            output: {
                // Must be 'web-worker' for MV3 service worker
                target: 'web-worker',
                filename: {
                    js: '[name].js'
                }
            }
        }
    }
});
