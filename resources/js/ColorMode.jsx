import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CssBaseline, IconButton, ThemeProvider, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { getTheme } from '@/theme';

const STORAGE_KEY = 'posify-color-mode';

const ColorModeContext = createContext({ mode: 'light', toggle: () => {} });

export const useColorMode = () => useContext(ColorModeContext);

/**
 * App-wide light/dark provider. Mounted once at the Inertia root so the chosen
 * mode persists across every page (login, forgot password, dashboard, POS…).
 */
export function ColorModeProvider({ children }) {
    const [mode, setMode] = useState(() => {
        if (typeof window === 'undefined') return 'light';
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') return saved;
        // fall back to the OS preference on first visit
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, mode);
        document.documentElement.setAttribute('data-theme', mode);
    }, [mode]);

    const value = useMemo(() => ({
        mode,
        toggle: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
    }), [mode]);

    const theme = useMemo(() => getTheme(mode), [mode]);

    return (
        <ColorModeContext.Provider value={value}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

/** Sun/moon toggle button — drop it anywhere; it uses the shared context. */
export function ThemeToggle(props) {
    const { mode, toggle } = useColorMode();
    return (
        <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            <IconButton onClick={toggle} color="inherit" {...props}>
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
        </Tooltip>
    );
}
