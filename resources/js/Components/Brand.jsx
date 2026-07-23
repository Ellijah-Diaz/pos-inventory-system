import { Box, Typography } from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

/**
 * POSify brand mark + wordmark.
 * Props:
 *  - size: icon box size in px (default 44)
 *  - showText: render the "POSify" wordmark next to the mark (default true)
 *  - light: white text (for use on dark/gradient backgrounds)
 */
export default function Brand({ size = 44, showText = true, light = false }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
                sx={{
                    width: size, height: size, borderRadius: size * 0.3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    color: '#fff', boxShadow: '0 6px 16px rgba(37,99,235,0.35)',
                    flexShrink: 0,
                }}
            >
                <PointOfSaleIcon sx={{ fontSize: size * 0.58 }} />
            </Box>
            {showText && (
                <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{ letterSpacing: '-0.5px', color: light ? '#fff' : 'text.primary' }}
                >
                    POS<Box component="span" sx={{ color: light ? '#c7d2fe' : 'primary.main' }}>ify</Box>
                </Typography>
            )}
        </Box>
    );
}
