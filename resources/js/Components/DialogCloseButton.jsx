import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Standard ✕ button for the top-right corner of every dialog.
 * Place it inside (or right after) <DialogTitle>; it anchors to the
 * dialog paper via absolute positioning.
 */
export default function DialogCloseButton({ onClose }) {
    return (
        <IconButton
            aria-label="Close"
            onClick={onClose}
            size="small"
            sx={{ position: 'absolute', right: 12, top: 12, color: 'text.secondary' }}
        >
            <CloseIcon fontSize="small" />
        </IconButton>
    );
}
