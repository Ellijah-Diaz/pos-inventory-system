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
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import Swal from 'sweetalert2';
import AppLayout from '@/Layouts/AppLayout';
import EmptyState from '@/Components/EmptyState';

export default function Index({ categories, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const form = useForm({ name: '', description: '', is_active: true });

    // Debounced server-side search
    useEffect(() => {
        const t = setTimeout(() => {
            if (search === (filters.search || '')) return;
            router.get('/categories', { search }, { preserveState: true, replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    const openCreate = () => {
        setEditing(null);
        form.setData({ name: '', description: '', is_active: true });
        form.clearErrors();
        setOpen(true);
    };

    const openEdit = (cat) => {
        setEditing(cat);
        form.setData({ name: cat.name, description: cat.description || '', is_active: cat.is_active });
        form.clearErrors();
        setOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        const opts = { onSuccess: () => setOpen(false), preserveScroll: true };
        editing
            ? form.put(`/categories/${editing.id}`, opts)
            : form.post('/categories', opts);
    };

    const destroy = (cat) => {
        Swal.fire({
            title: 'Delete category?',
            text: `"${cat.name}" will be removed.`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626',
            confirmButtonText: 'Delete',
        }).then((r) => {
            if (r.isConfirmed) router.delete(`/categories/${cat.id}`, { preserveScroll: true });
        });
    };

    const changePage = (_e, newPage) =>
        router.get('/categories', { search, page: newPage + 1 }, { preserveState: true, replace: true });

    return (
        <AppLayout
            title="Categories"
            header={<Typography variant="h6" fontWeight={700}>Categories</Typography>}
        >
            <Paper sx={{ p: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}
                    justifyContent="space-between" alignItems={{ sm: 'center' }} mb={2}>
                    <TextField size="small" label="Search categories" value={search}
                        onChange={(e) => setSearch(e.target.value)} sx={{ width: { xs: '100%', sm: 300 } }} />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                        Add Category
                    </Button>
                </Stack>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Name</b></TableCell>
                                <TableCell><b>Description</b></TableCell>
                                <TableCell align="center"><b>Products</b></TableCell>
                                <TableCell align="center"><b>Status</b></TableCell>
                                <TableCell align="right"><b>Actions</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {categories.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} sx={{ border: 0 }}>
                                        <EmptyState icon={<CategoryOutlinedIcon />}
                                            title="No categories found"
                                            hint={filters.search
                                                ? 'Try a different search.'
                                                : 'Click "Add Category" to create your first one.'} />
                                    </TableCell>
                                </TableRow>
                            )}
                            {categories.data.map((cat) => (
                                <TableRow key={cat.id} hover>
                                    <TableCell>{cat.name}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{cat.description || '—'}</TableCell>
                                    <TableCell align="center">{cat.products_count}</TableCell>
                                    <TableCell align="center">
                                        <Chip size="small" label={cat.is_active ? 'Active' : 'Inactive'}
                                            color={cat.is_active ? 'success' : 'default'} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Edit">
                                            <IconButton size="small" onClick={() => openEdit(cat)}><EditIcon fontSize="small" /></IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" onClick={() => destroy(cat)}><DeleteIcon fontSize="small" /></IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination component="div" count={categories.total}
                    page={categories.current_page - 1} rowsPerPage={categories.per_page}
                    rowsPerPageOptions={[categories.per_page]} onPageChange={changePage} />
            </Paper>

            {/* Create / Edit dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <form onSubmit={submit}>
                    <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} mt={1}>
                            <TextField label="Name" fullWidth required value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                error={!!form.errors.name} helperText={form.errors.name} />
                            <TextField label="Description" fullWidth multiline rows={3}
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)} />
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
