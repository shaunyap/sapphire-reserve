// CSR Value Maxxer - App Logic

// Default System Perks: Full suite of 2026 CSR Perks
const DEFAULT_PERKS = [
  { id: 'travel-credit', name: 'Annual Travel Credit', type: 'toggle', unitFaceValue: 300, faceValue: 300, personalValue: 300, active: false, isSystem: true },
  { id: 'the-edit', name: '"The Edit" Hotel Credits (up to 2x)', type: 'counter', unitFaceValue: 250, count: 0, maxCount: 2, faceValue: 0, personalValue: 0, isSystem: true },
  { id: 'hotel-credit', name: 'Chase Travel Hotel Credit', type: 'toggle', unitFaceValue: 250, faceValue: 250, personalValue: 100, active: false, isSystem: true },
  { id: 'dining-credit', name: 'Sapphire Dining Credit (Exclusive Tables, 2x $150)', type: 'counter', unitFaceValue: 150, count: 0, maxCount: 2, faceValue: 0, personalValue: 0, isSystem: true },
  { id: 'priority-pass', name: 'Priority Pass Lounge Access (Visits)', type: 'counter', unitFaceValue: 35, count: 0, maxCount: 50, faceValue: 0, personalValue: 0, isSystem: true },
  { id: 'global-entry', name: 'TSA PreCheck / Global Entry Credit', type: 'toggle', unitFaceValue: 30, faceValue: 30, personalValue: 30, active: false, isSystem: true },
  { id: 'doordash-pass', name: 'DoorDash DashPass Subscription', type: 'toggle', unitFaceValue: 120, faceValue: 120, personalValue: 60, active: false, isSystem: true },
  { id: 'doordash-dining', name: 'DoorDash Dining Credits ($5/mo)', type: 'counter', unitFaceValue: 5, count: 0, maxCount: 12, faceValue: 0, personalValue: 0, isSystem: true },
  { id: 'doordash-grocery', name: 'DoorDash Grocery/Non-Restaurant Promos ($20/mo)', type: 'counter', unitFaceValue: 20, count: 0, maxCount: 12, faceValue: 0, personalValue: 0, isSystem: true },
  { id: 'apple-music', name: 'Apple Music Subscription', type: 'toggle', unitFaceValue: 132, faceValue: 132, personalValue: 66, active: false, isSystem: true },
  { id: 'apple-tv', name: 'Apple TV+ Subscription', type: 'toggle', unitFaceValue: 120, faceValue: 120, personalValue: 60, active: false, isSystem: true },
  { id: 'lyft-pink', name: 'Lyft Pink All Access Membership', type: 'toggle', unitFaceValue: 199, faceValue: 199, personalValue: 50, active: false, isSystem: true },
  { id: 'lyft-credit', name: 'Lyft Ride Credits ($10/mo)', type: 'counter', unitFaceValue: 10, count: 0, maxCount: 12, faceValue: 0, personalValue: 0, isSystem: true }
];

// Initial state
let state = {
  pointValuation: 1.50, // cents per point
  auCount: 0,
  totalAccountPoints: 0,
  perks: [...DEFAULT_PERKS],
  transactions: []
};

// LocalStorage helpers & Sanitization
function sanitizeState(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;

  const sanitized = {
    pointValuation: typeof parsed.pointValuation === 'number' ? parsed.pointValuation : 1.50,
    auCount: typeof parsed.auCount === 'number' ? parsed.auCount : 0,
    totalAccountPoints: typeof parsed.totalAccountPoints === 'number' ? parsed.totalAccountPoints : 0,
    perks: Array.isArray(parsed.perks) ? parsed.perks : JSON.parse(JSON.stringify(DEFAULT_PERKS)),
    transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
  };

  // Ensure all standard system perks are present and formatted correctly
  DEFAULT_PERKS.forEach(sysPerk => {
    const existing = sanitized.perks.find(p => p.id === sysPerk.id);
    if (!existing) {
      sanitized.perks.push({ ...sysPerk });
    } else {
      // Sync type and parameters in case they changed in code updates
      existing.type = sysPerk.type;
      existing.unitFaceValue = sysPerk.unitFaceValue;
      if (sysPerk.type === 'counter') {
        existing.maxCount = sysPerk.maxCount;
        if (typeof existing.count !== 'number') {
          existing.count = existing.active ? 1 : 0;
        }
        existing.faceValue = existing.count * existing.unitFaceValue;
      } else {
        existing.faceValue = sysPerk.unitFaceValue;
      }
    }
  });

  return sanitized;
}

function loadState() {
  const saved = localStorage.getItem('csr_value_maxxer_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const sanitized = sanitizeState(parsed);
      if (sanitized) {
        state = sanitized;
      } else {
        resetToDefaultState();
      }
    } catch (e) {
      console.error("Error parsing saved state:", e);
      resetToDefaultState();
    }
  } else {
    resetToDefaultState();
  }
}

function saveState() {
  localStorage.setItem('csr_value_maxxer_state', JSON.stringify(state));
}

function resetToDefaultState() {
  state = {
    pointValuation: 1.50,
    auCount: 0,
    perks: JSON.parse(JSON.stringify(DEFAULT_PERKS)), // deep clone
    transactions: [
      // Example sign-up and redemption
      {
        id: 'example-earn',
        name: 'Welcome Sign-Up Bonus',
        type: 'earn',
        points: 60000,
        faceValue: 900.00,
        personalValue: 900.00,
        multiplier: 'custom',
        spendAmount: 0,
        date: new Date().toISOString().split('T')[0]
      },
      {
        id: 'example-redeem',
        name: 'PointsYeah Southwest Flight (to Chicago)',
        type: 'redeem',
        points: 10000,
        faceValue: 180.00,
        personalValue: 150.00,
        multiplier: 'custom',
        spendAmount: 0,
        date: new Date().toISOString().split('T')[0]
      }
    ]
  };
  saveState();
}

