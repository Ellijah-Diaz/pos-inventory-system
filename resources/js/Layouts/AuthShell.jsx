import { Box, Paper, Stack, Typography } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import BarChartIcon from '@mui/icons-material/BarChart';
import Brand from '@/Components/Brand';
import { ThemeToggle } from '@/ColorMode';

const features = [
    { icon: <ShoppingCartCheckoutIcon />, title: 'Fast Checkout', text: 'Scan, cart, and charge in seconds.' },
    { icon: <Inventory2Icon />,           title: 'Live Inventory', text: 'Stock updates the moment you sell.' },
    { icon: <BarChartIcon />,             title: 'Sales Insights', text: 'Revenue, trends, and top products.' },
];

/**
 * Shared split-screen shell for all auth pages (login, forgot/reset password, register).
 * Left = branded gradient panel; right = a centered card that renders `children`.
 */
export default function AuthShell({ children }) {
    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
            {/* Dark-mode toggle — always visible, top-right */}
            <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 10 }}>
                <ThemeToggle sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider' }} />
            </Box>

            {/* Left — branded panel (hidden on small screens) */}
                <Box
                    sx={{
                        display: { xs: 'none', md: 'flex' }, flexDirection: 'column',
                        justifyContent: 'space-between', width: '45%', p: 6, color: '#fff',
                        position: 'relative', overflow: 'hidden',
                        background: 'linear-gradient(150deg, #1e3a8a 0%, #2563eb 55%, #7c3aed 100%)',
                    }}
                >
                    <Box sx={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.08)', top: -80, right: -60 }} />
                    <Box sx={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.06)', bottom: 40, left: -50 }} />

                    <Brand light size={48} />

                    <Box sx={{ position: 'relative' }}>
                        <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-1px', mb: 1.5 }}>
                            Point of Sale &<br />Inventory System
                        </Typography>
                        <Typography sx={{ opacity: 0.85, mb: 4, maxWidth: 380 }}>
                            Everything your store needs to sell, track stock, and understand your numbers — in one place.
                        </Typography>

                        <Stack spacing={2}>
                            {features.map((f) => (
                                <Stack key={f.title} direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', p: 1.2, borderRadius: 2, display: 'flex' }}>
                                        {f.icon}
                                    </Box>
                                    <Box>
                                        <Typography fontWeight={700}>{f.title}</Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>{f.text}</Typography>
                                    </Box>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>

                    <Typography variant="caption" sx={{ opacity: 0.7, position: 'relative' }}>
                        © {new Date().getFullYear()} POSify. All rights reserved.
                    </Typography>
                </Box>

                {/* Right — content card */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, sm: 6 } }}>
                    <Paper sx={{ p: { xs: 3, sm: 5 }, width: '100%', maxWidth: 420, borderRadius: 3 }}>
                        <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
                            <Brand size={44} />
                        </Box>
                        {children}
                    </Paper>
                </Box>
        </Box>
    );
}
