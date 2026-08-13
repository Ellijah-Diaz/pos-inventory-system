import { useEffect, useMemo, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TablePagination,
    TableRow, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import RefreshIcon from '@mui/icons-material/Refresh';
import SwapVertOutlinedIcon from '@mui/icons-material/SwapVertOutlined';
import AppLayout from '@/Layouts/AppLayout';
import DialogCloseButton from '@/Components/DialogCloseButton';
import EmptyState from '@/Components/EmptyState';

const typeMeta = {
    in:         { label: 'Stock In',    color: 'success' },
    out:        { label: 'Stock Out',   color: 'error' },
    adjustment: { label: 'Adjustment',  color: 'info' },
};

function StatCard({ icon, label, value, color }) {
    return (
        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: `${color}.main`, color: `${color}.contrastText`, p: 1.2, borderRadius: 2, display: 'flex' }}>{icon}</Box>
            <Box>
                <Typography variant="h5" fontWeight={700}>{value}</Typography>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
            </Box>
        </Paper>
    );
}

export default function Index({ movements, products, lowStock, filters, stats }) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');
    const [open, setOpen] = useState(false);

    const form = useForm({ product_id: '', type: 'in', quantity: '', reason: '', reference: '' });

    const selectedProduct = useMemo(
        () => products.find((p) => p.id === form.data.product_id),
        [products, form.data.product_id],
    );

    const query = (extra = {}) =>
        router.get('/stock', { search, type: type || undefined, ...extra }, { preserveState: true, replace: true });

    useEffect(() => {
        const t = setTimeout(() => {
            if (search === (filters.search || '')) return;
            query();
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => { query(); /* eslint-disable-next-line */ }, [type]);

    const openMovement = (product = null, presetType = 'in') => {
        form.reset();
        form.clearErrors();
        form.setData({ product_id: product?.id || '', type: presetType, quantity: '', reason: '', reference: '' });
        setOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        form.post('/stock', { onSuccess: () => setOpen(false), preserveScroll: true });
    };

    const changePage = (_e, p) => query({ page: p + 1 });

    const qtyLabel = form.data.type === 'adjustment' ? 'New Stock Count' : 'Quantity';

    return (
        <AppLayout title="Stock Management" header={<Typography variant="h6" fontWeight={700}>Stock Management</Typography>}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}><StatCard icon={<SwapVertIcon />} label="Movements Today" value={stats.movements_today} color="primary" /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><StatCard icon={<WarningAmberIcon />} label="Low Stock Items" value={stats.low_stock} color="warning" /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><StatCard icon={<RemoveShoppingCartIcon />} label="Out of Stock" value={stats.out_of_stock} color="error" /></Grid>
            </Grid>

            {/* Low-stock alerts */}
            {lowStock.length > 0 && (
                <Paper sx={{ p: 2, mb: 2, borderColor: 'warning.light' }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                        <WarningAmberIcon color="warning" />
                        <Typography fontWeight={700}>Low Stock Alerts ({lowStock.length})</Typography>
                    </Stack>
                    <Grid container spacing={1.5}>
                        {lowStock.map((p) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
                                <Alert severity={p.stock_quantity === 0 ? 'error' : 'warning'}
                                    action={
                                        <Button color="inherit" size="small" startIcon={<RefreshIcon />}
                                            onClick={() => openMovement(p, 'in')}>Restock</Button>
                                    }>
                                    <b>{p.name}</b><br />
                                    {p.stock_quantity} {p.unit} left (reorder at {p.reorder_level})
                                </Alert>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* Movement history */}
            <Paper sx={{ p: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}
                    justifyContent="space-between" alignItems={{ md: 'center' }} mb={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                        <TextField size="small" label="Search product / SKU" value={search}
                            onChange={(e) => setSearch(e.target.value)} sx={{ width: { xs: '100%', sm: 260 } }} />
                        <ToggleButtonGroup size="small" exclusive value={type}
                            onChange={(_e, v) => setType(v ?? '')}>
                            <ToggleButton value="in" color="success">In</ToggleButton>
                            <ToggleButton value="out" color="error">Out</ToggleButton>
                            <ToggleButton value="adjustment" color="info">Adjust</ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => openMovement()}>
                        New Movement
                    </Button>
                </Stack>

                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Date</b></TableCell>
                                <TableCell><b>Product</b></TableCell>
                                <TableCell align="center"><b>Type</b></TableCell>
                                <TableCell align="center"><b>Change</b></TableCell>
                                <TableCell align="center"><b>Before → After</b></TableCell>
                                <TableCell><b>Reason</b></TableCell>
                                <TableCell><b>By</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {movements.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ border: 0 }}>
                                        <EmptyState icon={<SwapVertOutlinedIcon />}
                                            title="No stock movements yet"
                                            hint='Use "New Movement" to record stock in, out, or an adjustment.' />
                                    </TableCell>
                                </TableRow>
                            )}
                            {movements.data.map((m) => (
                                <TableRow key={m.id} hover>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {new Date(m.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {m.product?.name || '—'}
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {m.product?.sku}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip size="small" label={typeMeta[m.type]?.label}
                                            color={typeMeta[m.type]?.color} />
                                    </TableCell>
                                    <TableCell align="center" sx={{
                                        fontWeight: 700,
                                        color: m.quantity > 0 ? 'success.main' : m.quantity < 0 ? 'error.main' : 'text.secondary',
                                    }}>
                                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                                    </TableCell>
                                    <TableCell align="center" sx={{ color: 'text.secondary' }}>
                                        {m.stock_before} → <Box component="b" sx={{ color: 'text.primary' }}>{m.stock_after}</Box>
                                    </TableCell>
                                    <TableCell>{m.reason || '—'}</TableCell>
                                    <TableCell>{m.user?.name || '—'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination component="div" count={movements.total}
                    page={movements.current_page - 1} rowsPerPage={movements.per_page}
                    rowsPerPageOptions={[movements.per_page]} onPageChange={changePage} />
            </Paper>

            {/* New movement dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <form onSubmit={submit}>
                    <DialogTitle>
                        New Stock Movement
                        <DialogCloseButton onClose={() => setOpen(false)} />
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} mt={1}>
                            <FormControl fullWidth required error={!!form.errors.product_id}>
                                <InputLabel>Product</InputLabel>
                                <Select label="Product" value={form.data.product_id}
                                    onChange={(e) => form.setData('product_id', e.target.value)}>
                                    {products.map((p) => (
                                        <MenuItem key={p.id} value={p.id}>
                                            {p.name} ({p.sku}) — {p.stock_quantity} {p.unit}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {selectedProduct && (
                                <Alert severity="info">
                                    Current stock: <b>{selectedProduct.stock_quantity} {selectedProduct.unit}</b>
                                </Alert>
                            )}

                            <ToggleButtonGroup fullWidth exclusive value={form.data.type}
                                onChange={(_e, v) => v && form.setData('type', v)}>
                                <ToggleButton value="in" color="success">Stock In</ToggleButton>
                                <ToggleButton value="out" color="error">Stock Out</ToggleButton>
                                <ToggleButton value="adjustment" color="info">Adjust</ToggleButton>
                            </ToggleButtonGroup>

                            <TextField label={qtyLabel} type="number" fullWidth required
                                value={form.data.quantity}
                                onChange={(e) => form.setData('quantity', e.target.value)}
                                error={!!form.errors.quantity} helperText={form.errors.quantity ||
                                    (form.data.type === 'adjustment' ? 'Sets the stock to this exact amount' : '')} />

                            <TextField label="Reason" fullWidth value={form.data.reason}
                                onChange={(e) => form.setData('reason', e.target.value)}
                                placeholder="e.g. Restock delivery, Damaged, Count correction" />
                            <TextField label="Reference (optional)" fullWidth value={form.data.reference}
                                onChange={(e) => form.setData('reference', e.target.value)}
                                placeholder="e.g. PO number, invoice #" />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={form.processing}>Save Movement</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </AppLayout>
    );
}
