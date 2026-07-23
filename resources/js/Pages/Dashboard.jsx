import { Link } from '@inertiajs/react';
import {
    Box, Button, Chip, Divider, LinearProgress, Paper, Stack, Typography,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import PaidIcon from '@mui/icons-material/Paid';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AppLayout from '@/Layouts/AppLayout';

const peso = (n) => '₱' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PRIMARY = '#2563eb';

function Kpi({ icon, label, value, color = 'primary' }) {
    return (
        <Paper sx={{ p: 2.5, flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: `${color}.main`, color: '#fff', p: 1.4, borderRadius: 2, display: 'flex' }}>{icon}</Box>
            <Box>
                <Typography variant="h5" fontWeight={700}>{value}</Typography>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
            </Box>
        </Paper>
    );
}

export default function Dashboard({ auth, stats, trend, topProducts, lowStock, recentSales }) {
    const maxQty = Math.max(1, ...topProducts.map((p) => Number(p.qty)));

    return (
        <AppLayout title="Dashboard" header={<Typography variant="h6" fontWeight={700}>Dashboard</Typography>}>
            <Typography variant="h5" fontWeight={700} mb={0.5}>
                Welcome back, {auth.user.name} 👋
            </Typography>
            <Typography color="text.secondary" mb={3}>Here's how the store is doing today.</Typography>

            {/* KPI row */}
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Kpi icon={<PaidIcon />} label="Today's Revenue" value={peso(stats.today_revenue)} color="success" />
                <Kpi icon={<ReceiptLongIcon />} label="Today's Transactions" value={stats.today_transactions} color="primary" />
                <Kpi icon={<CalendarMonthIcon />} label="This Month" value={peso(stats.month_revenue)} color="secondary" />
                <Kpi icon={<WarningAmberIcon />} label="Low Stock Items" value={stats.low_stock} color="warning" />
            </Stack>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'stretch' }}>
                {/* Revenue trend */}
                <Paper sx={{ p: 2.5, flex: 2, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <TrendingUpIcon color="primary" />
                        <Typography fontWeight={700}>Revenue — last 7 days</Typography>
                    </Stack>
                    <BarChart
                        height={300}
                        hideLegend
                        borderRadius={6}
                        xAxis={[{ scaleType: 'band', data: trend.map((d) => d.label) }]}
                        series={[{ data: trend.map((d) => d.revenue), label: 'Revenue', color: PRIMARY,
                            valueFormatter: (v) => peso(v ?? 0) }]}
                        margin={{ left: 70 }}
                    />
                </Paper>

                {/* Top products */}
                <Paper sx={{ p: 2.5, flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} mb={2}>Top Products (30 days)</Typography>
                    {topProducts.length === 0 && (
                        <Typography color="text.secondary" variant="body2">No sales yet.</Typography>
                    )}
                    <Stack spacing={2}>
                        {topProducts.map((p) => (
                            <Box key={p.product_name}>
                                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                    <Typography variant="body2" fontWeight={600} noWrap>{p.product_name}</Typography>
                                    <Typography variant="body2" color="text.secondary">{p.qty} sold</Typography>
                                </Stack>
                                <LinearProgress variant="determinate" value={(p.qty / maxQty) * 100}
                                    sx={{ height: 8, borderRadius: 4 }} />
                            </Box>
                        ))}
                    </Stack>
                </Paper>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', lg: 'row' }, mt: 2 }}>
                {/* Recent sales */}
                <Paper sx={{ p: 2.5, flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography fontWeight={700}>Recent Sales</Typography>
                        <Button component={Link} href="/sales" size="small">View all</Button>
                    </Stack>
                    <Divider />
                    {recentSales.length === 0 && (
                        <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>No sales yet.</Typography>
                    )}
                    {recentSales.map((s) => (
                        <Box key={s.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2 }}>
                            <Box>
                                <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{s.invoice_number}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {s.user?.name || '—'} · {new Date(s.created_at).toLocaleString()}
                                </Typography>
                            </Box>
                            <Stack alignItems="flex-end">
                                <Typography variant="body2" fontWeight={700}>{peso(s.total)}</Typography>
                                <Chip size="small" label={s.payment_method} variant="outlined" />
                            </Stack>
                        </Box>
                    ))}
                </Paper>

                {/* Low stock */}
                <Paper sx={{ p: 2.5, flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <WarningAmberIcon color="warning" />
                            <Typography fontWeight={700}>Low Stock</Typography>
                        </Stack>
                        {auth.user.role === 'admin' && (
                            <Button component={Link} href="/stock" size="small">Manage</Button>
                        )}
                    </Stack>
                    <Divider />
                    {lowStock.length === 0 && (
                        <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>Everything is well stocked. 🎉</Typography>
                    )}
                    {lowStock.map((p) => (
                        <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2 }}>
                            <Box>
                                <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{p.sku}</Typography>
                            </Box>
                            <Chip size="small" color={p.stock_quantity === 0 ? 'error' : 'warning'}
                                label={`${p.stock_quantity} ${p.unit} left`} />
                        </Box>
                    ))}
                </Paper>
            </Box>
        </AppLayout>
    );
}
