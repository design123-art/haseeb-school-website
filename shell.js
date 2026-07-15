// ============================================================
// shell.js — injects the shared sidebar + topbar markup so it
// only has to be maintained in one place.
// ============================================================

const NAV_ITEMS = [
  { group: 'Overview', links: [
    { href: 'dashboard.html', num: '•', label: 'Dashboard' }
  ]},
  { group: 'Students', links: [
    { href: 'new-student.html', num: '1', label: 'New Student' },
    { href: 'edit-student.html', num: '2', label: 'Edit Student' },
    { href: 'search-student.html', num: '5', label: 'Search Student' }
  ]},
  { group: 'Fees', links: [
    { href: 'fee-slip.html', num: '3', label: 'Fee Slip / Status' },
    { href: 'pay-fee.html', num: '4', label: 'Pay Fee' },
    { href: 'defaulter-list.html', num: '!', label: 'Defaulter List' }
  ]},
  { group: 'Academics', links: [
    { href: 'promotion.html', num: '6', label: 'Change Section / Promotion' },
    { href: 'class-management.html', num: '7', label: 'Class Management' },
    { href: 'result-management.html', num: '8', label: 'Result Management' }
  ]},
  { group: 'System', links: [
    { href: 'backup.html', num: '⇩', label: 'Database Backup' }
  ]}
];

export function renderShell({ title, breadcrumb }){
  const sidebarMount = document.getElementById('sidebar-mount');
  const topbarMount = document.getElementById('topbar-mount');

  if (sidebarMount){
    let groups = NAV_ITEMS.map(g => `
      <div class="nav-group-label">${g.group}</div>
      ${g.links.map(l => `
        <a href="${l.href}" class="nav-link">
          <span class="num">${l.num}</span><span>${l.label}</span>
        </a>
      `).join('')}
    `).join('');

    sidebarMount.outerHTML = `
      <aside class="sidebar" id="sidebar-mount">
        <div class="sidebar-brand">
          <div class="mark">HS</div>
          <div>
            <div class="name">Haseeb School</div>
            <div class="role">Management System</div>
          </div>
        </div>
        <nav>${groups}</nav>
        <div class="sidebar-foot">
          <a href="dashboard.html" class="nav-link" style="opacity:.8;">
            <span class="num">←</span><span>Back to Dashboard</span>
          </a>
        </div>
      </aside>
    `;
  }

  if (topbarMount){
    topbarMount.outerHTML = `
      <header class="topbar" id="topbar-mount">
        <div style="display:flex;align-items:center;">
          <button class="menu-toggle" aria-label="Menu">☰</button>
          <div>
            <h2>${title || ''}</h2>
            <div class="breadcrumb">${breadcrumb || ''}</div>
          </div>
        </div>
        <div class="session-pill" data-session-pill></div>
      </header>
    `;
  }
}
