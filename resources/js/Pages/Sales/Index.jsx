import { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Box, Button, Chip, CircularProgress, Dialog, DialogContent, DialogTitle,
    Divider, IconButton, MenuItem, Paper, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import Swal from 'sweetalert2';
import PaidIcon from '@mui/icons-material/Paid';
import DiscountIcon from '@mui/icons-material/Discount';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AppLayout from '@/Layouts/AppLayout';
import DialogCloseButton from '@/Components/DialogCloseButton';
import EmptyState from '@/Components/EmptyState';

const peso = (n) => '₱' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Summary({ icon, label, value, color }) {
    return (
        <Paper sx={{ p: 2, flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: `${color}.main`, color: `${color}.contrastText`, p: 1.2, borderRadius: 2, display: 'flex' }}>{icon}</Box>
            <Box>
                <Typography variant="h6" fontWeight={700}>{value}</Typography>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
            </Box>
        </Paper>
    );
}

export default function Index({ sales, filters, summary }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.role === 'admin';
    const [search, setSearch] = useState(filters.search || '');
    const [from, setFrom] = useState(filters.from || '');
    const [to, setTo] = useState(filters.to || '');
    const [status, setStatus] = useState(filters.status || '');
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    const apply = (extra = {}) =>
        router.get('/sales', {
            search: search || undefined, from: from || undefined, to: to || undefined,
            status: status || undefined, ...extra,
        }, { preserveState: true, replace: true });

    useEffect(() => {
        const t = setTimeout(() => {
            if (search === (filters.search || '')) return;
            apply();
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    const openDetail = async (id) => {
        setLoading(true);
        setDetail({});
        try {
            const { data } = await window.axios.get(`/sales/${id}`);
            setDetail(data);
        } finally {
            setLoading(false);
        }
    };

    const changePage = (_e, p) => apply({ page: p + 1 });

    const voidSale = (sale) => {
        Swal.fire({
            title: `Void ${sale.invoice_number}?`,
            text: 'Stock will be returned to inventory and the sale excluded from revenue. This cannot be undone.',
            icon: 'warning',
            input: 'text',
            inputLabel: 'Reason for voiding',
            inputPlaceholder: 'e.g. wrong order, customer refund…',
            inputValidator: (v) => !v?.trim() && 'A reason is required.',
            showCancelButton: true,
            confirmButtonText: 'Void sale',
            confirmButtonColor: '#dc2626',
        }).then((r) => {
            if (!r.isConfirmed) return;
            router.post(`/sales/${sale.id}/void`, { reason: r.value.trim() }, {
                preserveScroll: true,
                onError: (errs) => Swal.fire('Void failed', Object.values(errs)[0] || 'Please try again.', 'error'),
            });
        });
    };

    return (
        <AppLayout title="Sales" header={<Typography variant="h6" fontWeight={700}>Sales History</Typography>}>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Summary icon={<ReceiptLongIcon />} label="Transactions" value={summary.count} color="primary" />
                <Summary icon={<PaidIcon />} label="Total Revenue" value={peso(summary.revenue)} color="success" />
                <Summary icon={<DiscountIcon />} label="Total Discounts" value={peso(summary.discount)} color="secondary" />
            </Stack>

            <Paper sx={{ p: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} mb={2}>
                    <TextField size="small" label="Search invoice #" value={search}
                        onChange={(e) => setSearch(e.target.value)} sx={{ width: { xs: '100%', sm: 240 } }} />
                    <TextField size="small" type="date" label="From" slotProps={{ inputLabel: { shrink: true } }}
                        value={from} onChange={(e) => setFrom(e.target.value)} />
                    <TextField size="small" type="date" label="To" slotProps={{ inputLabel: { shrink: true } }}
                        value={to} onChange={(e) => setTo(e.target.value)} />
                    <TextField size="small" select label="Status" sx={{ minWidth: 140 }}
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); apply({ status: e.target.value || undefined }); }}>
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="voided">Voided</MenuItem>
                    </TextField>
                    <Button variant="contained" onClick={() => apply()}>Filter</Button>
                    {(from || to || search || status) && (
                        <Button onClick={() => {
                            setSearch(''); setFrom(''); setTo(''); setStatus('');
                            router.get('/sales');
                        }}>Clear</Button>
                    )}
                </Stack>

                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Invoice #</b></TableCell>
                                <TableCell><b>Date</b></TableCell>
                                <TableCell><b>Cashier</b></TableCell>
                                <TableCell align="center"><b>Items</b></TableCell>
                                <TableCell align="center"><b>Payment</b></TableCell>
                                <TableCell align="right"><b>Total</b></TableCell>
                                <TableCell align="center"><b>Status</b></TableCell>
                                <TableCell align="right"><b></b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sales.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} sx={{ border: 0 }}>
                                        <EmptyState icon={<ReceiptLongOutlinedIcon />}
                                            title="No sales found"
                                            hint={filters.search || filters.from || filters.to || filters.status
                                                ? 'Try widening the date range or clearing the filters.'
                                                : 'Completed sales from the POS will appear here.'} />
                                    </TableCell>
                                </TableRow>
                            )}
                            {sales.data.map((s) => (
                                <TableRow key={s.id} hover sx={s.status === 'voided' ? { opacity: 0.55 } : {}}>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{s.invoice_number}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(s.created_at).toLocaleString()}</TableCell>
                                    <TableCell>{s.user?.name || '—'}</TableCell>
                                    <TableCell align="center">{s.items_count}</TableCell>
                                    <TableCell align="center"><Chip size="small" variant="outlined" label={s.payment_method} /></TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700,
                                        textDecoration: s.status === 'voided' ? 'line-through' : 'none' }}>
                                        {peso(s.total)}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip size="small" label={s.status}
                                            color={s.status === 'completed' ? 'success' : 'error'} />
                                    </TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                        <Tooltip title="View details">
                                            <IconButton size="small" onClick={() => openDetail(s.id)}><VisibilityIcon fontSize="small" /></IconButton>
                                        </Tooltip>
                                        {isAdmin && s.status === 'completed' && (
                                            <Tooltip title="Void sale">
                                                <IconButton size="small" color="error" onClick={() => voidSale(s)}>
                                                    <BlockIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination component="div" count={sales.total}
                    page={sales.current_page - 1} rowsPerPage={sales.per_page}
                    rowsPerPageOptions={[sales.per_page]} onPageChange={changePage} />
            </Paper>

            {/* Detail modal */}
            <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    {loading ? 'Loading…' : detail?.invoice_number}
                    <DialogCloseButton onClose={() => setDetail(null)} />
                </DialogTitle>
                <DialogContent>
                    {loading || !detail?.invoice_number ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                    ) : (
                        <>
                            <Typography variant="body2" color="text.secondary" mb={1}>
                                {detail.created_at} · {detail.cashier || '—'} · {detail.payment_method}
                            </Typography>
                            {detail.status === 'voided' && (
                                <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, borderColor: 'error.main',
                                    bgcolor: 'transparent' }}>
                                    <Typography variant="body2" color="error" fontWeight={700}>VOIDED</Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {detail.voided_at} · by {detail.voided_by || '—'}
                                    </Typography>
                                    {detail.void_reason && (
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>“{detail.void_reason}”</Typography>
                                    )}
                                </Paper>
                            )}
                            <Divider sx={{ mb: 1 }} />
                            <Stack spacing={0.5}>
                                {detail.items.map((i, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">{i.quantity} × {i.name}
                                            <Typography component="span" variant="caption" color="text.secondary"> @ {peso(i.price)}</Typography>
                                        </Typography>
                                        <Typography variant="body2">{peso(i.subtotal)}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                            <Divider sx={{ my: 1 }} />
                            <Row label="Subtotal" value={peso(detail.subtotal)} />
                            {detail.discount > 0 && <Row label="Discount" value={`-${peso(detail.discount)}`} />}
                            <Row label="Total" value={peso(detail.total)} bold />
                            <Row label="Amount Paid" value={peso(detail.amount_paid)} />
                            <Row label="Change" value={peso(detail.change)} />
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function Row({ label, value, bold }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
            <Typography variant="body2" fontWeight={bold ? 700 : 400} color={bold ? 'text.primary' : 'text.secondary'}>{label}</Typography>
            <Typography variant="body2" fontWeight={bold ? 700 : 400}>{value}</Typography>
        </Box>
    );
}