// Math Engine
function computeTotals() {
  const baseFee = 795;
  const auFee = 195;
  const annualFee = baseFee + (state.auCount * auFee);

  // Perks
  let perksFace = 0;
  let perksPersonal = 0;
  state.perks.forEach(perk => {
    if (perk.type === 'counter') {
      perk.active = perk.count > 0;
      perk.faceValue = perk.count * perk.unitFaceValue;
      perk.personalValue = Math.min(perk.personalValue, perk.faceValue);
    } else {
      perk.faceValue = perk.unitFaceValue;
    }

    if (perk.active) {
      perksFace += Number(perk.faceValue);
      perksPersonal += Number(perk.personalValue);
    }
  });

  // Points Balance and valuation
  let totalPointsEarned = 0;
  let totalPointsRedeemed = 0;
  let redemptionsFaceValue = 0;
  let redemptionsPersonalValue = 0;
  let totalSpend = 0;

  state.transactions.forEach(t => {
    if (t.type === 'earn') {
      totalPointsEarned += Number(t.points);
      totalSpend += Number(t.spendAmount) || 0;
    } else if (t.type === 'redeem') {
      totalPointsRedeemed += Number(t.points);
      redemptionsFaceValue += Number(t.faceValue);
      redemptionsPersonalValue += Number(t.personalValue);
    }
  });

  const pointsBalance = Math.max(0, totalPointsEarned - totalPointsRedeemed);
  const pointsValuationDollar = (pointsBalance * state.pointValuation) / 100;

  // Realized Total Values
  const totalFaceValue = perksFace + redemptionsFaceValue + pointsValuationDollar;
  const totalPersonalValue = perksPersonal + redemptionsPersonalValue + pointsValuationDollar;
  
  const netROI = totalPersonalValue - annualFee;
  const flat2PercentValue = totalSpend * 0.02;
  const cashbackDiff = netROI - flat2PercentValue;

  return {
    annualFee,
    perksFace,
    perksPersonal,
    totalPointsEarned,
    totalPointsRedeemed,
    pointsBalance,
    pointsValuationDollar,
    totalFaceValue,
    totalPersonalValue,
    netROI,
    totalSpend,
    flat2PercentValue,
    cashbackDiff
  };
}

// Rendering Functions
function updateKPICards(totals) {
  document.getElementById('val-annual-fee').textContent = formatCurrency(totals.annualFee);
  document.getElementById('sub-annual-fee').textContent = `Base: $795 • AUs: ${state.auCount} (+$${state.auCount * 195})`;

  document.getElementById('val-cashback-compare').textContent = formatCurrency(totals.flat2PercentValue);
  
  const subCompare = document.getElementById('sub-cashback-compare');
  if (totals.cashbackDiff >= 0) {
    subCompare.innerHTML = `CSR outperforms by <span style="color: var(--color-success); font-weight: 500;">+${formatCurrency(totals.cashbackDiff)}</span>`;
  } else {
    subCompare.innerHTML = `CSR underperforms by <span style="color: var(--color-danger); font-weight: 500;">-${formatCurrency(Math.abs(totals.cashbackDiff))}</span>`;
  }

  document.getElementById('val-personal-value').textContent = formatCurrency(totals.totalPersonalValue);
  document.getElementById('sub-personal-value').textContent = `Face Value: ${formatCurrency(totals.totalFaceValue)}`;
  
  const roiCard = document.getElementById('card-net-roi');
  const roiVal = document.getElementById('val-net-roi');
  const roiSub = document.getElementById('sub-net-roi');
  const roiIcon = document.getElementById('roi-icon');

  roiVal.textContent = formatCurrency(totals.netROI);
  if (totals.netROI >= 0) {
    roiCard.className = 'metric-card roi-card positive';
    roiSub.innerHTML = `<span style="color: var(--color-success)">In the green!</span> Net ROI positive`;
    if (roiIcon) roiIcon.setAttribute('data-lucide', 'trending-up');
  } else {
    roiCard.className = 'metric-card roi-card negative';
    roiSub.innerHTML = `<span style="color: var(--color-danger)">In the red!</span> Deficit of ${formatCurrency(Math.abs(totals.netROI))}`;
    if (roiIcon) roiIcon.setAttribute('data-lucide', 'trending-down');
  }
  
  // Re-run Lucide to render newly updated icons if needed
  if (window.lucide) window.lucide.createIcons();
}

