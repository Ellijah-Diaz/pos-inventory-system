import { createTheme } from '@mui/material/styles';

// Builds the MUI theme for the given mode ('light' | 'dark').
export function getTheme(mode = 'light') {
    const isDark = mode === 'dark';
    const border = isDark ? '#334155' : '#e2e8f0'; // slate-700 / slate-200

    return createTheme({
        palette: {
            mode,
            primary:   { main: '#2563eb' }, // blue-600
            secondary: { main: isDark ? '#a78bfa' : '#7c3aed' }, // lighter violet in dark
            success:   { main: '#16a34a' },
            warning:   { main: '#d97706' },
            error:     { main: '#dc2626' },
            background: isDark
                ? { default: '#0f172a', paper: '#1e293b' }  // slate-900 / slate-800
                : { default: '#f1f5f9', paper: '#ffffff' },
            divider: border,
        },
        shape: { borderRadius: 10 },
        typography: {
            fontFamily: 'Figtree, ui-sans-serif, system-ui, sans-serif',
            button: { textTransform: 'none', fontWeight: 600 },
        },
        components: {
            MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: `1px solid ${border}` } } },
            MuiButton: { defaultProps: { disableElevation: true } },
        },
    });
}

// Default light theme (kept for any direct import).
const theme = getTheme('light');
export default theme;
