import { Box, Button, Dialog, DialogActions, DialogContent, Divider, Stack, Typography } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const peso = (n) => '₱' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Builds a plain-HTML receipt and prints it via a hidden iframe (reliable across browsers).
function printReceipt(sale) {
    const rows = sale.items.map((i) =>
        `<tr><td>${i.name}<br><span class="muted">${i.quantity} x ${peso(i.price)}</span></td>
         <td class="r">${peso(i.subtotal)}</td></tr>`).join('');

    const itemCount = sale.items.reduce((s, i) => s + i.quantity, 0);

    const html = `
    <html><head><title>${sale.invoice_number}</title><style>
      /* 80mm thermal receipt — printable area ~72mm */
      @page { size: 80mm auto; margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Courier New', monospace; font-size: 12px; color: #000;
        width: 72mm; margin: 0 auto; padding: 4mm 2mm 6mm;
      }
      .c { text-align: center; } .r { text-align: right; }
      .muted { color: #444; font-size: 11px; }
      .store { font-size: 15px; font-weight: bold; letter-spacing: 1px; }
      .meta td { padding: 0; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 2px 0; vertical-align: top; }
      hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
      .totals td { padding: 1px 0; }
      .grand td { font-size: 14px; font-weight: bold; padding: 3px 0; }
      .foot { margin-top: 6px; font-size: 11px; }
    </style></head><body>
      <div class="c">
        <div class="store">POSify Store</div>
        <div class="muted">123 Market St, Manila<br>Tel: (02) 8000-0000</div>
      </div>
      <hr>
      <table class="meta">
        <tr><td>Invoice</td><td class="r">${sale.invoice_number}</td></tr>
        <tr><td>Date</td><td class="r">${sale.created_at}</td></tr>
        <tr><td>Cashier</td><td class="r">${sale.cashier || '-'}</td></tr>
      </table>
      <hr>
      <table>${rows}</table>
      <hr>
      <table class="totals">
        <tr><td>Items</td><td class="r">${itemCount}</td></tr>
        <tr><td>Subtotal</td><td class="r">${peso(sale.subtotal)}</td></tr>
        ${sale.discount > 0 ? `<tr><td>Discount</td><td class="r">-${peso(sale.discount)}</td></tr>` : ''}
      </table>
      <table class="totals grand">
        <tr><td>TOTAL</td><td class="r">${peso(sale.total)}</td></tr>
      </table>
      <table class="totals">
        <tr><td>Paid (${(sale.payment_method || '').toUpperCase()})</td><td class="r">${peso(sale.amount_paid)}</td></tr>
        <tr><td>Change</td><td class="r">${peso(sale.change)}</td></tr>
      </table>
      <hr>
      <div class="c foot">
        Thank you for shopping!<br>
        This serves as your official receipt.<br>
        — Customer Copy —
      </div>
    </body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
}

export default function Receipt({ sale, open, onClose }) {
    if (!sale) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogContent>
                <Stack alignItems="center" spacing={1} mb={1}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
                    <Typography variant="h6" fontWeight={700}>Payment Successful</Typography>
                    <Typography variant="body2" color="text.secondary">{sale.invoice_number}</Typography>
                </Stack>

                <Divider sx={{ my: 1 }} />

                <Stack spacing={0.5}>
                    {sale.items.map((i, idx) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{i.quantity} × {i.name}</Typography>
                            <Typography variant="body2">{peso(i.subtotal)}</Typography>
                        </Box>
                    ))}
                </Stack>

                <Divider sx={{ my: 1 }} />

                <Stack spacing={0.5}>
                    <Row label="Subtotal" value={peso(sale.subtotal)} />
                    {sale.discount > 0 && <Row label="Discount" value={`-${peso(sale.discount)}`} />}
                    <Row label="Total" value={peso(sale.total)} bold />
                    <Row label={`Paid (${sale.payment_method})`} value={peso(sale.amount_paid)} />
                    <Row label="Change" value={peso(sale.change)} bold color="success.main" />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button startIcon={<PrintIcon />} onClick={() => printReceipt(sale)}>Print</Button>
                <Button variant="contained" onClick={onClose}>New Sale</Button>
            </DialogActions>
        </Dialog>
    );
}

function Row({ label, value, bold, color }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight={bold ? 700 : 400}>{label}</Typography>
            <Typography variant="body2" fontWeight={bold ? 700 : 400} color={color}>{value}</Typography>
        </Box>
    );
}
