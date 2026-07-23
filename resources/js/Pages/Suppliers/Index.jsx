import { useEffect, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    FormControlLabel, IconButton, Paper, Stack, Switch, Table, TableBody,
    TableCell, TableContainer, TableHead, TablePagination, TableRow,
    TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import Swal from 'sweetalert2';
import AppLayout from '@/Layouts/AppLayout';
import DialogCloseButton from '@/Components/DialogCloseButton';
import EmptyState from '@/Components/EmptyState';

const blank = { name: '', contact_person: '', phone: '', email: '', address: '', is_active: true };

export default function Index({ suppliers, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const form = useForm(blank);

    useEffect(() => {
        const t = setTimeout(() => {
            if (search === (filters.search || '')) return;
            router.get('/suppliers', { search }, { preserveState: true, replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    const openCreate = () => { setEditing(null); form.setData({ ...blank }); form.clearErrors(); setOpen(true); };
    const openEdit = (s) => {
        setEditing(s);
        form.setData({
            name: s.name, contact_person: s.contact_person || '', phone: s.phone || '',
            email: s.email || '', address: s.address || '', is_active: s.is_active,
        });
        form.clearErrors();
        setOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        const opts = { onSuccess: () => setOpen(false), preserveScroll: true };
        editing ? form.put(`/suppliers/${editing.id}`, opts) : form.post('/suppliers', opts);
    };

    const destroy = (s) => {
        Swal.fire({
            title: 'Delete supplier?', text: `"${s.name}" will be removed.`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Delete',
        }).then((r) => { if (r.isConfirmed) router.delete(`/suppliers/${s.id}`, { preserveScroll: true }); });
    };

    const changePage = (_e, p) =>
        router.get('/suppliers', { search, page: p + 1 }, { preserveState: true, replace: true });

    return (
        <AppLayout title="Suppliers" header={<Typography variant="h6" fontWeight={700}>Suppliers</Typography>}>
            <Paper sx={{ p: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}
                    justifyContent="space-between" alignItems={{ sm: 'center' }} mb={2}>
                    <TextField size="small" label="Search suppliers" value={search}
                        onChange={(e) => setSearch(e.target.value)} sx={{ width: { xs: '100%', sm: 300 } }} />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add Supplier</Button>
                </Stack>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Name</b></TableCell>
                                <TableCell><b>Contact Person</b></TableCell>
                                <TableCell><b>Phone</b></TableCell>
                                <TableCell><b>Email</b></TableCell>
                                <TableCell align="center"><b>Products</b></TableCell>
                                <TableCell align="center"><b>Status</b></TableCell>
                                <TableCell align="right"><b>Actions</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {suppliers.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ border: 0 }}>
                                        <EmptyState icon={<LocalShippingOutlinedIcon />}
                                            title="No suppliers found"
                                            hint={filters.search
                                                ? 'Try a different search.'
                                                : 'Click "Add Supplier" to create your first one.'} />
                                    </TableCell>
                                </TableRow>
                            )}
                            {suppliers.data.map((s) => (
                                <TableRow key={s.id} hover>
                                    <TableCell>{s.name}</TableCell>
                                    <TableCell>{s.contact_person || '—'}</TableCell>
                                    <TableCell>{s.phone || '—'}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{s.email || '—'}</TableCell>
                                    <TableCell align="center">{s.products_count}</TableCell>
                                    <TableCell align="center">
                                        <Chip size="small" label={s.is_active ? 'Active' : 'Inactive'}
                                            color={s.is_active ? 'success' : 'default'} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(s)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => destroy(s)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination component="div" count={suppliers.total}
                    page={suppliers.current_page - 1} rowsPerPage={suppliers.per_page}
                    rowsPerPageOptions={[suppliers.per_page]} onPageChange={changePage} />
            </Paper>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <form onSubmit={submit}>
                    <DialogTitle>
                        {editing ? 'Edit Supplier' : 'Add Supplier'}
                        <DialogCloseButton onClose={() => setOpen(false)} />
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} mt={1}>
                            <TextField label="Name" fullWidth required value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                error={!!form.errors.name} helperText={form.errors.name} />
                            <TextField label="Contact Person" fullWidth value={form.data.contact_person}
                                onChange={(e) => form.setData('contact_person', e.target.value)} />
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField label="Phone" fullWidth value={form.data.phone}
                                    onChange={(e) => form.setData('phone', e.target.value)}
                                    error={!!form.errors.phone} helperText={form.errors.phone} />
                                <TextField label="Email" fullWidth value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    error={!!form.errors.email} helperText={form.errors.email} />
                            </Stack>
                            <TextField label="Address" fullWidth multiline rows={2} value={form.data.address}
                                onChange={(e) => form.setData('address', e.target.value)} />
                            <FormControlLabel
                                control={<Switch checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)} />}
                                label="Active" />
                        </Stack>
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