function updateDOM() {
  const totals = computeTotals();

  // 1. KPI Cards
  updateKPICards(totals);

  // 2. Point Balance Section
  document.getElementById('val-points-total').textContent = `${totals.pointsBalance.toLocaleString()} pts`;
  document.getElementById('val-points-dollar').textContent = `${formatCurrency(totals.pointsValuationDollar)} value`;
  
  document.getElementById('input-total-points').value = state.totalAccountPoints || '';
  const totalValuationDollar = ((state.totalAccountPoints || 0) * state.pointValuation) / 100;
  document.getElementById('val-total-points-dollar').textContent = formatCurrency(totalValuationDollar);

  document.getElementById('bubble-point-val').textContent = `${state.pointValuation.toFixed(2)}¢`;
  document.getElementById('slider-point-val').value = state.pointValuation;
  document.getElementById('input-au-count').value = state.auCount;

  // 3. Render Chart Section
  const maxVal = Math.max(totals.annualFee, totals.totalFaceValue, totals.totalPersonalValue, 100);
  const feePct = (totals.annualFee / maxVal) * 100;
  const facePct = (totals.totalFaceValue / maxVal) * 100;
  const personalPct = (totals.totalPersonalValue / maxVal) * 100;

  document.getElementById('chart-fill-fee').style.width = `${feePct}%`;
  document.getElementById('chart-val-fee').textContent = formatCurrency(totals.annualFee);

  document.getElementById('chart-fill-face').style.width = `${facePct}%`;
  document.getElementById('chart-val-face').textContent = formatCurrency(totals.totalFaceValue);

  document.getElementById('chart-fill-personal').style.width = `${personalPct}%`;
  document.getElementById('chart-val-personal').textContent = formatCurrency(totals.totalPersonalValue);

  // 4. Render Perks Ledger
  renderPerksTable();

  // 5. Render Transaction Ledger
  renderLedgerTable();

  // Re-initialize lucide icons for newly drawn components
  lucide.createIcons();
}

