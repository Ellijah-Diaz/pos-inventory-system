import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Alert, AppBar, Avatar, Box, Collapse, Divider, Drawer, IconButton, List,
    ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Snackbar, Toolbar,
    Tooltip, Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CategoryIcon from '@mui/icons-material/Category';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SummarizeIcon from '@mui/icons-material/Summarize';
import GroupIcon from '@mui/icons-material/Group';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Brand from '@/Components/Brand';
import { ThemeToggle } from '@/ColorMode';

const drawerWidth = 240;
const collapsedWidth = 76;
const SIDEBAR_KEY = 'posify-sidebar-collapsed';

// Grouped nav. A group with a `header` renders a collapsible section.
// `admin: true` (on group or item) means admin-only.
const navGroups = [
    {
        items: [
            { label: 'Dashboard',  href: '/dashboard',           icon: <DashboardIcon /> },
            { label: 'POS',        href: '/pos',                 icon: <PointOfSaleIcon /> },
            { label: 'Sales',      href: '/sales',               icon: <ReceiptLongIcon /> },
            { label: 'End of Day', href: '/reports/end-of-day',  icon: <SummarizeIcon /> },
        ],
    },
    {
        header: 'Master Data',
        admin: true,
        items: [
            { label: 'Products',   href: '/products',   icon: <Inventory2Icon /> },
            { label: 'Categories', href: '/categories', icon: <CategoryIcon /> },
            { label: 'Suppliers',  href: '/suppliers',  icon: <LocalShippingIcon /> },
            { label: 'Stock',      href: '/stock',      icon: <SwapVertIcon /> },
        ],
    },
    {
        header: 'Administration',
        admin: true,
        items: [
            { label: 'Users', href: '/users', icon: <GroupIcon /> },
        ],
    },
];

