import { useState } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import {
    Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    Divider, Paper, Stack, TextField, Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockResetIcon from '@mui/icons-material/LockReset';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AppLayout from '@/Layouts/AppLayout';

export default function Edit({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;
    const [deleteOpen, setDeleteOpen] = useState(false);

    const profileForm = useForm({ name: user.name, email: user.email });
    const passwordForm = useForm({ current_password: '', password: '', password_confirmation: '' });
    const deleteForm = useForm({ password: '' });

    const submitProfile = (e) => {
        e.preventDefault();
        profileForm.patch('/profile', { preserveScroll: true });
    };

    const submitPassword = (e) => {
        e.preventDefault();
        passwordForm.put('/password', {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
            onError: () => {
                if (passwordForm.errors.password) passwordForm.reset('password', 'password_confirmation');
                if (passwordForm.errors.current_password) passwordForm.reset('current_password');
            },
        });
    };

    const submitDelete = (e) => {
        e.preventDefault();
        deleteForm.delete('/profile', {
            preserveScroll: true,
            onSuccess: () => setDeleteOpen(false),
        });
    };

    return (
        <AppLayout title="Profile" header={<Typography variant="h6" sx={{ fontWeight: 700 }}>My Profile</Typography>}>
            <Box sx={{ maxWidth: 720, mx: 'auto' }}>

                {/* Account summary */}
                <Paper sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
                        {user.name?.charAt(0)?.toUpperCase()}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography sx={{ fontWeight: 700 }}>{user.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                    </Box>
                    <Chip label={user.role} color={user.role === 'admin' ? 'secondary' : 'default'}
                        sx={{ textTransform: 'capitalize' }} />
                </Paper>

                {/* Profile information */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <PersonIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Profile Information</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                        Update your account's name and email address.
                    </Typography>

                    <form onSubmit={submitProfile}>
                        <Stack spacing={2.5}>
                            <TextField label="Name" fullWidth value={profileForm.data.name}
                                onChange={(e) => profileForm.setData('name', e.target.value)}
                                error={!!profileForm.errors.name} helperText={profileForm.errors.name} />
                            <TextField label="Email" type="email" fullWidth value={profileForm.data.email}
                                onChange={(e) => profileForm.setData('email', e.target.value)}
                                error={!!profileForm.errors.email} helperText={profileForm.errors.email} />

                            {mustVerifyEmail && user.email_verified_at === null && (
                                <Alert severity="warning">
                                    Your email address is unverified.{' '}
                                    <Link href={route('verification.send')} method="post" as="button"
                                        style={{ textDecoration: 'underline', fontWeight: 600 }}>
                                        Resend verification email
                                    </Link>
                                </Alert>
                            )}
                            {status === 'verification-link-sent' && (
                                <Alert severity="success">A new verification link has been sent to your email.</Alert>
                            )}

                            <Box>
                                <Button type="submit" variant="contained" disabled={profileForm.processing}>
                                    Save Changes
                                </Button>
                            </Box>
                        </Stack>
                    </form>
                </Paper>

                {/* Update password */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <LockResetIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Update Password</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                        Use a long, random password to keep your account secure.
                    </Typography>

                    <form onSubmit={submitPassword}>
                        <Stack spacing={2.5}>
                            <TextField label="Current Password" type="password" fullWidth
                                autoComplete="current-password" value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                error={!!passwordForm.errors.current_password}
                                helperText={passwordForm.errors.current_password} />
                            <TextField label="New Password" type="password" fullWidth
                                autoComplete="new-password" value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                error={!!passwordForm.errors.password} helperText={passwordForm.errors.password} />
                            <TextField label="Confirm Password" type="password" fullWidth
                                autoComplete="new-password" value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)} />
                            <Box>
                                <Button type="submit" variant="contained" disabled={passwordForm.processing}>
                                    Update Password
                                </Button>
                            </Box>
                        </Stack>
                    </form>
                </Paper>

                {/* Danger zone */}
                <Paper sx={{ p: 3, border: 1, borderColor: 'error.main' }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <WarningAmberIcon color="error" />
                        <Typography variant="h6" sx={{ fontWeight: 700 }} color="error">Delete Account</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                        Once your account is deleted, all of its data is permanently removed. This cannot be undone.
                    </Typography>
                    <Button color="error" variant="contained" onClick={() => setDeleteOpen(true)}>
                        Delete Account
                    </Button>
                </Paper>
            </Box>

            {/* Delete confirmation dialog */}
            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="xs">
                <form onSubmit={submitDelete}>
                    <DialogTitle>Delete your account?</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            This is permanent. Enter your password to confirm.
                        </Typography>
                        <TextField label="Password" type="password" fullWidth autoFocus
                            value={deleteForm.data.password}
                            onChange={(e) => deleteForm.setData('password', e.target.value)}
                            error={!!deleteForm.errors.password} helperText={deleteForm.errors.password} />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
                        <Button type="submit" color="error" variant="contained" disabled={deleteForm.processing}>
                            Delete Account
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </AppLayout>
    );
}
