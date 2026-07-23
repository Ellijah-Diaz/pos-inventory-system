import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    Button, IconButton, InputAdornment, Stack, TextField, Typography,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LockResetIcon from '@mui/icons-material/LockReset';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import AuthShell from '@/Layouts/AuthShell';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const eyeAdornment = (
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
    );

    return (
        <AuthShell>
            <Head title="Reset Password" />

            <Typography variant="h5" fontWeight={800} gutterBottom>Set a new password 🔑</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Choose a strong password for your account.
            </Typography>

            <form onSubmit={submit}>
                <Stack spacing={2.5}>
                    <TextField
                        label="Email" type="email" fullWidth autoComplete="username"
                        value={data.email} onChange={(e) => setData('email', e.target.value)}
                        error={!!errors.email} helperText={errors.email}
                        slotProps={{ input: { startAdornment: (
                            <InputAdornment position="start"><EmailOutlinedIcon fontSize="small" /></InputAdornment>
                        ) } }}
                    />
                    <TextField
                        label="New password" type={showPassword ? 'text' : 'password'} fullWidth
                        autoFocus autoComplete="new-password"
                        value={data.password} onChange={(e) => setData('password', e.target.value)}
                        error={!!errors.password} helperText={errors.password}
                        slotProps={{ input: {
                            startAdornment: (
                                <InputAdornment position="start"><LockOutlinedIcon fontSize="small" /></InputAdornment>
                            ),
                            endAdornment: eyeAdornment,
                        } }}
                    />
                    <TextField
                        label="Confirm new password" type={showPassword ? 'text' : 'password'} fullWidth
                        autoComplete="new-password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        error={!!errors.password_confirmation} helperText={errors.password_confirmation}
                        slotProps={{ input: { startAdornment: (
                            <InputAdornment position="start"><LockOutlinedIcon fontSize="small" /></InputAdornment>
                        ) } }}
                    />

                    <Button type="submit" variant="contained" size="large" fullWidth
                        disabled={processing} startIcon={<LockResetIcon />} sx={{ py: 1.2 }}>
                        {processing ? 'Saving…' : 'Reset Password'}
                    </Button>
                </Stack>
            </form>
        </AuthShell>
    );
}
