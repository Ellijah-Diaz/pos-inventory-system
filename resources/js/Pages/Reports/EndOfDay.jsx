import { router, usePage } from '@inertiajs/react';
import {
    Box, Button, Chip, Divider, MenuItem, Paper, Stack, Table, TableBody,
    TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PaidIcon from '@mui/icons-material/Paid';
import DiscountIcon from '@mui/icons-material/Discount';
import SavingsIcon from '@mui/icons-material/Savings';
import BlockIcon from '@mui/icons-material/Block';
import AppLayout from '@/Layouts/AppLayout';

const peso = (n) => '₱' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Stat({ icon, label, value, color = 'primary' }) {
    return (
        <Paper sx={{ p: 2, flex: 1, minWidth: 170, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: `${color}.main`, color: `${color}.contrastText`, p: 1.2, borderRadius: 2, display: 'flex' }}>{icon}</Box>
            <Box>
                <Typography variant="h6" fontWeight={700}>{value}</Typography>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
            </Box>
        </Paper>
    );
}

// Print a Z-reading in the same 80mm thermal format as the receipt.
function printZReading({ date, report, cashierName }) {
    const methodRows = Object.entries(report.methods)
        .filter(([, m]) => m.count > 0)
        .map(([name, m]) =>
            `<tr><td>${name.toUpperCase()} (${m.count})</td><td class="r">${peso(m.amount)}</td></tr>`)
        .join('') || '<tr><td colspan="2" class="c muted">No sales</td></tr>';

    const html = `
    <html><head><title>Z-Reading ${date}</title><style>
      @page { size: 80mm auto; margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; font-size: 12px; color: #000;
             width: 72mm; margin: 0 auto; padding: 4mm 2mm 6mm; }
      .c { text-align: center; } .r { text-align: right; }
      .muted { color: #444; font-size: 11px; }
      .store { font-size: 15px; font-weight: bold; letter-spacing: 1px; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 2px 0; vertical-align: top; }
      hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
      .grand td { font-size: 14px; font-weight: bold; padding: 3px 0; }
    </style></head><body>
      <div class="c">
        <div class="store">POSify Store</div>
        <div class="muted">123 Market St, Manila</div>
        <div style="margin-top:4px; font-weight:bold;">*** Z-READING ***</div>
      </div>
      <hr>
      <table>
        <tr><td>Date</td><td class="r">${date}</td></tr>
        <tr><td>Cashier</td><td class="r">${cashierName}</td></tr>
        <tr><td>First Inv.</td><td class="r">${report.first_invoice || '-'}</td></tr>
        <tr><td>Last Inv.</td><td class="r">${report.last_invoice || '-'}</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>Transactions</td><td class="r">${report.transactions}</td></tr>
        <tr><td>Items Sold</td><td class="r">${report.items_sold}</td></tr>
        <tr><td>Gross Sales</td><td class="r">${peso(report.gross)}</td></tr>
        <tr><td>Discounts</td><td class="r">-${peso(report.discounts)}</td></tr>
      </table>
      <table class="grand"><tr><td>NET SALES</td><td class="r">${peso(report.net)}</td></tr></table>
      <hr>
      <div style="font-weight:bold;">PAYMENT BREAKDOWN</div>
      <table>${methodRows}</table>
      <hr>
      <table class="grand"><tr><td>CASH IN DRAWER</td><td class="r">${peso(report.cash_drawer)}</td></tr></table>
      <table>
        <tr><td>Voided (${report.voided_count})</td><td class="r">${peso(report.voided_amount)}</td></tr>
      </table>
      <hr>
      <div class="c muted">Generated ${new Date().toLocaleString()}<br>— End of Report —</div>
    </body></html>`;

    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, { position: 'fixed', right: 0, bottom: 0, width: 0, height: 0, border: 0 });
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open(); doc.write(html); doc.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
}

