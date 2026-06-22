// Supabase Client Initialization Configuration
// Replace these placeholders with your actual keys from Supabase Dashboard -> Settings -> API
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabaseClient = null;

if (typeof supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized successfully.');
} else {
    console.warn('Supabase CDN SDK is not loaded or credentials placeholder is not replaced.');
}

// ==========================================
// Database Helpers (Supabase Query wrapper)
// ==========================================

// 1. Fetch Companies
async function dbFetchCompanies() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
        .from('companies')
        .select('*')
        .order('id', { ascending: true });
    if (error) {
        console.error('Error fetching companies:', error);
        return [];
    }
    return data;
}

// 2. Fetch Ledgers
async function dbFetchLedgers(companyId = 1) {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
        .from('ledgers')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });
    if (error) {
        console.error('Error fetching ledgers:', error);
        return [];
    }
    // Map to frontend expected names
    return data.map(l => ({
        id: l.id,
        name: l.name,
        group: l.group_name,
        gstin: l.gstin || 'N/A',
        state: l.state || 'N/A',
        balance: parseFloat(l.balance),
        type: l.type
    }));
}

// 3. Create Ledger
async function dbCreateLedger(ledger) {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient
        .from('ledgers')
        .insert([{
            company_id: ledger.company_id || 1,
            name: ledger.name,
            group_name: ledger.group,
            gstin: ledger.gstin,
            state: ledger.state,
            balance: ledger.balance || 0,
            type: ledger.type || 'Dr'
        }])
        .select();
    if (error) {
        console.error('Error creating ledger:', error);
        return null;
    }
    return data[0];
}

// 4. Fetch Stock Items
async function dbFetchStockItems(companyId = 1) {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
        .from('stock_items')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });
    if (error) {
        console.error('Error fetching stock items:', error);
        return [];
    }
    return data.map(item => ({
        name: item.name,
        sku: item.sku,
        category: 'Electronics', 
        qty: item.qty,
        minQty: 10,
        unit: 'pcs',
        purchase: parseFloat(item.rate) * 0.8, 
        selling: parseFloat(item.rate),
        gst: parseFloat(item.gst_rate)
    }));
}

// 5. Create Stock Item
async function dbCreateStockItem(item) {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient
        .from('stock_items')
        .insert([{
            company_id: item.company_id || 1,
            name: item.name,
            sku: item.sku,
            rate: item.selling,
            gst_rate: item.gst,
            qty: item.qty || 0
        }])
        .select();
    if (error) {
        console.error('Error creating stock item:', error);
        return null;
    }
    return data[0];
}

// 6. Fetch Vouchers
async function dbFetchVouchers(companyId = 1) {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
        .from('vouchers')
        .select('*')
        .eq('company_id', companyId)
        .order('date', { ascending: false });
    if (error) {
        console.error('Error fetching vouchers:', error);
        return [];
    }
    return data;
}

// 7. Create Voucher
async function dbCreateVoucher(voucher) {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient
        .from('vouchers')
        .insert([{
            company_id: voucher.company_id || 1,
            voucher_no: voucher.voucher_no,
            date: voucher.date,
            type: voucher.type,
            party_name: voucher.party_name,
            amount: voucher.amount,
            status: voucher.status,
            details: voucher.details || {}
        }])
        .select();
    if (error) {
        console.error('Error creating voucher:', error);
        return null;
    }
    return data[0];
}

// ==========================================================
// Unified Sidebar Collapse & Active State Synchronization
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar Active State Synchronization
    const activePath = window.location.pathname.split('/').pop() || 'index.html';
    const linkMap = {
        'ledger.html': 'nav-ledgers',
        'inventory.html': 'nav-inventory',
        'index.html': 'nav-dashboard',
        'sales-voucher.html': 'nav-sales',
        'purchase-voucher.html': 'nav-purchase',
        'receipt-voucher.html': 'nav-receipt',
        'payment-voucher.html': 'nav-payment',
        'contra-voucher.html': 'nav-contra',
        'journal-voucher.html': 'nav-journal',
        'credit-note.html': 'nav-credit',
        'debit-note.html': 'nav-debit',
        'reports.html': 'nav-reports',
        'gst-settings.html': 'nav-gst',
        'user-roles.html': 'nav-roles'
    };

    // Remove active styles from all links first to prevent duplication
    Object.values(linkMap).forEach(id => {
        const link = document.getElementById(id);
        if (link) {
            link.className = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-gray-800 hover:translate-x-1 transition-all duration-200 group";
            const icon = link.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.className = "material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary transition-colors";
            }
        }
    });

    const activeId = linkMap[activePath];
    if (activeId) {
        const activeLink = document.getElementById(activeId);
        if (activeLink) {
            activeLink.className = "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-indigo-300 font-semibold border-l-4 border-secondary shadow-sm transition-all duration-200 group relative";
            const icon = activeLink.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.className = "material-symbols-outlined text-[20px] text-primary dark:text-indigo-300 icon-fill";
            }
        }
    }

    // 2. Unified Sidebar Collapse Logic
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle') || document.getElementById('toggle-sidebar');
    const sidebarTexts = document.querySelectorAll('.sidebar-text');
    
    if (sidebar && toggleBtn) {
        // Sync button ID to sidebarToggle if it is toggle-sidebar
        if (toggleBtn.id === 'toggle-sidebar') {
            toggleBtn.id = 'sidebarToggle';
        }
        
        let isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        
        function applyCollapse(collapsed) {
            if (collapsed) {
                sidebar.classList.remove('w-[280px]');
                sidebar.classList.add('w-[80px]');
                sidebarTexts.forEach(el => el.classList.add('opacity-0', 'w-0', 'hidden'));
                toggleBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">menu</span>';
            } else {
                sidebar.classList.remove('w-[80px]');
                sidebar.classList.add('w-[280px]');
                sidebarTexts.forEach(el => el.classList.remove('opacity-0', 'w-0', 'hidden'));
                toggleBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">menu_open</span>';
            }
        }
        
        // Initial apply
        applyCollapse(isCollapsed);
        
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isCollapsed = !isCollapsed;
            localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
            applyCollapse(isCollapsed);
        });
    }
});

// Global command palette toggle helper
window.toggleCommandPalette = function() {
    const cp = document.getElementById('commandPalette');
    if (cp) {
        const inner = document.getElementById('commandModalInner');
        const isOpen = cp.classList.contains('flex');
        if (isOpen) {
            inner?.classList.remove('scale-100', 'opacity-100');
            inner?.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                cp.classList.add('hidden');
                cp.classList.remove('flex');
            }, 200);
        } else {
            cp.classList.remove('hidden');
            cp.classList.add('flex');
            setTimeout(() => {
                inner?.classList.remove('scale-95', 'opacity-0');
                inner?.classList.add('scale-100', 'opacity-100');
                cp.querySelector('input')?.focus();
            }, 10);
        }
    } else {
        const searchInput = document.querySelector('header input');
        if (searchInput) {
            searchInput.focus();
        }
    }
};