export default function AppLayout({ title = '', header = null, children }) {
    const { auth, flash } = usePage().props;
    const { url } = usePage();
    const user = auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [snack, setSnack] = useState(null);
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(SIDEBAR_KEY) === 'true';
    });

    const toggleCollapse = () => setCollapsed((c) => {
        const next = !c;
        localStorage.setItem(SIDEBAR_KEY, String(next));
        return next;
    });

    // width of the desktop sidebar; mobile drawer is always full width
    const sideWidth = collapsed ? collapsedWidth : drawerWidth;

    // Show a theme-aware Snackbar on flash messages (create / update / delete)
    useEffect(() => {
        if (flash?.success) setSnack({ severity: 'success', message: flash.success });
        else if (flash?.error) setSnack({ severity: 'error', message: flash.error });
    }, [flash]);

    const isAdmin = user?.role === 'admin';
    const visibleGroups = navGroups
        .filter((g) => !g.admin || isAdmin)
        .map((g) => ({ ...g, items: g.items.filter((i) => !i.admin || isAdmin) }))
        .filter((g) => g.items.length > 0);

    // The header of the group that contains the current route (null if the
    // active page sits outside every group, e.g. Dashboard / POS / Sales).
    const activeGroupHeader = visibleGroups
        .find((g) => g.header && g.items.some((i) => url.startsWith(i.href)))?.header ?? null;

    // Accordion: only one group open at a time. It auto-syncs to the active
    // group on navigation — selecting a module outside a group minimizes them all.
    const [openGroup, setOpenGroup] = useState(activeGroupHeader);
    useEffect(() => { setOpenGroup(activeGroupHeader); }, [activeGroupHeader]);

    const isGroupOpen = (header) => openGroup === header;
    const toggleGroup = (header) => setOpenGroup((prev) => (prev === header ? null : header));

    const renderItem = (item, mini) => {
        const active = url.startsWith(item.href);
        return (
            <Tooltip key={item.href} title={mini ? item.label : ''} placement="right">
                <ListItemButton
                    component={Link}
                    href={item.href}
                    selected={active}
                    sx={{
                        borderRadius: 2, mb: 0.5, minHeight: 44,
                        justifyContent: mini ? 'center' : 'flex-start',
                        px: mini ? 1.5 : 2,
                        '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText',
                            '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                            '&:hover': { bgcolor: 'primary.dark' } },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: mini ? 0 : 2, justifyContent: 'center' }}>
                        {item.icon}
                    </ListItemIcon>
                    {!mini && <ListItemText primary={item.label} />}
                </ListItemButton>
            </Tooltip>
        );
    };

    // `mini` = icon-only mode (desktop collapsed). Mobile drawer always passes false.
    const drawerContent = (mini) => (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{ px: mini ? 1 : 2, justifyContent: mini ? 'center' : 'flex-start' }}>
                <Brand size={36} showText={!mini} />
            </Toolbar>
            <Divider />
            <List sx={{ px: 1, flexGrow: 1 }}>
                {visibleGroups.map((group, gi) => {
                    // Collapsed sidebar: flat icons, a divider between groups
                    if (mini) {
                        return (
                            <Box key={group.header || gi}>
                                {gi > 0 && <Divider sx={{ my: 1, mx: 1 }} />}
                                {group.items.map((item) => renderItem(item, true))}
                            </Box>
                        );
                    }
                    // Full sidebar, no header: render items directly
                    if (!group.header) {
                        return <Box key={gi}>{group.items.map((item) => renderItem(item, false))}</Box>;
                    }
                    // Full sidebar, collapsible section
                    const open = isGroupOpen(group.header);
                    return (
                        <Box key={group.header}>
                            <ListItemButton onClick={() => toggleGroup(group.header)}
                                sx={{ borderRadius: 2, mt: 1, mb: 0.5, py: 0.25 }}>
                                <Typography variant="overline"
                                    sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1, color: 'text.secondary' }}>
                                    {group.header}
                                </Typography>
                                {open ? <ExpandLess fontSize="small" sx={{ color: 'text.secondary' }} />
                                      : <ExpandMore fontSize="small" sx={{ color: 'text.secondary' }} />}
                            </ListItemButton>
                            <Collapse in={open} timeout="auto" unmountOnExit>
                                {group.items.map((item) => renderItem(item, false))}
                            </Collapse>
                        </Box>
                    );
                })}
            </List>
            <Divider />
            {!mini && (
                <Box sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        Signed in as <b>{user?.role}</b>
                    </Typography>
                </Box>
            )}
        </Box>
    );

    return (
        <>
            <Head title={title} />
            <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>

                <AppBar
                    position="fixed"
                    color="inherit"
                    sx={{
                        width: { sm: `calc(100% - ${sideWidth}px)` }, ml: { sm: `${sideWidth}px` },
                        bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', boxShadow: 'none',
                        transition: (t) => t.transitions.create(['width', 'margin'], {
                            easing: t.transitions.easing.sharp, duration: t.transitions.duration.enteringScreen }),
                    }}
                >
                    <Toolbar>
                        {/* Mobile: open drawer. Desktop: collapse/expand sidebar. */}
                        <IconButton color="inherit" edge="start"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            sx={{ mr: 2, display: { sm: 'none' } }}>
                            <MenuIcon />
                        </IconButton>
                        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                            <IconButton color="inherit" edge="start" onClick={toggleCollapse}
                                sx={{ mr: 2, display: { xs: 'none', sm: 'inline-flex' } }}>
                                <MenuOpenIcon sx={{ transform: collapsed ? 'rotate(180deg)' : 'none',
                                    transition: (t) => t.transitions.create('transform') }} />
                            </IconButton>
                        </Tooltip>
                        <Box sx={{ flexGrow: 1 }}>{header}</Box>
                        <ThemeToggle sx={{ mr: 0.5 }} />
                        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main' }}>
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                        </IconButton>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                            <MenuItem disabled>
                                <Typography variant="body2"><b>{user?.name}</b><br />{user?.email}</Typography>
                            </MenuItem>
                            <Divider />
                            <MenuItem component={Link} href="/profile" onClick={() => setAnchorEl(null)}>
                                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon> Profile
                            </MenuItem>
                            <MenuItem onClick={() => router.post('/logout')}>
                                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon> Log Out
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>

                <Box component="nav" sx={{ width: { sm: sideWidth }, flexShrink: { sm: 0 },
                    transition: (t) => t.transitions.create('width', { duration: t.transitions.duration.enteringScreen }) }}>
                    <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
                        ModalProps={{ keepMounted: true }}
                        sx={{ display: { xs: 'block', sm: 'none' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
                        {drawerContent(false)}
                    </Drawer>
                    <Drawer variant="permanent" open
                        sx={{ display: { xs: 'none', sm: 'block' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: sideWidth, overflowX: 'hidden',
                                transition: (t) => t.transitions.create('width', {
                                    easing: t.transitions.easing.sharp, duration: t.transitions.duration.enteringScreen }) } }}>
                        {drawerContent(collapsed)}
                    </Drawer>
                </Box>

                <Box component="main"
                    sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${sideWidth}px)` },
                        transition: (t) => t.transitions.create('width', {
                            easing: t.transitions.easing.sharp, duration: t.transitions.duration.enteringScreen }) }}>
                    <Toolbar />
                    {children}
                </Box>
            </Box>

            {/* Flash notifications — theme-aware, sits below the app bar */}
            <Snackbar
                open={!!snack}
                autoHideDuration={3000}
                onClose={() => setSnack(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ mt: 7 }}
            >
                <Alert onClose={() => setSnack(null)} severity={snack?.severity || 'success'}
                    variant="filled" sx={{ width: '100%', boxShadow: 3 }}>
                    {snack?.message}
                </Alert>
            </Snackbar>
        </>
    );
}
