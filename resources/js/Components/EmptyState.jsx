import { Box, Typography } from '@mui/material';

/**
 * Friendly placeholder for empty tables / grids.
 * Renders an icon in a soft circle, a title, and an optional hint line.
 *
 *   <EmptyState icon={<Inventory2OutlinedIcon />} title="No products yet"
 *               hint='Click "Add Product" to create your first one.' />
 */
export default function EmptyState({ icon, title, hint }) {
    return (
        <Box sx={{ py: 6, textAlign: 'center' }}>
            <Box sx={{
                width: 64, height: 64, mx: 'auto', mb: 2, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: 'action.hover', color: 'text.secondary',
                '& svg': { fontSize: 32 },
            }}>
                {icon}
            </Box>
            <Typography fontWeight={600}>{title}</Typography>
            {hint && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {hint}
                </Typography>
            )}
        </Box>
    );
}
