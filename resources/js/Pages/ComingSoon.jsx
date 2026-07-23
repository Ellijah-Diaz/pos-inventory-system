import AppLayout from '@/Layouts/AppLayout';
import { Box, Paper, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

export default function ComingSoon({ title = 'Coming Soon', step = '' }) {
    return (
        <AppLayout title={title} header={<Typography variant="h6" fontWeight={700}>{title}</Typography>}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
                <ConstructionIcon sx={{ fontSize: 64, color: 'warning.main' }} />
                <Typography variant="h5" fontWeight={700} mt={2}>{title}</Typography>
                <Typography color="text.secondary" mt={1}>
                    This module is being built{step ? ` in ${step}` : ''}. Check back soon!
                </Typography>
            </Paper>
        </AppLayout>
    );
}
