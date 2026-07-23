import { useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Alert, Box, Button, Chip, Divider, IconButton, InputAdornment, MenuItem,
    Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentsIcon from '@mui/icons-material/Payments';
import ImageIcon from '@mui/icons-material/Image';
import Swal from 'sweetalert2';
import AppLayout from '@/Layouts/AppLayout';
import Receipt from './Receipt';

const peso = (n) => '₱' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Index({ products, categories }) {
    const { flash } = usePage().props;
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState('');
    const [method, setMethod] = useState('cash');
    const [paid, setPaid] = useState('');
    const [processing, setProcessing] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const searchRef = useRef(null);

    // Pop the receipt when the server flashes a completed sale
    useEffect(() => {
        if (flash?.sale) {
            setReceipt(flash.sale);
            setCart([]); setDiscount(''); setPaid(''); setMethod('cash');
        }
    }, [flash?.sale]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return products.filter((p) =>
            (!category || p.category_id === category) &&
            (!q || p.name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                (p.barcode || '').toLowerCase().includes(q)));
    }, [products, query, category]);

    const stockOf = (id) => products.find((p) => p.id === id)?.stock_quantity ?? 0;
    const cartQtyOf = (id) => cart.find((i) => i.id === id)?.quantity ?? 0;

    const addToCart = (product) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock_quantity) return prev; // cap at stock
                return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                id: product.id, name: product.name, price: Number(product.selling_price),
                unit: product.unit, quantity: 1,
            }];
        });
    };

    const setQty = (id, qty) => {
        const max = stockOf(id);
        const q = Math.max(1, Math.min(qty, max));
        setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: q } : i));
    };

    const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

    const clearCart = () => {
        if (!cart.length) return;
        Swal.fire({ title: 'Clear cart?', icon: 'question', showCancelButton: true, confirmButtonColor: '#dc2626' })
            .then((r) => { if (r.isConfirmed) setCart([]); });
    };

    // Enter in search: exact barcode/SKU adds straight to cart
    const onSearchKey = (e) => {
        if (e.key !== 'Enter') return;
        const q = query.trim().toLowerCase();
        const hit = products.find((p) => (p.barcode || '').toLowerCase() === q || p.sku.toLowerCase() === q);
        if (hit) { addToCart(hit); setQuery(''); }
        else if (filtered.length === 1) { addToCart(filtered[0]); setQuery(''); }
    };

    const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
    const disc = Math.min(Number(discount) || 0, subtotal);
    const total = Math.max(0, subtotal - disc);
    const paidNum = method === 'cash' ? (Number(paid) || 0) : total;
    const change = Math.max(0, paidNum - total);
    const canCheckout = cart.length > 0 && (method !== 'cash' || paidNum >= total) && !processing;

    const checkout = () => {
        if (!canCheckout) return;
        setProcessing(true);
        router.post('/pos', {
            items: cart.map((i) => ({ product_id: i.id, quantity: i.quantity })),
            discount: disc,
            payment_method: method,
            amount_paid: paidNum,
        }, {
            preserveScroll: true,
            onError: (errs) => Swal.fire('Checkout failed', Object.values(errs)[0] || 'Please review the order.', 'error'),
            onFinish: () => setProcessing(false),
        });
    };

    const quickCash = [total, 20, 50, 100, 200, 500, 1000]
        .filter((v, idx) => idx === 0 || v >= total)
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 5);

    return (
        <AppLayout title="Point of Sale" header={<Typography variant="h6" fontWeight={700}>Point of Sale</Typography>}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start' }}>
                {/* LEFT — product catalog */}
                <Paper sx={{ p: 2, flex: 1, width: '100%' }}>
                    <TextField
                        inputRef={searchRef} fullWidth size="small" autoFocus
                        placeholder="Scan barcode or search name / SKU…  (Enter to add)"
                        value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onSearchKey}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                        sx={{ mb: 2 }}
                    />

                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        <Chip label="All" color={!category ? 'primary' : 'default'} onClick={() => setCategory('')} />
                        {categories.map((c) => (
                            <Chip key={c.id} label={c.name} color={category === c.id ? 'primary' : 'default'}
                                onClick={() => setCategory(c.id)} />
                        ))}
                    </Stack>

                    <Box sx={{
                        display: 'grid', gap: 1.5,
                        gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', lg: 'repeat(4,1fr)' },
                        maxHeight: '70vh', overflowY: 'auto', pr: 0.5,
                    }}>
                        {filtered.length === 0 && (
                            <Typography color="text.secondary" sx={{ gridColumn: '1/-1', py: 4, textAlign: 'center' }}>
                                No products match.
                            </Typography>
                        )}
                        {filtered.map((p) => {
                            const available = p.stock_quantity - cartQtyOf(p.id);
                            const out = available <= 0;
                            return (
                            <Paper key={p.id} onClick={() => { if (!out) addToCart(p); }}
                                sx={{
                                    p: 1.5, border: 1, borderColor: 'divider', transition: '0.15s',
                                    display: 'flex', flexDirection: 'column',
                                    cursor: out ? 'not-allowed' : 'pointer', opacity: out ? 0.55 : 1,
                                    '&:hover': out ? {} : { borderColor: 'primary.main', boxShadow: 2, transform: 'translateY(-2px)' },
                                }}>
                                <Box sx={{ width: '100%', aspectRatio: '1 / 1', mb: 1, borderRadius: 1.5, overflow: 'hidden',
                                    bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {p.image_url
                                        ? <Box component="img" src={p.image_url} alt={p.name}
                                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <ImageIcon sx={{ color: 'text.disabled', fontSize: 32 }} />}
                                </Box>
                                <Typography variant="body2" fontWeight={600} noWrap title={p.name}>{p.name}</Typography>
                                <Typography variant="caption" color="text.secondary" display="block">{p.sku}</Typography>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
                                    <Typography color="primary" fontWeight={700}>{peso(p.selling_price)}</Typography>
                                    <Chip size="small" variant="outlined"
                                        label={out ? 'Out' : `${available} ${p.unit}`}
                                        color={out ? 'error' : (available <= 5 ? 'warning' : 'default')} />
                                </Stack>
                            </Paper>
                            );
                        })}
                    </Box>
                </Paper>

                {/* RIGHT — cart / checkout */}
                <Paper sx={{ p: 2, width: { xs: '100%', md: 380 }, flexShrink: 0, position: { md: 'sticky' }, top: 88 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <ShoppingCartIcon color="primary" />
                            <Typography fontWeight={700}>Current Order</Typography>
                            <Chip size="small" label={cart.reduce((s, i) => s + i.quantity, 0)} color="primary" />
                        </Stack>
                        <Tooltip title="Clear cart">
                            <span><IconButton size="small" onClick={clearCart} disabled={!cart.length}>
                                <DeleteSweepIcon fontSize="small" />
                            </IconButton></span>
                        </Tooltip>
                    </Stack>

                    <Divider />

                    <Box sx={{ maxHeight: '40vh', overflowY: 'auto', my: 1 }}>
                        {cart.length === 0 && (
                            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                Cart is empty. Tap a product to add.
                            </Typography>
                        )}
                        {cart.map((i) => (
                            <Box key={i.id}
                                sx={{ p: 1.5, mb: 1, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                {/* top row: name + line total + remove */}
                                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="body2" fontWeight={600} noWrap>{i.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{peso(i.price)} each</Typography>
                                    </Box>
                                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                                        <Typography variant="body2" fontWeight={700}>{peso(i.price * i.quantity)}</Typography>
                                        <Tooltip title="Remove">
                                            <IconButton size="small" color="error" onClick={() => removeItem(i.id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Stack>

                                {/* bottom row: quantity stepper */}
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                                    <IconButton size="small" onClick={() => setQty(i.id, i.quantity - 1)}
                                        sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
                                        <RemoveIcon fontSize="small" />
                                    </IconButton>
                                    <TextField value={i.quantity} size="small"
                                        onChange={(e) => setQty(i.id, parseInt(e.target.value, 10) || 1)}
                                        inputProps={{ style: { textAlign: 'center', width: 44, padding: 6 } }} />
                                    <IconButton size="small" onClick={() => setQty(i.id, i.quantity + 1)}
                                        disabled={i.quantity >= stockOf(i.id)}
                                        sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
                                        <AddIcon fontSize="small" />
                                    </IconButton>
                                    <Box sx={{ flexGrow: 1 }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {stockOf(i.id) - i.quantity} left
                                    </Typography>
                                </Stack>
                            </Box>
                        ))}
                    </Box>

                    <Divider />

                    {/* Totals */}
                    <Stack spacing={1.5} sx={{ mt: 2 }}>
                        <Row label="Subtotal" value={peso(subtotal)} />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Discount</Typography>
                            <TextField size="small" type="number" value={discount}
                                onChange={(e) => setDiscount(e.target.value)} placeholder="0.00"
                                InputProps={{ startAdornment: <InputAdornment position="start">₱</InputAdornment> }}
                                sx={{ width: 130 }} />
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>Total</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700 }} color="primary">{peso(total)}</Typography>
                        </Box>
                    </Stack>

                    {/* Payment */}
                    <Typography variant="overline" color="text.secondary"
                        sx={{ display: 'block', mt: 3, mb: 1, fontWeight: 700, letterSpacing: 1 }}>
                        Payment Method
                    </Typography>
                    <ToggleButtonGroup fullWidth exclusive size="small" value={method}
                        onChange={(_e, v) => v && setMethod(v)}>
                        <ToggleButton value="cash">Cash</ToggleButton>
                        <ToggleButton value="card">Card</ToggleButton>
                        <ToggleButton value="gcash">GCash</ToggleButton>
                    </ToggleButtonGroup>

                    {method === 'cash' && (
                        <>
                            <TextField fullWidth size="small" type="number" label="Amount tendered" value={paid}
                                onChange={(e) => setPaid(e.target.value)} sx={{ mt: 2.5 }}
                                InputProps={{ startAdornment: <InputAdornment position="start">₱</InputAdornment> }} />
                            <Stack direction="row" sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                {quickCash.map((v, i) => (
                                    <Chip key={i} label={i === 0 ? 'Exact' : peso(v)} variant="outlined"
                                        onClick={() => setPaid(String(v))} />
                                ))}
                            </Stack>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2.5 }}>
                                <Typography>Change</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700 }} color="success.main">{peso(change)}</Typography>
                            </Box>
                        </>
                    )}

                    {method === 'cash' && paidNum > 0 && paidNum < total && (
                        <Alert severity="warning" sx={{ mt: 2 }}>Amount is less than the total.</Alert>
                    )}

                    <Button fullWidth variant="contained" size="large" startIcon={<PaymentsIcon />}
                        sx={{ mt: 3, py: 1.4 }} disabled={!canCheckout} onClick={checkout}>
                        {processing ? 'Processing…' : `Charge ${peso(total)}`}
                    </Button>
                </Paper>
            </Box>

            <Receipt sale={receipt} open={!!receipt} onClose={() => setReceipt(null)} />
        </AppLayout>
    );
}

function Row({ label, value }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="body2">{value}</Typography>
        </Box>
    );
}
