import { createTheme } from '@mui/material/styles';

/*
 | POSify's palette: violet on zinc.
 |
 | It used to be blue-600 on slate — which is the same blue-600 on slate that
 | Clinify runs, so two systems in the same portfolio read as one product in
 | two folders. Violet was already here as the far end of the brand gradient,
 | so promoting it to lead costs nothing and the mark still looks like itself.
 |
 | The neutral moves with it. Slate is a blue-tinted grey and would keep the
 | family resemblance alive on its own, whatever the accent did; zinc is
 | untinted, so the two apps no longer share a ground either.
 |
 | Primary is mode-aware, as secondary always was. Violet-700 is dark enough to
 | carry white text on a light surface, but against a near-black one it falls to
 | about 2.5:1 — unreadable for the text buttons and links MUI paints in
 | primary.main. Dark mode therefore lifts it to violet-400 and lets MUI pick
 | the contrastText to match, which is why callers ask for `contrastText`
 | rather than hard-coding '#fff'.
 */
export function getTheme(mode = 'light') {
    const isDark = mode === 'dark';
    const border = isDark ? '#3f3f46' : '#e4e4e7'; // zinc-700 / zinc-200

    return createTheme({
        palette: {
            mode,
            primary: isDark
                ? { main: '#a78bfa', dark: '#8b5cf6' }  // violet-400 / violet-500
                : { main: '#6d28d9', dark: '#5b21b6' }, // violet-700 / violet-800
            secondary: { main: isDark ? '#f472b6' : '#db2777' }, // pink-400 / pink-600
            success:   { main: '#16a34a' },
            warning:   { main: '#d97706' },
            error:     { main: '#dc2626' },
            background: isDark
                ? { default: '#18181b', paper: '#27272a' }  // zinc-900 / zinc-800
                : { default: '#f4f4f5', paper: '#ffffff' }, // zinc-100
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