export default function EndOfDay({ date, cashiers, selectedCashier, report }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.role === 'admin';

    const apply = (params) =>
        router.get('/reports/end-of-day', params, { preserveState: true, replace: true });

    const cashierName = isAdmin
        ? (cashiers.find((c) => c.id === selectedCashier)?.name ?? 'All cashiers')
        : auth.user.name;

    const methodLabels = { cash: 'Cash', card: 'Card', gcash: 'GCash', other: 'Other' };

    return (
        <AppLayout title="End of Day" header={<Typography variant="h6" fontWeight={700}>End of Day (Z-Reading)</Typography>}>
            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                    <TextField size="small" type="date" label="Date"
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={date}
                        onChange={(e) => apply({ date: e.target.value, user_id: selectedCashier || undefined })} />
                    {isAdmin && (
                        <TextField size="small" select label="Cashier" sx={{ minWidth: 200 }}
                            value={selectedCashier || 0}
                            onChange={(e) => apply({ date, user_id: e.target.value || undefined })}>
                            <MenuItem value={0}>All cashiers</MenuItem>
                            {cashiers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </TextField>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button variant="contained" startIcon={<PrintIcon />}
                        onClick={() => printZReading({ date, report, cashierName })}>
                        Print Z-Reading
                    </Button>
                </Stack>
            </Paper>

            {/* Stat cards */}
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Stat icon={<PointOfSaleIcon />} label="Transactions" value={report.transactions} color="primary" />
                <Stat icon={<PaidIcon />} label="Net Sales" value={peso(report.net)} color="success" />
                <Stat icon={<DiscountIcon />} label="Discounts" value={peso(report.discounts)} color="secondary" />
                <Stat icon={<SavingsIcon />} label="Cash in Drawer" value={peso(report.cash_drawer)} color="info" />
                <Stat icon={<BlockIcon />} label={`Voided (${report.voided_count})`} value={peso(report.voided_amount)} color="error" />
            </Stack>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start' }}>
                {/* Payment breakdown */}
                <Paper sx={{ p: 2, flex: 1, width: '100%' }}>
                    <Typography fontWeight={700} sx={{ mb: 1 }}>Payment Breakdown</Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Method</b></TableCell>
                                <TableCell align="center"><b>Transactions</b></TableCell>
                                <TableCell align="right"><b>Amount</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(report.methods).map(([key, m]) => (
                                <TableRow key={key}>
                                    <TableCell><Chip size="small" variant="outlined" label={methodLabels[key]} /></TableCell>
                                    <TableCell align="center">{m.count}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: m.amount > 0 ? 700 : 400 }}>
                                        {peso(m.amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>{report.transactions}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{peso(report.net)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Paper>

                {/* Day summary */}
                <Paper sx={{ p: 2, width: { xs: '100%', md: 360 }, flexShrink: 0 }}>
                    <Typography fontWeight={700} sx={{ mb: 1 }}>Day Summary — {cashierName}</Typography>
                    <Divider sx={{ mb: 1.5 }} />
                    <Stack spacing={1}>
                        <Row label="Gross sales" value={peso(report.gross)} />
                        <Row label="Discounts" value={`-${peso(report.discounts)}`} />
                        <Row label="Net sales" value={peso(report.net)} bold />
                        <Divider />
                        <Row label="Items sold" value={report.items_sold} />
                        <Row label="First invoice" value={report.first_invoice || '—'} mono />
                        <Row label="Last invoice" value={report.last_invoice || '—'} mono />
                        <Divider />
                        <Row label={`Voided sales (${report.voided_count})`} value={peso(report.voided_amount)} />
                    </Stack>
                </Paper>
            </Box>
        </AppLayout>
    );
}

function Row({ label, value, bold, mono }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color={bold ? 'text.primary' : 'text.secondary'} fontWeight={bold ? 700 : 400}>
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={bold ? 700 : 400}
                sx={mono ? { fontFamily: 'monospace' } : {}}>
                {value}
            </Typography>
        </Box>
    );
}
