import { useEffect, useMemo, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem,
    Paper, Select, Stack, Switch, Table, TableBody, TableCell, TableContainer,
    TableHead, TablePagination, TableRow, TextField, ToggleButton, Tooltip,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import Swal from 'sweetalert2';
import AppLayout from '@/Layouts/AppLayout';
import EmptyState from '@/Components/EmptyState';

const peso = (n) => '₱' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const blank = {
    category_id: '', supplier_id: '', sku: '', barcode: '', name: '', description: '',
    cost_price: '', selling_price: '', stock_quantity: '', reorder_level: 10, unit: 'pcs', is_active: true,
    image: null, remove_image: false,
};

function StatCard({ icon, label, value, color }) {
    return (
        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: `${color}.main`, color: '#fff', p: 1.2, borderRadius: 2, display: 'flex' }}>{icon}</Box>
            <Box>
                <Typography variant="h5" fontWeight={700}>{value}</Typography>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
            </Box>
        </Paper>
    );
}

export default function Index({ products, categories, suppliers, filters, stats }) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category_id || '');
    const [lowStock, setLowStock] = useState(filters.low_stock || false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const form = useForm(blank);

    const query = (extra = {}) => {
        const params = { search, category_id: category || undefined, low_stock: lowStock || undefined, ...extra };
        router.get('/products', params, { preserveState: true, replace: true });
    };

    useEffect(() => {
        const t = setTimeout(() => {
            if (search === (filters.search || '')) return;
            query();
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => { query(); /* eslint-disable-next-line */ }, [category, lowStock]);

    const openCreate = () => { setEditing(null); form.setData({ ...blank }); form.clearErrors(); setOpen(true); };
    const openEdit = (p) => {
        setEditing(p);
        form.setData({
            category_id: p.category_id || '', supplier_id: p.supplier_id || '', sku: p.sku,
            barcode: p.barcode || '', name: p.name, description: p.description || '',
            cost_price: p.cost_price, selling_price: p.selling_price, stock_quantity: p.stock_quantity,
            reorder_level: p.reorder_level, unit: p.unit, is_active: p.is_active,
            image: null, remove_image: false,
        });
        form.clearErrors();
        setOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        const opts = { onSuccess: () => setOpen(false), preserveScroll: true, forceFormData: true };
        if (editing) {
            // multipart can't use PUT directly — spoof the method
            form.transform((d) => ({ ...d, _method: 'put' }));
            form.post(`/products/${editing.id}`, opts);
        } else {
            form.transform((d) => ({ ...d }));
            form.post('/products', opts);
        }
    };

    // Preview: newly-selected file, else the existing image (unless being removed)
    const filePreview = useMemo(
        () => (form.data.image instanceof File ? URL.createObjectURL(form.data.image) : null),
        [form.data.image],
    );
    const imagePreview = filePreview
        || (editing && editing.image_url && !form.data.remove_image ? editing.image_url : null);

    const destroy = (p) => {
        Swal.fire({
            title: 'Delete product?', text: `"${p.name}" will be removed.`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Delete',
        }).then((r) => { if (r.isConfirmed) router.delete(`/products/${p.id}`, { preserveScroll: true }); });
    };

    const changePage = (_e, p) => query({ page: p + 1 });

    return (
        <AppLayout title="Products" header={<Typography variant="h6" fontWeight={700}>Products</Typography>}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}><StatCard icon={<Inventory2Icon />} label="Total Products" value={stats.total} color="primary" /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><StatCard icon={<CheckCircleIcon />} label="Active" value={stats.active} color="success" /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><StatCard icon={<WarningAmberIcon />} label="Low Stock" value={stats.low_stock} color="warning" /></Grid>
            </Grid>

            <Paper sx={{ p: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}
                    justifyContent="space-between" alignItems={{ md: 'center' }} mb={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                        <TextField size="small" label="Search name / SKU / barcode" value={search}
                            onChange={(e) => setSearch(e.target.value)} sx={{ width: { xs: '100%', sm: 260 } }} />
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Category</InputLabel>
                            <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                                <MenuItem value="">All</MenuItem>
                                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <ToggleButton size="small" value="low" selected={lowStock} color="warning"
                            onChange={() => setLowStock(!lowStock)}>
                            <WarningAmberIcon fontSize="small" sx={{ mr: 0.5 }} /> Low stock
                        </ToggleButton>
                    </Stack>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add Product</Button>
                </Stack>

                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Image</b></TableCell>
                                <TableCell><b>SKU</b></TableCell>
                                <TableCell><b>Name</b></TableCell>
                                <TableCell><b>Category</b></TableCell>
                                <TableCell align="right"><b>Cost</b></TableCell>
                                <TableCell align="right"><b>Price</b></TableCell>
                                <TableCell align="center"><b>Stock</b></TableCell>
                                <TableCell align="center"><b>Status</b></TableCell>
                                <TableCell align="right"><b>Actions</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} sx={{ border: 0 }}>
                                        <EmptyState icon={<Inventory2OutlinedIcon />}
                                            title="No products found"
                                            hint={filters.search || filters.category_id || filters.low_stock
                                                ? 'Try clearing the search or filters.'
                                                : 'Click "Add Product" to create your first one.'} />
                                    </TableCell>
                                </TableRow>
                            )}
                            {products.data.map((p) => (
                                <TableRow key={p.id} hover>
                                    <TableCell>
                                        <Avatar variant="rounded" src={p.image_url || undefined}
                                            sx={{ width: 42, height: 42, bgcolor: 'action.hover', color: 'text.secondary' }}>
                                            {!p.image_url && <ImageIcon fontSize="small" />}
                                        </Avatar>
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{p.sku}</TableCell>
                                    <TableCell>{p.name}</TableCell>
                                    <TableCell>{p.category?.name || '—'}</TableCell>
                                    <TableCell align="right">{peso(p.cost_price)}</TableCell>
                                    <TableCell align="right">{peso(p.selling_price)}</TableCell>
                                    <TableCell align="center">
                                        <Chip size="small" label={`${p.stock_quantity} ${p.unit}`}
                                            color={p.is_low_stock ? 'warning' : 'default'}
                                            variant={p.is_low_stock ? 'filled' : 'outlined'} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip size="small" label={p.is_active ? 'Active' : 'Inactive'}
                                            color={p.is_active ? 'success' : 'default'} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => destroy(p)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination component="div" count={products.total}
                    page={products.current_page - 1} rowsPerPage={products.per_page}
                    rowsPerPageOptions={[products.per_page]} onPageChange={changePage} />
            </Paper>

            {/* Create / Edit dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
                <form onSubmit={submit}>
                    <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} mt={0}>
                            <Grid size={{ xs: 12 }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar variant="rounded" src={imagePreview || undefined}
                                        sx={{ width: 80, height: 80, bgcolor: 'action.hover', color: 'text.secondary' }}>
                                        {!imagePreview && <ImageIcon />}
                                    </Avatar>
                                    <Box>
                                        <Stack direction="row" spacing={1}>
                                            <Button component="label" variant="outlined" size="small" startIcon={<CloudUploadIcon />}>
                                                {imagePreview ? 'Change' : 'Upload Image'}
                                                <input hidden type="file" accept="image/*"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        if (f) form.setData({ ...form.data, image: f, remove_image: false });
                                                        e.target.value = '';
                                                    }} />
                                            </Button>
                                            {imagePreview && (
                                                <Button size="small" color="error"
                                                    onClick={() => form.setData({ ...form.data, image: null, remove_image: true })}>
                                                    Remove
                                                </Button>
                                            )}
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                            JPG or PNG, up to 2MB. Shown on the product list and POS.
                                        </Typography>
                                        {form.errors.image && (
                                            <Typography variant="caption" color="error">{form.errors.image}</Typography>
                                        )}
                                    </Box>
                                </Stack>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <TextField label="Product Name" fullWidth required value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    error={!!form.errors.name} helperText={form.errors.name} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField label="Unit" fullWidth required value={form.data.unit}
                                    onChange={(e) => form.setData('unit', e.target.value)}
                                    error={!!form.errors.unit} helperText={form.errors.unit} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField label="SKU" fullWidth required value={form.data.sku}
                                    onChange={(e) => form.setData('sku', e.target.value)}
                                    error={!!form.errors.sku} helperText={form.errors.sku} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField label="Barcode" fullWidth value={form.data.barcode}
                                    onChange={(e) => form.setData('barcode', e.target.value)}
                                    error={!!form.errors.barcode} helperText={form.errors.barcode} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Category</InputLabel>
                                    <Select label="Category" value={form.data.category_id}
                                        onChange={(e) => form.setData('category_id', e.target.value)}>
                                        <MenuItem value="">— None —</MenuItem>
                                        {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Supplier</InputLabel>
                                    <Select label="Supplier" value={form.data.supplier_id}
                                        onChange={(e) => form.setData('supplier_id', e.target.value)}>
                                        <MenuItem value="">— None —</MenuItem>
                                        {suppliers.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <TextField label="Cost Price" type="number" fullWidth required value={form.data.cost_price}
                                    onChange={(e) => form.setData('cost_price', e.target.value)}
                                    error={!!form.errors.cost_price} helperText={form.errors.cost_price} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <TextField label="Selling Price" type="number" fullWidth required value={form.data.selling_price}
                                    onChange={(e) => form.setData('selling_price', e.target.value)}
                                    error={!!form.errors.selling_price} helperText={form.errors.selling_price} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <TextField label="Stock Qty" type="number" fullWidth required value={form.data.stock_quantity}
                                    onChange={(e) => form.setData('stock_quantity', e.target.value)}
                                    error={!!form.errors.stock_quantity}
                                    disabled={!!editing}
                                    helperText={editing ? 'Adjust via Stock module (Step 3)' : form.errors.stock_quantity} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <TextField label="Reorder Level" type="number" fullWidth required value={form.data.reorder_level}
                                    onChange={(e) => form.setData('reorder_level', e.target.value)}
                                    error={!!form.errors.reorder_level} helperText={form.errors.reorder_level} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField label="Description" fullWidth multiline rows={2} value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <FormControlLabel
                                    control={<Switch checked={form.data.is_active}
                                        onChange={(e) => form.setData('is_active', e.target.checked)} />}
                                    label="Active (available for sale)" />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={form.processing}>
                            {editing ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </AppLayout>
    );
}
