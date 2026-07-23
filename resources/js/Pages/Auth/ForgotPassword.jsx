import { Head, Link, useForm } from '@inertiajs/react';
import {
    Alert, Button, InputAdornment, Stack, TextField, Typography,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AuthShell from '@/Layouts/AuthShell';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <AuthShell>
            <Head title="Forgot Password" />

            <Typography variant="h5" fontWeight={800} gutterBottom>Forgot password? 🔒</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                No problem. Enter your email and we'll send you a link to reset your password.
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

                    <Button type="submit" variant="contained" size="large" fullWidth
                        disabled={processing} startIcon={<SendIcon />} sx={{ py: 1.2 }}>
                        {processing ? 'Sending…' : 'Email Password Reset Link'}
                    </Button>

                    <Button component={Link} href={route('login')} startIcon={<ArrowBackIcon />}
                        color="inherit" sx={{ color: 'text.secondary' }}>
                        Back to sign in
                    </Button>
                </Stack>
            </form>
        </AuthShell>
    );
}