function renderPerksTable() {
  const tbody = document.getElementById('tbody-perks');
  tbody.innerHTML = '';

  state.perks.forEach((perk) => {
    const tr = document.createElement('tr');
    if (!perk.active) tr.className = 'perk-inactive';

    const faceVal = Number(perk.faceValue);
    const personalVal = Number(perk.personalValue);
    const isSliderDisabled = faceVal === 0 ? 'disabled' : '';

    let activeControlHtml = '';
    if (perk.type === 'counter') {
      activeControlHtml = `
        <div class="perk-counter-control">
          <button type="button" class="perk-counter-btn btn-perk-count-dec" data-id="${perk.id}">-</button>
          <span class="perk-count-display">${perk.count}</span>
          <button type="button" class="perk-counter-btn btn-perk-count-inc" data-id="${perk.id}">+</button>
        </div>
      `;
    } else {
      activeControlHtml = `
        <label class="switch-container" aria-label="Toggle ${perk.name}">
          <input type="checkbox" class="switch-input perk-toggle" data-id="${perk.id}" ${perk.active ? 'checked' : ''}>
          <span class="switch-track"><span class="switch-thumb"></span></span>
        </label>
      `;
    }

    tr.innerHTML = `
      <td>${activeControlHtml}</td>
      <td>
        <span class="perk-name" style="display: block; font-weight: 600;">${escapeHTML(perk.name)}</span>
        <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 3px;">
          Face Value: $${faceVal.toFixed(2)}
        </div>
      </td>
      <td>
        <div class="perk-valuation-editor">
          <input type="range" class="perk-val-slider" data-id="${perk.id}" min="0" max="100" step="5" value="${faceVal === 0 ? 0 : Math.round((personalVal / faceVal) * 100)}" ${isSliderDisabled}>
          <span class="perk-val-pct-label">${faceVal === 0 ? 0 : Math.round((personalVal / faceVal) * 100)}%</span>
          <div class="perk-val-input-group">
            <span>$</span>
            <input type="number" class="input-inline-price perk-val-input" data-id="${perk.id}" min="0" max="${faceVal * 2}" step="1" value="${personalVal.toFixed(0)}" ${isSliderDisabled}>
          </div>
        </div>
      </td>
      <td class="td-actions">
        <div class="td-actions-wrap">
          ${perk.isSystem 
            ? `<button class="btn-inline-action" disabled title="Standard perks cannot be deleted"><i data-lucide="lock" style="width: 14px; height: 14px; opacity:0.4;"></i></button>`
            : `
              <button class="btn-inline-action edit btn-edit-perk" data-id="${perk.id}" title="Edit Custom Perk"><i data-lucide="edit-2" style="width: 14px; height: 14px;"></i></button>
              <button class="btn-inline-action delete btn-delete-perk" data-id="${perk.id}" title="Delete Custom Perk"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
            `
          }
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderLedgerTable() {
  const tbody = document.getElementById('tbody-ledger');
  tbody.innerHTML = '';

  if (state.transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No points transactions recorded. Log your first earn or redemption!</td>
      </tr>
    `;
    return;
  }

  const sorted = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date));

  sorted.forEach(t => {
    const tr = document.createElement('tr');
    
    const isEarn = t.type === 'earn';
    const typeBadge = isEarn 
      ? `<span class="badge badge-earn">Earn</span>` 
      : `<span class="badge badge-redeem">Redeem</span>`;

    let cppText = '-';
    if (t.type === 'redeem') {
      const faceCpp = (t.faceValue / t.points) * 100;
      const actualCpp = (t.personalValue / t.points) * 100;
      cppText = `
        <span class="cpp-highlight" title="Actual CPP">${actualCpp.toFixed(2)}¢</span> 
        <span style="font-size: 0.7rem; color: var(--color-text-muted);" title="Face CPP">(${faceCpp.toFixed(2)}¢)</span>
      `;
    }

    tr.innerHTML = `
      <td>
        <div style="font-weight: 500;">${escapeHTML(t.name)}</div>
        <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 2px;">
          ${t.date} ${t.multiplier && t.multiplier !== 'custom' ? `• Category: ${t.multiplier}x multiplier` : ''}
        </div>
        ${t.breakdown ? `
        <div class="tx-breakdown" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; font-size: 0.7rem; line-height: 1.4;">
          ${t.breakdown.dining ? `<span style="background: rgba(16, 185, 129, 0.08); color: var(--color-success); border: 1px solid rgba(16, 185, 129, 0.15); padding: 1px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">🍽️ 3x Dining: <strong>${t.breakdown.dining.toLocaleString()}</strong></span>` : ''}
          ${t.breakdown.lyft ? `<span style="background: rgba(59, 130, 246, 0.08); color: var(--color-primary-light); border: 1px solid rgba(59, 130, 246, 0.15); padding: 1px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">🚗 5x Lyft: <strong>${t.breakdown.lyft.toLocaleString()}</strong></span>` : ''}
          ${t.breakdown.chaseTravel ? `<span style="background: rgba(212, 175, 55, 0.08); color: var(--color-gold); border: 1px solid rgba(212, 175, 55, 0.15); padding: 1px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">✈️ 8x Portal: <strong>${t.breakdown.chaseTravel.toLocaleString()}</strong></span>` : ''}
          ${t.breakdown.directTravel ? `<span style="background: rgba(99, 102, 241, 0.08); color: var(--color-text-muted); border: 1px solid rgba(99, 102, 241, 0.15); padding: 1px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">🚕 4x Travel: <strong>${t.breakdown.directTravel.toLocaleString()}</strong></span>` : ''}
          ${t.breakdown.other ? `<span style="background: rgba(15, 38, 92, 0.06); color: var(--color-text-normal); border: 1px solid rgba(15, 38, 92, 0.1); padding: 1px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">🛒 1x Other: <strong>${t.breakdown.other.toLocaleString()}</strong></span>` : ''}
        </div>
        ` : ''}
      </td>
      <td>${typeBadge}</td>
      <td class="table-cell-right" style="color: ${isEarn ? 'var(--color-success)' : 'var(--color-primary-light)'}; font-weight:600;">
        ${isEarn ? '+' : '-'}${t.points.toLocaleString()}
      </td>
      <td class="table-cell-right" style="color: var(--color-text-normal);">$${Number(t.faceValue).toFixed(2)}</td>
      <td class="table-cell-right" style="font-weight: 500;">$${Number(t.personalValue).toFixed(2)}</td>
      <td class="table-cell-right">${cppText}</td>
      <td class="td-actions">
        <div class="td-actions-wrap">
          <button class="btn-inline-action delete btn-delete-transaction" data-id="${t.id}" title="Delete Transaction">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Modal handling
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.showModal();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.close();
  }
}

// Utility Helpers
function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// CSV Parsing Helpers
function formatISODateToMDY(isoDateStr) {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }
  return isoDateStr;
}

function parseCSVLine(text) {
  let p = '', r = [];
  let q = false;
  for (let i = 0; i < text.length; i++) {
    let c = text[i];
    if (c === '"') {
      q = !q;
    } else if (c === ',' && !q) {
      r.push(p.trim());
      p = '';
    } else {
      p += c;
    }
  }
  r.push(p.trim());
  return r;
}

function parseChaseCSV(csvText) {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return;

  // Header detection
  const headers = parseCSVLine(lines[0]);
  const colDate = headers.indexOf('Transaction Date');
  const colDesc = headers.indexOf('Description');
  const colCat = headers.indexOf('Category');
  const colType = headers.indexOf('Type');
  const colAmount = headers.indexOf('Amount');

  if (colDate === -1 || colDesc === -1 || colCat === -1 || colAmount === -1) {
    throw new Error('Required CSV headers not found');
  }

  let totalDiningSpend = 0;
  let totalLyftSpend = 0;
  let totalChaseTravelSpend = 0;
  let totalDirectTravelSpend = 0;
  let totalOtherSpend = 0;

  let travelCreditTotal = 0;
  let editCreditNetCount = 0;
  let diningCreditCount = 0;
  
  const chaseOffers = [];
  const lyftMonths = new Set();

  let earliestDate = null;
  let latestDate = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = parseCSVLine(line);
    if (cells.length <= Math.max(colDate, colDesc, colCat, colAmount)) continue;

    const dateStr = cells[colDate];
    const desc = cells[colDesc];
    const category = cells[colCat];
    const type = cells[colType] || '';
    const amount = parseFloat(cells[colAmount]);

    if (isNaN(amount)) continue;

    if (dateStr) {
      // Normalize date (MM/DD/YYYY -> YYYY-MM-DD) for correct chronological comparison
      const dateParts = dateStr.split('/');
      if (dateParts.length === 3) {
        const isoDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
        if (!earliestDate || isoDate < earliestDate) earliestDate = isoDate;
        if (!latestDate || isoDate > latestDate) latestDate = isoDate;
      }
    }

    const descUpper = desc.toUpperCase();
    
    // Ignore payment transfers
    if (descUpper.startsWith('PAYMENT THANK YOU') || type.toUpperCase() === 'PAYMENT') {
      continue;
    }

    // 1. Check for standard credits / adjustments
    if (descUpper.includes('TRAVEL CREDIT $300/YEAR')) {
      if (amount > 0) travelCreditTotal += amount;
      continue;
    }

    if (descUpper.includes('DINING CREDIT $300/YEAR')) {
      if (amount > 0) {
        diningCreditCount += Math.round(amount / 150);
      }
      continue;
    }

    if (descUpper.includes('THE EDIT $500/YEAR CREDIT')) {
      // Amount can be positive (credit reversal/debit) or negative (credit application) in adjustments
      // Let's count net credits: credits are negative in some reports or positive in others.
      // In the statements, credits are positive adjustments, and debit reversals are negative adjustments.
      editCreditNetCount += Math.round(amount / 250);
      continue;
    }

    if (descUpper.startsWith('OFFER:')) {
      if (amount > 0) {
        chaseOffers.push({ name: desc, amount: amount });
      }
      continue;
    }

    // 2. Accumulate Spend for Point Earnings
    const isRefund = amount > 0 || type.toUpperCase() === 'RETURN';
    const spendValue = Math.abs(amount);

    if (category === 'Food & Drink') {
      if (isRefund) {
        totalDiningSpend -= spendValue;
      } else {
        totalDiningSpend += spendValue;
      }
    } else if (category === 'Travel') {
      if (descUpper.includes('LYFT')) {
        if (dateStr) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const yearMonth = `${parts[2]}-${parts[0]}`; // e.g. "2026-05"
            lyftMonths.add(yearMonth);
          }
        }
        if (isRefund) {
          totalLyftSpend -= spendValue;
        } else {
          totalLyftSpend += spendValue;
        }
      } else if (descUpper.includes('CHASE TRAVEL') || descUpper.includes('THE EDIT')) {
        if (isRefund) {
          totalChaseTravelSpend -= spendValue;
        } else {
          totalChaseTravelSpend += spendValue;
        }
      } else {
        if (isRefund) {
          totalDirectTravelSpend -= spendValue;
        } else {
          totalDirectTravelSpend += spendValue;
        }
      }
    } else {
      if (isRefund) {
        totalOtherSpend -= spendValue;
      } else {
        totalOtherSpend += spendValue;
      }
    }
  }

  totalDiningSpend = Math.max(0, totalDiningSpend);
  totalLyftSpend = Math.max(0, totalLyftSpend);
  totalChaseTravelSpend = Math.max(0, totalChaseTravelSpend);
  totalDirectTravelSpend = Math.max(0, totalDirectTravelSpend);
  totalOtherSpend = Math.max(0, totalOtherSpend);

  const diningPoints = Math.round(totalDiningSpend * 3);
  const lyftPoints = Math.round(totalLyftSpend * 5);
  const chaseTravelPoints = Math.round(totalChaseTravelSpend * 8);
  const directTravelPoints = Math.round(totalDirectTravelSpend * 4);
  const otherPoints = Math.round(totalOtherSpend * 1);

  const totalPointsEarned = diningPoints + lyftPoints + chaseTravelPoints + directTravelPoints + otherPoints;
  const totalSpendVal = totalDiningSpend + totalLyftSpend + totalChaseTravelSpend + totalDirectTravelSpend + totalOtherSpend;

  // Apply parsed results to state:
  if (travelCreditTotal > 0) {
    const travelPerk = state.perks.find(p => p.id === 'travel-credit');
    if (travelPerk) {
      travelPerk.active = true;
      travelPerk.personalValue = Math.min(300, travelCreditTotal);
    }
  }

  if (editCreditNetCount > 0) {
    const editPerk = state.perks.find(p => p.id === 'the-edit');
    if (editPerk) {
      editPerk.count = Math.min(editPerk.maxCount, editCreditNetCount);
      editPerk.active = true;
      editPerk.faceValue = editPerk.count * editPerk.unitFaceValue;
      editPerk.personalValue = editPerk.faceValue;
    }
  }

  if (diningCreditCount > 0) {
    const diningPerk = state.perks.find(p => p.id === 'dining-credit');
    if (diningPerk) {
      diningPerk.count = Math.min(diningPerk.maxCount, diningCreditCount);
      diningPerk.active = true;
      diningPerk.faceValue = diningPerk.count * diningPerk.unitFaceValue;
      diningPerk.personalValue = diningPerk.faceValue;
    }
  }

  if (lyftMonths.size > 0) {
    const lyftPerk = state.perks.find(p => p.id === 'lyft-credit');
    if (lyftPerk) {
      lyftPerk.count = Math.min(lyftPerk.maxCount, lyftMonths.size);
      lyftPerk.active = true;
      lyftPerk.faceValue = lyftPerk.count * lyftPerk.unitFaceValue;
      lyftPerk.personalValue = lyftPerk.faceValue;
    }
  }

  chaseOffers.forEach(offer => {
    const normalizedName = `Chase Offer: ${offer.name.replace(/^Offer:/i, '').trim()}`;
    const existing = state.perks.find(p => p.name === normalizedName);
    if (!existing) {
      state.perks.push({
        id: 'custom-offer-' + Date.now() + Math.random().toString(36).substr(2, 5),
        name: normalizedName,
        type: 'toggle',
        unitFaceValue: offer.amount,
        faceValue: offer.amount,
        personalValue: offer.amount,
        active: true,
        isSystem: false
      });
    }
  });

  if (totalPointsEarned > 0) {
    state.transactions = state.transactions.filter(t => !t.id.startsWith('csv-imported-'));
    
    const earliestFormatted = formatISODateToMDY(earliestDate);
    const latestFormatted = formatISODateToMDY(latestDate);
    const dateRangeText = (earliestDate && latestDate) 
      ? `(${earliestFormatted} - ${latestFormatted})` 
      : `(${new Date().getFullYear()})`;

    const dollarVal = (totalPointsEarned * state.pointValuation) / 100;

    state.transactions.push({
      id: 'csv-imported-' + Date.now(),
      name: `Points Earned from Chase Statement ${dateRangeText}`,
      type: 'earn',
      points: totalPointsEarned,
      faceValue: dollarVal,
      personalValue: dollarVal,
      multiplier: 'custom',
      spendAmount: totalSpendVal,
      date: new Date().toISOString().split('T')[0],
      breakdown: {
        dining: diningPoints,
        lyft: lyftPoints,
        chaseTravel: chaseTravelPoints,
        directTravel: directTravelPoints,
        other: otherPoints
      }
    });
  }

  saveState();
  updateDOM();
}

// Theme loading/saving
function initTheme() {
  const theme = localStorage.getItem('csr_theme') || 'light';
  const icon = document.getElementById('theme-toggle-icon');
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    if (icon) icon.setAttribute('data-lucide', 'moon');
  } else {
    document.body.classList.remove('dark-theme');
    if (icon) icon.setAttribute('data-lucide', 'sun');
  }
}

// Event Listeners Registration
document.addEventListener('DOMContentLoaded', () => {
  // Load Theme
  initTheme();

  // Load State
  loadState();
  updateDOM();

  // Theme Toggle click
  const themeToggle = document.getElementById('btn-theme-toggle');
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-theme');
    const icon = document.getElementById('theme-toggle-icon');
    if (isDark) {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('csr_theme', 'light');
      if (icon) icon.setAttribute('data-lucide', 'sun');
    } else {
      document.body.classList.add('dark-theme');
      localStorage.setItem('csr_theme', 'dark');
      if (icon) icon.setAttribute('data-lucide', 'moon');
    }
    lucide.createIcons();
  });

  // Points Slider
  const pointValSlider = document.getElementById('slider-point-val');
  pointValSlider.addEventListener('input', (e) => {
    state.pointValuation = parseFloat(e.target.value);
    document.getElementById('bubble-point-val').textContent = `${state.pointValuation.toFixed(2)}¢`;
    // Update face/personal value for point earnings dynamically
    state.transactions.forEach(t => {
      if (t.type === 'earn') {
        const val = (t.points * state.pointValuation) / 100;
        t.faceValue = val;
        t.personalValue = val;
      }
    });
    saveState();
    updateDOM();
  });

  // Total Account Points Input
  const totalPointsInput = document.getElementById('input-total-points');
  totalPointsInput.addEventListener('input', (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 0) val = 0;
    state.totalAccountPoints = val;
    saveState();
    
    const totalValuationDollar = (val * state.pointValuation) / 100;
    document.getElementById('val-total-points-dollar').textContent = formatCurrency(totalValuationDollar);
  });

  // Authorized Users Steppers
  document.getElementById('btn-au-dec').addEventListener('click', () => {
    if (state.auCount > 0) {
      state.auCount--;
      saveState();
      updateDOM();
    }
  });
  
  document.getElementById('btn-au-inc').addEventListener('click', () => {
    if (state.auCount < 10) {
      state.auCount++;
      saveState();
      updateDOM();
    }
  });

  // Perks Table Inline Event Delegation
  const perksTable = document.getElementById('tbody-perks');
  
  perksTable.addEventListener('change', (e) => {
    // Checkbox toggle active state (for toggle-type perks)
    if (e.target.classList.contains('perk-toggle')) {
      const id = e.target.getAttribute('data-id');
      const perk = state.perks.find(p => p.id === id);
      if (perk) {
        perk.active = e.target.checked;
        saveState();
        updateDOM();
      }
    }
  });

  perksTable.addEventListener('click', (e) => {
    const btnDec = e.target.closest('.btn-perk-count-dec');
    const btnInc = e.target.closest('.btn-perk-count-inc');

    if (btnDec) {
      const id = btnDec.getAttribute('data-id');
      const perk = state.perks.find(p => p.id === id);
      if (perk && perk.type === 'counter' && perk.count > 0) {
        const prevFace = perk.faceValue;
        const isFullyValued = perk.personalValue === prevFace || prevFace === 0;

        perk.count--;
        perk.faceValue = perk.count * perk.unitFaceValue;
        perk.active = perk.count > 0;

        if (isFullyValued) {
          perk.personalValue = perk.faceValue;
        } else {
          perk.personalValue = Math.min(perk.personalValue, perk.faceValue);
        }

        saveState();
        updateDOM();
      }
    }

    if (btnInc) {
      const id = btnInc.getAttribute('data-id');
      const perk = state.perks.find(p => p.id === id);
      if (perk && perk.type === 'counter' && perk.count < perk.maxCount) {
        const prevFace = perk.faceValue;
        const isFullyValued = perk.personalValue === prevFace || prevFace === 0;

        perk.count++;
        perk.faceValue = perk.count * perk.unitFaceValue;
        perk.active = perk.count > 0;

        if (isFullyValued) {
          perk.personalValue = perk.faceValue;
        } else {
          // Add new unit face value to personal value
          perk.personalValue = perk.personalValue + perk.unitFaceValue;
        }

        saveState();
        updateDOM();
      }
    }
  });

  perksTable.addEventListener('input', (e) => {
    // Valuation Slider (Percentage-based, snapping to 5%)
    if (e.target.classList.contains('perk-val-slider')) {
      const id = e.target.getAttribute('data-id');
      const pct = parseFloat(e.target.value) || 0;
      
      const perk = state.perks.find(p => p.id === id);
      if (perk) {
        const faceVal = Number(perk.faceValue);
        const val = (pct / 100) * faceVal;
        perk.personalValue = val;
        
        // Find sibling percentage label and update it
        const pctLabel = e.target.closest('.perk-valuation-editor').querySelector('.perk-val-pct-label');
        if (pctLabel) pctLabel.textContent = `${pct}%`;
        
        // Find sibling price text box and update it
        const input = e.target.closest('.perk-valuation-editor').querySelector('.perk-val-input');
        if (input) input.value = val.toFixed(0);
        
        saveState();
        
        // Update math details on card & chart dynamically to prevent interface lag
        const totals = computeTotals();
        updateKPICards(totals);

        // Chart updates
        const maxVal = Math.max(totals.annualFee, totals.totalFaceValue, totals.totalPersonalValue, 100);
        document.getElementById('chart-fill-face').style.width = `${(totals.totalFaceValue / maxVal) * 100}%`;
        document.getElementById('chart-val-face').textContent = formatCurrency(totals.totalFaceValue);
        document.getElementById('chart-fill-personal').style.width = `${(totals.totalPersonalValue / maxVal) * 100}%`;
        document.getElementById('chart-val-personal').textContent = formatCurrency(totals.totalPersonalValue);
        document.getElementById('chart-fill-fee').style.width = `${(totals.annualFee / maxVal) * 100}%`;
      }
    }
    
    // Valuation Price Box (re-calculates and snaps slider to nearest 5%)
    if (e.target.classList.contains('perk-val-input')) {
      const id = e.target.getAttribute('data-id');
      let val = parseFloat(e.target.value);
      if (isNaN(val)) val = 0;
      if (val < 0) val = 0;
      
      const perk = state.perks.find(p => p.id === id);
      if (perk) {
        perk.personalValue = val;
        
        // Find sibling percentage slider and update it (snapped to nearest 5%)
        const faceVal = Number(perk.faceValue);
        const pct = faceVal === 0 ? 0 : Math.round((val / faceVal) * 100);
        const snappedPct = Math.min(100, Math.max(0, Math.round(pct / 5) * 5));
        
        const slider = e.target.closest('.perk-valuation-editor').querySelector('.perk-val-slider');
        if (slider) slider.value = snappedPct;
        
        const pctLabel = e.target.closest('.perk-valuation-editor').querySelector('.perk-val-pct-label');
        if (pctLabel) pctLabel.textContent = `${snappedPct}%`;
        
        saveState();
        
        // Update math details on card & chart dynamically
        const totals = computeTotals();
        updateKPICards(totals);

        // Chart updates
        const maxVal = Math.max(totals.annualFee, totals.totalFaceValue, totals.totalPersonalValue, 100);
        document.getElementById('chart-fill-face').style.width = `${(totals.totalFaceValue / maxVal) * 100}%`;
        document.getElementById('chart-val-face').textContent = formatCurrency(totals.totalFaceValue);
        document.getElementById('chart-fill-personal').style.width = `${(totals.totalPersonalValue / maxVal) * 100}%`;
        document.getElementById('chart-val-personal').textContent = formatCurrency(totals.totalPersonalValue);
        document.getElementById('chart-fill-fee').style.width = `${(totals.annualFee / maxVal) * 100}%`;
      }
    }
  });

  perksTable.addEventListener('change', (e) => {
    if (e.target.classList.contains('perk-val-slider') || e.target.classList.contains('perk-val-input')) {
      saveState();
      updateDOM();
    }
  });

  // Edit / Delete Perk delegation
  perksTable.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.classList.contains('btn-delete-perk')) {
      const id = btn.getAttribute('data-id');
      state.perks = state.perks.filter(p => p.id !== id);
      saveState();
      updateDOM();
    }

    if (btn.classList.contains('btn-edit-perk')) {
      const id = btn.getAttribute('data-id');
      const perk = state.perks.find(p => p.id === id);
      if (perk) {
        document.getElementById('dialog-perk-title').textContent = 'Edit Custom Perk';
        document.getElementById('perk-id').value = perk.id;
        document.getElementById('perk-name').value = perk.name;
        document.getElementById('perk-face').value = perk.faceValue;
        document.getElementById('perk-personal').value = perk.personalValue;
        openModal('dialog-perk');
      }
    }
  });

  // Action ledger delete button delegation
  document.getElementById('tbody-ledger').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-delete-transaction');
    if (btn) {
      const id = btn.getAttribute('data-id');
      state.transactions = state.transactions.filter(t => t.id !== id);
      saveState();
      updateDOM();
    }
  });

  // Add Custom Perk Button
  document.getElementById('btn-add-custom-perk').addEventListener('click', () => {
    document.getElementById('dialog-perk-title').textContent = 'Add Custom Perk';
    document.getElementById('perk-id').value = '';
    document.getElementById('form-perk').reset();
    openModal('dialog-perk');
  });

  // Custom Perk Form Submit
  document.getElementById('form-perk').addEventListener('submit', (e) => {
    const id = document.getElementById('perk-id').value;
    const name = document.getElementById('perk-name').value.trim();
    const face = parseFloat(document.getElementById('perk-face').value);
    const personal = parseFloat(document.getElementById('perk-personal').value);

    if (id) {
      // Edit mode
      const perk = state.perks.find(p => p.id === id);
      if (perk) {
        perk.name = name;
        perk.faceValue = face;
        perk.personalValue = personal;
      }
    } else {
      // Add mode
      state.perks.push({
        id: 'custom-' + Date.now(),
        name: name,
        type: 'toggle',
        unitFaceValue: face,
        faceValue: face,
        personalValue: personal,
        active: true,
        isSystem: false
      });
    }

    saveState();
    updateDOM();
    closeModal('dialog-perk');
  });

  // Modal dialog close click delegation
  document.querySelectorAll('[data-close-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-target');
      closeModal(modalId);
    });
  });

  // Points Earning Modal Multiplier change
  const multiplierSelect = document.getElementById('earn-multiplier');
  const spendInputs = document.getElementById('earn-calc-inputs');
  const customPointsGroup = document.getElementById('earn-custom-points-group');
  const spendInput = document.getElementById('earn-spend');
  const calcPointsInput = document.getElementById('earn-calculated-points');

  multiplierSelect.addEventListener('change', () => {
    if (multiplierSelect.value === 'custom') {
      spendInputs.classList.add('hidden');
      customPointsGroup.classList.remove('hidden');
      document.getElementById('earn-points').required = true;
      spendInput.required = false;
    } else {
      spendInputs.classList.remove('hidden');
      customPointsGroup.classList.add('hidden');
      document.getElementById('earn-points').required = false;
      spendInput.required = true;
      calculateEarnedPoints();
    }
  });

  function calculateEarnedPoints() {
    const multVal = multiplierSelect.value;
    if (multVal === 'custom') return;
    const mult = parseFloat(multVal);
    const spend = parseFloat(spendInput.value) || 0;
    calcPointsInput.value = Math.round(spend * mult);
  }

  spendInput.addEventListener('input', calculateEarnedPoints);

  // Add Earning Button click
  document.getElementById('btn-add-earn').addEventListener('click', () => {
    document.getElementById('form-earn').reset();
    multiplierSelect.value = '3'; // Default to dining 3x
    spendInputs.classList.remove('hidden');
    customPointsGroup.classList.add('hidden');
    document.getElementById('earn-points').required = false;
    spendInput.required = true;
    calcPointsInput.value = '';
    openModal('dialog-earn');
  });

  // Form Earning Submit
  document.getElementById('form-earn').addEventListener('submit', (e) => {
    const name = document.getElementById('earn-name').value.trim();
    const multVal = multiplierSelect.value;
    
    let points = 0;
    let spend = 0;

    if (multVal === 'custom') {
      points = parseInt(document.getElementById('earn-points').value) || 0;
    } else {
      spend = parseFloat(spendInput.value) || 0;
      points = Math.round(spend * parseFloat(multVal));
    }

    const val = (points * state.pointValuation) / 100;

    state.transactions.push({
      id: 'tx-' + Date.now(),
      name: name,
      type: 'earn',
      points: points,
      faceValue: val,
      personalValue: val,
      multiplier: multVal,
      spendAmount: spend,
      date: new Date().toISOString().split('T')[0]
    });

    saveState();
    updateDOM();
    closeModal('dialog-earn');
  });

  // Redemption Form Preview updates
  const redPointsInput = document.getElementById('redeem-points');
  const redFaceInput = document.getElementById('redeem-face');
  const redPersonalInput = document.getElementById('redeem-personal');
  const previewFaceCpp = document.getElementById('val-preview-face-cpp');
  const previewPersonalCpp = document.getElementById('val-preview-personal-cpp');

  function updateRedemptionModalPreview() {
    const pts = parseFloat(redPointsInput.value) || 0;
    const face = parseFloat(redFaceInput.value) || 0;
    const pers = parseFloat(redPersonalInput.value) || 0;

    if (pts > 0) {
      const faceCpp = (face / pts) * 100;
      const persCpp = (pers / pts) * 100;
      previewFaceCpp.textContent = `${faceCpp.toFixed(2)}¢`;
      previewPersonalCpp.textContent = `${persCpp.toFixed(2)}¢`;
    } else {
      previewFaceCpp.textContent = '0.00¢';
      previewPersonalCpp.textContent = '0.00¢';
    }
  }

  redPointsInput.addEventListener('input', updateRedemptionModalPreview);
  redFaceInput.addEventListener('input', updateRedemptionModalPreview);
  redPersonalInput.addEventListener('input', updateRedemptionModalPreview);

  document.getElementById('btn-match-face').addEventListener('click', () => {
    redPersonalInput.value = redFaceInput.value;
    updateRedemptionModalPreview();
  });

  // Log Redemption Button click
  document.getElementById('btn-add-redeem').addEventListener('click', () => {
    document.getElementById('form-redeem').reset();
    previewFaceCpp.textContent = '0.00¢';
    previewPersonalCpp.textContent = '0.00¢';
    openModal('dialog-redeem');
  });

  // Redemption Form Submit
  document.getElementById('form-redeem').addEventListener('submit', (e) => {
    const name = document.getElementById('redeem-name').value.trim();
    const points = parseInt(redPointsInput.value) || 0;
    const face = parseFloat(redFaceInput.value) || 0;
    const personal = parseFloat(redPersonalInput.value) || 0;

    state.transactions.push({
      id: 'tx-' + Date.now(),
      name: name,
      type: 'redeem',
      points: points,
      faceValue: face,
      personalValue: personal,
      multiplier: 'custom',
      spendAmount: 0,
      date: new Date().toISOString().split('T')[0]
    });

    saveState();
    updateDOM();
    closeModal('dialog-redeem');
  });

  // Reset Button
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all tracking data? This will restore standard perks and default transaction examples.')) {
      resetToDefaultState();
      updateDOM();
    }
  });

  // Export Data
  document.getElementById('btn-export').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `csr_value_maxxer_backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
  });

  // Import Data triggers
  const fileImport = document.getElementById('file-import');
  document.getElementById('btn-import-trigger').addEventListener('click', () => {
    fileImport.click();
  });

  fileImport.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      const content = evt.target.result;
      
      // Auto-detect format by checking file name or content headers
      const isCSV = file.name.endsWith('.csv') || content.includes('Transaction Date') || content.includes('Post Date');
      
      if (isCSV) {
        try {
          parseChaseCSV(content);
          alert('Chase statement CSV parsed successfully! Points earnings and statement credits have been updated.');
        } catch (err) {
          alert('Failed to parse Chase CSV file. Please ensure it is a valid Chase transaction export.');
          console.error(err);
        }
      } else {
        try {
          const imported = JSON.parse(content);
          const sanitized = sanitizeState(imported);
          
          if (sanitized) {
            state = sanitized;
            saveState();
            updateDOM();
            alert('Data backup imported successfully!');
          } else {
            alert('Invalid backup file structure.');
          }
        } catch (err) {
          alert('Failed to parse backup file as JSON.');
          console.error(err);
        }
      }
      fileImport.value = ''; // clear input
    };
    reader.readAsText(file);
  });
});
