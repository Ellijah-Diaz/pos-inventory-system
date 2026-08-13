import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ColorModeProvider } from '@/ColorMode';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ColorModeProvider>
                <App {...props} />
            </ColorModeProvider>,
        );
    },
    progress: {
        // Violet-600 rather than either mode's primary: the bar is painted
        // outside the MUI theme, and this one sits legibly on the zinc-100 and
        // zinc-900 grounds both.
        color: '#7c3aed',
    },
});
