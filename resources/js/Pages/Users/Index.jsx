import { useEffect, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import {
    Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem,
    Paper, Select, Stack, Switch, Table, TableBody, TableCell, TableContainer,
    TableHead, TablePagination, TableRow, TextField, ToggleButton,
    ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupIcon from '@mui/icons-material/Group';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import Swal from 'sweetalert2';
import AppLayout from '@/Layouts/AppLayout';
import DialogCloseButton from '@/Components/DialogCloseButton';
import EmptyState from '@/Components/EmptyState';

const blank = { name: '', email: '', role: 'cashier', password: '', password_confirmation: '', is_active: true };

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

export default function Index({ users, filters, stats }) {
    const currentUserId = usePage().props.auth.user.id;
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const form = useForm(blank);

    const query = (extra = {}) =>
        router.get('/users', { search, role: role || undefined, ...extra }, { preserveState: true, replace: true });

    useEffect(() => {
        const t = setTimeout(() => {
            if (search === (filters.search || '')) return;
            query();
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => { query(); /* eslint-disable-next-line */ }, [role]);

    const openCreate = () => { setEditing(null); form.setData({ ...blank }); form.clearErrors(); setOpen(true); };
    const openEdit = (u) => {
        setEditing(u);
        form.setData({ name: u.name, email: u.email, role: u.role,
            password: '', password_confirmation: '', is_active: u.is_active });
        form.clearErrors();
        setOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        const opts = { onSuccess: () => setOpen(false), preserveScroll: true };
        editing ? form.put(`/users/${editing.id}`, opts) : form.post('/users', opts);
    };

    const destroy = (u) => {
        Swal.fire({
            title: 'Delete user?', text: `"${u.name}" will lose access.`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Delete',
        }).then((r) => { if (r.isConfirmed) router.delete(`/users/${u.id}`, { preserveScroll: true }); });
    };

    const changePage = (_e, p) => query({ page: p + 1 });

    return (
        <AppLayout title="Users" header={<Typography variant="h6" fontWeight={700}>User Management</Typography>}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}><StatCard icon={<GroupIcon />} label="Total Users" value={stats.total} color="primary" /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><StatCard icon={<AdminPanelSettingsIcon />} label="Admins" value={stats.admins} color="secondary" /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><StatCard icon={<PointOfSaleIcon />} label="Cashiers" value={stats.cashiers} color="success" /></Grid>
            </Grid>

            <Paper sx={{ p: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}
                    justifyContent="space-between" alignItems={{ md: 'center' }} mb={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                        <TextField size="small" label="Search name / email" value={search}
                            onChange={(e) => setSearch(e.target.value)} sx={{ width: { xs: '100%', sm: 260 } }} />
                        <ToggleButtonGroup size="small" exclusive value={role}
                            onChange={(_e, v) => setRole(v ?? '')}>
                            <ToggleButton value="admin">Admins</ToggleButton>
                            <ToggleButton value="cashier">Cashiers</ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add User</Button>
                </Stack>

                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Name</b></TableCell>
                                <TableCell><b>Email</b></TableCell>
                                <TableCell align="center"><b>Role</b></TableCell>
                                <TableCell align="center"><b>Status</b></TableCell>
                                <TableCell align="right"><b>Actions</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} sx={{ border: 0 }}>
                                        <EmptyState icon={<GroupOutlinedIcon />}
                                            title="No users found"
                                            hint={filters.search || filters.role
                                                ? 'Try clearing the search or role filter.'
                                                : 'Click "Add User" to create one.'} />
                                    </TableCell>
                                </TableRow>
                            )}
                            {users.data.map((u) => (
                                <TableRow key={u.id} hover>
                                    <TableCell>
                                        {u.name}
                                        {u.id === currentUserId && <Chip size="small" label="You" sx={{ ml: 1 }} color="primary" variant="outlined" />}
                                    </TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{u.email}</TableCell>
                                    <TableCell align="center">
                                        <Chip size="small" label={u.role === 'admin' ? 'Admin' : 'Cashier'}
                                            color={u.role === 'admin' ? 'secondary' : 'default'}
                                            icon={u.role === 'admin' ? <AdminPanelSettingsIcon /> : <PointOfSaleIcon />} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip size="small" label={u.is_active ? 'Active' : 'Inactive'}
                                            color={u.is_active ? 'success' : 'default'} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(u)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title={u.id === currentUserId ? "You can't delete yourself" : 'Delete'}>
                                            <span>
                                                <IconButton size="small" color="error" disabled={u.id === currentUserId}
                                                    onClick={() => destroy(u)}><DeleteIcon fontSize="small" /></IconButton>
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination component="div" count={users.total}
                    page={users.current_page - 1} rowsPerPage={users.per_page}
                    rowsPerPageOptions={[users.per_page]} onPageChange={changePage} />
            </Paper>

            {/* Create / Edit dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <form onSubmit={submit}>
                    <DialogTitle>
                        {editing ? 'Edit User' : 'Add User'}
                        <DialogCloseButton onClose={() => setOpen(false)} />
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} mt={1}>
                            <TextField label="Full Name" fullWidth required value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                error={!!form.errors.name} helperText={form.errors.name} />
                            <TextField label="Email" type="email" fullWidth required value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                error={!!form.errors.email} helperText={form.errors.email} />
                            <FormControl fullWidth error={!!form.errors.role}>
                                <InputLabel>Role</InputLabel>
                                <Select label="Role" value={form.data.role}
                                    onChange={(e) => form.setData('role', e.target.value)}>
                                    <MenuItem value="cashier">Cashier — POS access only</MenuItem>
                                    <MenuItem value="admin">Admin — full access</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField label={editing ? 'New Password (leave blank to keep)' : 'Password'}
                                type="password" fullWidth required={!editing} value={form.data.password}
                                onChange={(e) => form.setData('password', e.target.value)}
                                error={!!form.errors.password} helperText={form.errors.password}
                                autoComplete="new-password" />
                            <TextField label="Confirm Password" type="password" fullWidth required={!editing}
                                value={form.data.password_confirmation}
                                onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                autoComplete="new-password" />
                            <FormControlLabel
                                control={<Switch checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)} />}
                                label="Active (can sign in)" />
                            {form.errors.is_active && <Typography variant="caption" color="error">{form.errors.is_active}</Typography>}
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
