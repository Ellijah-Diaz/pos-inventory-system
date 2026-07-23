import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Alert, Button, Checkbox, FormControlLabel, IconButton, InputAdornment,
    Stack, TextField, Typography,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginIcon from '@mui/icons-material/Login';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import AuthShell from '@/Layouts/AuthShell';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '', password: '', remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <AuthShell>
            <Head title="Log in" />

            <Typography variant="h5" fontWeight={800} gutterBottom>Welcome back 👋</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Sign in to your account to continue.
            </Typography>

            {status && <Alert severity="success" sx={{ mb: 2 }}>{status}</Alert>}

            <form onSubmit={submit}>
                <Stack spacing={2.5}>
                    <TextField
                        label="Email" type="email" fullWidth autoFocus autoComplete="username"
                        value={data.email} onChange={(e) => setData('email', e.target.value)}
                        error={!!errors.email} helperText={errors.email}
                        slotProps={{ input: { startAdornment: (
                            <InputAdornment position="start"><EmailOutlinedIcon fontSize="small" /></InputAdornment>
                        ) } }}
                    />
                    <TextField
                        label="Password" type={showPassword ? 'text' : 'password'} fullWidth autoComplete="current-password"
                        value={data.password} onChange={(e) => setData('password', e.target.value)}
                        error={!!errors.password} helperText={errors.password}
                        slotProps={{ input: {
                            startAdornment: (
                                <InputAdornment position="start"><LockOutlinedIcon fontSize="small" /></InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        onClick={() => setShowPassword((v) => !v)}
                                        edge="end" size="small" tabIndex={-1}
                                    >
                                        {showPassword
                                            ? <VisibilityOffOutlinedIcon fontSize="small" />
                                            : <VisibilityOutlinedIcon fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        } }}
                    />

                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <FormControlLabel
                            control={<Checkbox size="small" checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)} />}
                            label={<Typography variant="body2">Remember me</Typography>}
                        />
                        {canResetPassword && (
                            <Typography component={Link} href={route('password.request')}
                                variant="body2" color="primary"
                                sx={{ textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                                Forgot password?
                            </Typography>
                        )}
                    </Stack>

                    <Button type="submit" variant="contained" size="large" fullWidth
                        disabled={processing} startIcon={<LoginIcon />} sx={{ py: 1.2 }}>
                        {processing ? 'Signing in…' : 'Sign In'}
                    </Button>
                </Stack>
            </form>
        </AuthShell>
    );
}
