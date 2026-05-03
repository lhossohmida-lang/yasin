// ================== Firebase ==================
const firebaseConfig = {
    apiKey: "AIzaSyAZwrvW6goAs7SjMPmksXWiU1x57r4UbwU",
    authDomain: "yasin-b993b.firebaseapp.com",
    projectId: "yasin-b993b",
    storageBucket: "yasin-b993b.firebasestorage.app",
    messagingSenderId: "1094100813279",
    appId: "1:1094100813279:web:bb4cf51c0ecc313a58f06a"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================== المتغيرات ==================
let inventory = [];
let salesHistory = [];
let expenses = [];
let workerAdvances = [];
let workerSalaries = [];
let storeData = { totalIncome: 0, netProfit: 0, totalLosses: 0 };

// ================== مستمعو Firebase ==================
db.collection("store").doc("data").onSnapshot(doc => {
    if (doc.exists) {
        storeData = doc.data();
        if (storeData.logo) updateLogoUI(storeData.logo);
    } else {
        db.collection("store").doc("data").set(storeData);
    }
    updateUI();
});

db.collection("inventory").onSnapshot(snapshot => {
    inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateUI();
});

db.collection("sales_history").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    salesHistory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateUI();
});

db.collection("expenses").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateUI();
});

db.collection("worker_advances").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    workerAdvances = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateUI();
});

db.collection("worker_salaries").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    workerSalaries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateUI();
});

// ================== تحديث الواجهة ==================
function updateUI() {
    const fmt = n => n.toLocaleString('ar-DZ', { minimumFractionDigits: 2 }) + ' د.ج';
    const capital = inventory.reduce((s, i) => s + i.qty * i.buyPrice, 0);

    document.getElementById('total-capital').innerText = fmt(capital);
    document.getElementById('total-income').innerText = fmt(storeData.totalIncome || 0);
    document.getElementById('net-profit').innerText = fmt(storeData.netProfit || 0);
    document.getElementById('total-losses').innerText = fmt(storeData.totalLosses || 0);

    renderInventoryCards();
    checkLowStock();
    renderPOSProducts();
    renderSalesHistory();
    renderExpenses();
    renderWorkerSalaries();
    renderWorkerAdvances();
}

// ================== المخزون ==================
function renderInventoryCards() {
    const container = document.getElementById('inventory-cards-container');
    if (!container) return;
    container.innerHTML = '';
    inventory.forEach(item => {
        let qtyBadge = `<span class="badge badge-success">${item.qty}</span>`;
        if (item.qty <= 0) qtyBadge = `<span class="badge badge-danger">نفد</span>`;
        else if (item.qty <= 3) qtyBadge = `<span class="badge badge-warning">${item.qty} (قليل)</span>`;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-icon"><i class="fa-solid fa-shirt"></i></div>
            <h3 class="product-name">${item.name}</h3>
            <div class="product-details">
                <div class="detail-row">
                    <span class="detail-label">الكمية:</span>
                    <span class="detail-value">${qtyBadge}</span>
                </div>
                <div class="detail-row buy-price-row">
                    <span class="detail-label">سعر الشراء:</span>
                    <span class="detail-value">${item.buyPrice} د.ج</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">سعر البيع:</span>
                    <span class="detail-value text-blue">${item.sellPrice} د.ج</span>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn-delete-card" onclick="deleteProduct('${item.id}')">
                    <i class="fa-solid fa-trash"></i> حذف
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

document.getElementById('add-product-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    try {
        await db.collection("inventory").add({
            name: document.getElementById('inv-name').value,
            qty: parseInt(document.getElementById('inv-quantity').value),
            buyPrice: parseFloat(document.getElementById('inv-buy').value),
            sellPrice: parseFloat(document.getElementById('inv-sell').value)
        });
        this.reset();
    } catch (err) {
        alert("حدث خطأ أثناء الإضافة.");
    }
});

async function deleteProduct(id) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        await db.collection("inventory").doc(id).delete();
    }
}

// ================== تنبيهات المخزون ==================
function checkLowStock() {
    const list = document.getElementById('dashboard-alerts');
    if (!list) return;
    list.innerHTML = '';
    const low = inventory.filter(i => i.qty <= 3);
    if (low.length === 0) {
        list.innerHTML = '<li class="alert-item" style="background:transparent;border:none"><span class="text-secondary">المخزون بحالة جيدة</span></li>';
        return;
    }
    low.forEach(item => {
        const out = item.qty === 0;
        const li = document.createElement('li');
        li.className = `alert-item ${out ? 'danger' : 'warning'}`;
        if (out) li.style.cssText = 'background-color:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.2);';
        li.innerHTML = `
            <i class="fa-solid ${out ? 'fa-circle-xmark' : 'fa-triangle-exclamation'}" style="${out ? 'color:var(--danger)' : ''}"></i>
            <div class="alert-details">
                <h4 style="${out ? 'color:var(--danger)' : ''}">${item.name}</h4>
                <span>الكمية المتبقية: ${out ? 'نفد تماماً!' : item.qty + ' فقط'}</span>
            </div>
        `;
        list.appendChild(li);
    });
}

// ================== نقطة البيع ==================
let posCart = [];

function renderPOSProducts(filterQuery = '') {
    const grid = document.getElementById('pos-products-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const filtered = inventory.filter(i => i.qty > 0 && i.name.toLowerCase().includes(filterQuery.toLowerCase()));
    if (filtered.length === 0) {
        grid.innerHTML = '<p class="text-secondary" style="grid-column:1/-1;text-align:center;">لا توجد منتجات مطابقة</p>';
        return;
    }
    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'pos-card';
        card.onclick = () => addToCart(item.id);
        card.innerHTML = `
            <span class="pos-stock">${item.qty} متوفر</span>
            <div class="pos-icon"><i class="fa-solid fa-shirt"></i></div>
            <div class="pos-name">${item.name}</div>
            <div class="pos-price">${item.sellPrice} د.ج</div>
        `;
        grid.appendChild(card);
    });
}

document.getElementById('pos-search').addEventListener('input', e => renderPOSProducts(e.target.value));

function addToCart(productId) {
    const product = inventory.find(p => p.id === productId);
    if (!product || product.qty <= 0) return;
    const cartItem = posCart.find(i => i.id === productId);
    if (cartItem) {
        if (cartItem.cartQty < product.qty) cartItem.cartQty++;
        else { alert('الكمية المطلوبة تتجاوز المخزون!'); return; }
    } else {
        posCart.push({ ...product, cartQty: 1 });
    }
    renderCart();
}

function updateCartQty(productId, change) {
    const idx = posCart.findIndex(i => i.id === productId);
    if (idx === -1) return;
    const cartItem = posCart[idx];
    const product = inventory.find(p => p.id === productId);
    cartItem.cartQty += change;
    if (cartItem.cartQty <= 0) posCart.splice(idx, 1);
    else if (cartItem.cartQty > product.qty) { alert('الكمية تتجاوز المخزون!'); cartItem.cartQty = product.qty; }
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    if (!container || !totalEl) return;
    container.innerHTML = '';
    let total = 0;
    if (posCart.length === 0) {
        container.innerHTML = '<div class="empty-cart-msg text-secondary" style="text-align:center;padding:2rem 0;">السلة فارغة حالياً</div>';
        totalEl.innerText = '0.00 د.ج';
        return;
    }
    posCart.forEach(item => {
        total += item.sellPrice * item.cartQty;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <span class="cart-item-price">${item.sellPrice} د.ج</span>
            </div>
            <div class="cart-item-qty">
                <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)"><i class="fa-solid fa-plus"></i></button>
                <span>${item.cartQty}</span>
                <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)"><i class="fa-solid fa-minus"></i></button>
            </div>
        `;
        container.appendChild(div);
    });
    totalEl.innerText = total.toLocaleString('ar-DZ', { minimumFractionDigits: 2 }) + ' د.ج';
}

document.getElementById('btn-checkout').addEventListener('click', async () => {
    if (posCart.length === 0) return;
    let totalRevenue = 0, totalCost = 0;
    const batch = db.batch();
    posCart.forEach(cartItem => {
        const product = inventory.find(p => p.id === cartItem.id);
        if (!product) return;
        const itemTotal = cartItem.sellPrice * cartItem.cartQty;
        const itemCost = cartItem.buyPrice * cartItem.cartQty;
        totalRevenue += itemTotal;
        totalCost += itemCost;
        batch.update(db.collection("inventory").doc(product.id), { qty: product.qty - cartItem.cartQty });
        batch.set(db.collection("sales_history").doc(), {
            productName: product.name, productId: product.id,
            qty: cartItem.cartQty, buyPrice: cartItem.buyPrice, sellPrice: cartItem.sellPrice,
            total: itemTotal, profit: itemTotal - itemCost,
            date: new Date().toLocaleString('ar-DZ'), returned: false,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    });
    storeData.totalIncome += totalRevenue;
    storeData.netProfit += (totalRevenue - totalCost);
    batch.set(db.collection("store").doc("data"), storeData);
    try {
        await batch.commit();
        document.getElementById('receipt-date').innerText = new Date().toLocaleString('ar-DZ');
        document.getElementById('receipt-items').innerHTML = posCart.map(i => `
            <tr><td>${i.name}</td><td>${i.cartQty}</td><td>${i.sellPrice}</td><td>${i.sellPrice * i.cartQty}</td></tr>
        `).join('');
        document.getElementById('receipt-total').innerText = totalRevenue.toLocaleString('ar-DZ', { minimumFractionDigits: 2 });
        document.getElementById('receipt-modal').classList.add('show');
        posCart = [];
        renderCart();
    } catch (err) {
        alert("حدث خطأ أثناء الدفع!");
    }
});

// ================== سجل المبيعات ==================
function renderSalesHistory(filterQuery = '') {
    const list = document.getElementById('history-list');
    if (!list) return;
    list.innerHTML = '';
    const filtered = salesHistory.filter(i => i.productName.toLowerCase().includes(filterQuery.toLowerCase()));
    if (filtered.length === 0) {
        list.innerHTML = '<p class="text-secondary" style="text-align:center;padding:2rem;">لا توجد مبيعات مسجلة</p>';
        return;
    }
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'alert-item';
        div.style.cssText = 'justify-content:space-between;align-items:center;';
        if (item.returned) { div.style.opacity = '0.6'; div.style.backgroundColor = 'rgba(255,255,255,0.05)'; }
        div.innerHTML = `
            <div style="display:flex;gap:1rem;">
                <i class="fa-solid fa-file-invoice" style="color:var(--accent-primary);font-size:1.5rem;margin-top:0.2rem;"></i>
                <div class="alert-details">
                    <h4 style="margin-bottom:0.2rem;${item.returned ? 'text-decoration:line-through;' : ''}">${item.productName}</h4>
                    <span style="color:var(--text-secondary);font-size:0.85rem;">
                        الكمية: ${item.qty} | السعر: ${item.sellPrice} د.ج | الإجمالي: ${item.total} د.ج<br>${item.date}
                    </span>
                    ${item.returned ? '<span style="color:var(--danger);display:block;margin-top:0.3rem;font-weight:bold;">[تم الإرجاع]</span>' : ''}
                </div>
            </div>
            <div>${!item.returned ? `<button class="btn btn-danger" style="padding:0.5rem 1rem;width:auto;font-size:0.9rem;" onclick="returnSaleItem('${item.id}')"><i class="fa-solid fa-rotate-left"></i> إرجاع</button>` : ''}</div>
        `;
        list.appendChild(div);
    });
}

async function returnSaleItem(saleId) {
    if (!confirm('هل أنت متأكد من إرجاع هذه العملية؟')) return;
    const sale = salesHistory.find(s => s.id === saleId);
    if (!sale || sale.returned) return;
    try {
        const batch = db.batch();
        const product = inventory.find(p => p.id === sale.productId);
        if (product) batch.update(db.collection("inventory").doc(sale.productId), { qty: product.qty + sale.qty });
        storeData.totalIncome -= sale.total;
        storeData.netProfit -= sale.profit;
        batch.set(db.collection("store").doc("data"), storeData);
        batch.update(db.collection("sales_history").doc(saleId), { returned: true });
        await batch.commit();
        alert('تم الإرجاع بنجاح');
    } catch (err) {
        alert("حدث خطأ أثناء الإرجاع!");
    }
}

document.getElementById('history-search').addEventListener('input', e => renderSalesHistory(e.target.value));

// ================== المصاريف ==================
document.getElementById('expense-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('exp-amount').value);
    storeData.totalLosses += amount;
    storeData.netProfit -= amount;
    try {
        const batch = db.batch();
        batch.set(db.collection("expenses").doc(), {
            desc: document.getElementById('exp-desc').value, amount,
            date: new Date().toLocaleString('ar-DZ'),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        batch.set(db.collection("store").doc("data"), storeData);
        await batch.commit();
        this.reset();
    } catch (err) {
        alert("حدث خطأ أثناء إضافة المصروف!");
    }
});

function renderExpenses() {
    const list = document.getElementById('expenses-list');
    const totalDisplay = document.getElementById('total-expenses-display');
    if (!list || !totalDisplay) return;
    list.innerHTML = '';
    if (expenses.length === 0) {
        list.innerHTML = '<p class="text-secondary" style="text-align:center;padding:2rem;">لا توجد مصاريف مسجلة</p>';
        totalDisplay.innerText = '0.00 د.ج';
        return;
    }
    expenses.forEach(item => {
        const div = document.createElement('div');
        div.className = 'alert-item';
        div.style.cssText = 'justify-content:space-between;align-items:center;';
        div.innerHTML = `
            <div style="display:flex;gap:1rem;">
                <i class="fa-solid fa-money-bill-wave" style="color:var(--danger);font-size:1.5rem;margin-top:0.2rem;"></i>
                <div class="alert-details">
                    <h4 style="margin-bottom:0.2rem;">${item.desc}</h4>
                    <span style="color:var(--text-secondary);font-size:0.85rem;">${item.date}</span>
                </div>
            </div>
            <span class="text-danger" style="font-weight:bold;">${item.amount.toLocaleString('ar-DZ')} د.ج</span>
        `;
        list.appendChild(div);
    });
    totalDisplay.innerText = expenses.reduce((s, i) => s + i.amount, 0).toLocaleString('ar-DZ', { minimumFractionDigits: 2 }) + ' د.ج';
}

// ================== أجور وسلفيات العمال ==================
// الأجر يُخصم من الأرباح. السلفيات تُخصم من الأجر فقط.

function renderWorkerSalaries() {
    const list = document.getElementById('worker-salaries-list');
    const totalDisplay = document.getElementById('total-salaries-display');
    if (!list || !totalDisplay) return;
    list.innerHTML = '';
    if (workerSalaries.length === 0) {
        list.innerHTML = '<p class="text-secondary" style="text-align:center;padding:1.5rem;">لا توجد أجور مسجلة</p>';
        totalDisplay.innerText = '0.00 د.ج';
        return;
    }
    let total = 0;
    workerSalaries.forEach(sal => {
        total += sal.amount;
        const advTotal = workerAdvances.filter(a => a.salaryId === sal.id).reduce((s, a) => s + a.amount, 0);
        const remaining = sal.amount - advTotal;
        const rColor = remaining < 0 ? 'var(--danger)' : remaining === 0 ? 'var(--success)' : 'var(--warning)';
        const div = document.createElement('div');
        div.className = 'alert-item';
        div.style.cssText = 'flex-direction:column;align-items:stretch;gap:0.75rem;';
        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;gap:0.75rem;align-items:center;">
                    <i class="fa-solid fa-user-tie" style="color:var(--warning);font-size:1.3rem;"></i>
                    <div>
                        <h4 style="margin-bottom:0.15rem;">${sal.workerName}</h4>
                        <span style="color:var(--text-secondary);font-size:0.8rem;">${sal.date}</span>
                    </div>
                </div>
                <span style="color:var(--warning);font-weight:700;">${sal.amount.toLocaleString('ar-DZ')} د.ج</span>
            </div>
            <div style="display:flex;justify-content:space-between;background:rgba(255,255,255,0.04);border-radius:0.5rem;padding:0.6rem 0.9rem;font-size:0.88rem;">
                <span style="color:var(--text-secondary);">السلفيات: <strong style="color:#3b82f6;">${advTotal.toLocaleString('ar-DZ')} د.ج</strong></span>
                <span>المتبقي: <strong style="color:${rColor};">${remaining.toLocaleString('ar-DZ')} د.ج</strong></span>
            </div>
        `;
        list.appendChild(div);
    });
    totalDisplay.innerText = total.toLocaleString('ar-DZ', { minimumFractionDigits: 2 }) + ' د.ج';
}

function renderWorkerAdvances() {
    const list = document.getElementById('worker-advances-list');
    const totalDisplay = document.getElementById('total-advances-display');
    if (!list || !totalDisplay) return;
    list.innerHTML = '';
    if (workerAdvances.length === 0) {
        list.innerHTML = '<p class="text-secondary" style="text-align:center;padding:1.5rem;">لا توجد سلفيات مسجلة</p>';
        totalDisplay.innerText = '0.00 د.ج';
        return;
    }
    let total = 0;
    workerAdvances.forEach(item => {
        total += item.amount;
        const div = document.createElement('div');
        div.className = 'alert-item';
        div.style.cssText = 'justify-content:space-between;align-items:center;';
        div.innerHTML = `
            <div style="display:flex;gap:0.75rem;align-items:center;">
                <i class="fa-solid fa-hand-holding-dollar" style="color:#3b82f6;font-size:1.3rem;"></i>
                <div>
                    <h4 style="margin-bottom:0.15rem;">${item.workerName}</h4>
                    <span style="color:var(--text-secondary);font-size:0.8rem;">${item.date}</span>
                </div>
            </div>
            <span style="color:#3b82f6;font-weight:700;">${item.amount.toLocaleString('ar-DZ')} د.ج</span>
        `;
        list.appendChild(div);
    });
    totalDisplay.innerText = total.toLocaleString('ar-DZ', { minimumFractionDigits: 2 }) + ' د.ج';
}

const workerSalaryForm = document.getElementById('worker-salary-form');
if (workerSalaryForm) workerSalaryForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const workerName = document.getElementById('sal-worker-name').value.trim();
    const amount = parseFloat(document.getElementById('sal-amount').value);
    storeData.totalLosses += amount;
    storeData.netProfit -= amount;
    try {
        const batch = db.batch();
        batch.set(db.collection("worker_salaries").doc(), {
            workerName, amount,
            date: new Date().toLocaleString('ar-DZ'),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        batch.set(db.collection("store").doc("data"), storeData);
        await batch.commit();
        this.reset();
    } catch (err) {
        alert("حدث خطأ أثناء تسجيل الأجر!");
    }
});

const workerAdvanceForm = document.getElementById('worker-advance-form');
if (workerAdvanceForm) workerAdvanceForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const workerName = document.getElementById('adv-worker-name').value.trim();
    const amount = parseFloat(document.getElementById('adv-amount').value);
    const lastSalary = workerSalaries.find(s => s.workerName.trim() === workerName);
    const advTotal = workerAdvances.filter(a => lastSalary && a.salaryId === lastSalary.id).reduce((s, a) => s + a.amount, 0);
    if (lastSalary && (advTotal + amount) > lastSalary.amount) {
        alert(`تحذير: السلفيات تتجاوز الأجر (${lastSalary.amount.toLocaleString('ar-DZ')} د.ج)`);
        return;
    }
    try {
        await db.collection("worker_advances").add({
            workerName, amount,
            salaryId: lastSalary ? lastSalary.id : null,
            date: new Date().toLocaleString('ar-DZ'),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        this.reset();
    } catch (err) {
        alert("حدث خطأ أثناء إضافة السلفية!");
    }
});

// ================== الشعار ==================
function updateLogoUI(logoStr) {
    const img = document.getElementById('app-logo-img');
    if (img) img.src = logoStr || './icon.png';
}

document.getElementById('logo-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
        const base64 = ev.target.result;
        updateLogoUI(base64);
        storeData.logo = base64;
        await db.collection("store").doc("data").set(storeData);
    };
    reader.readAsDataURL(file);
});

// ================== التنقل بين الأقسام ==================
const navItems = document.querySelectorAll('.nav-item');
const pageSections = document.querySelectorAll('.page-section');
const pageTitle = document.getElementById('page-title');

navItems.forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        const targetId = item.getAttribute('data-target');
        pageSections.forEach(s => s.style.display = 'none');
        document.getElementById(targetId).style.display = 'block';
        pageTitle.innerText = item.innerText.trim();
    });
});

// ================== الطباعة ==================
function closeReceipt() { document.getElementById('receipt-modal').classList.remove('show'); }
function printReceipt() { window.print(); }

// ================== التاريخ ==================
document.getElementById('current-date').innerText = new Date().toLocaleDateString('ar-DZ', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

// ================== الأدوار (مدير / عامل) ==================
let currentRole = null;

function applyRole(role) {
    currentRole = role;
    const isWorker = role === 'worker';
    document.querySelectorAll('.nav-item').forEach(el => {
        el.style.display = (isWorker && el.getAttribute('data-target') === 'section-inventory') ? 'none' : 'flex';
    });
    document.querySelectorAll('.card-capital, .card-profit, .card-loss').forEach(el => {
        el.style.display = isWorker ? 'none' : '';
    });
    const dashCards = document.querySelector('.dashboard-cards');
    if (dashCards) dashCards.style.gridTemplateColumns = isWorker ? '1fr' : '';
    document.body.classList.toggle('role-worker', isWorker);
    navItems.forEach(n => n.classList.remove('active'));
    const dashNav = document.querySelector('[data-target="section-dashboard"]');
    if (dashNav) dashNav.classList.add('active');
    pageSections.forEach(s => s.style.display = 'none');
    document.getElementById('section-dashboard').style.display = 'block';
    if (pageTitle) pageTitle.innerText = 'لوحة القيادة';
}

// ================== تسجيل الدخول ==================
function initLogin() {
    const appContainer = document.querySelector('.app-container');
    const adminForm = document.getElementById('admin-login-form');
    const workerForm = document.getElementById('worker-login-form');

    if (adminForm) {
        adminForm.addEventListener('submit', e => {
            e.preventDefault();
            const user = document.getElementById('admin-username').value.trim();
            const pass = document.getElementById('admin-password').value;
            const error = document.getElementById('admin-login-error');

            if (user === 'admin' && pass === 'yasin4321') {
                document.getElementById('admin-login-screen').style.display = 'none';
                appContainer.style.display = 'flex';
                applyRole('admin');
                sessionStorage.setItem('userRole', 'admin');
            } else {
                error.style.display = 'block';
                error.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة!';
            }
        });
    }

    if (workerForm) {
        workerForm.addEventListener('submit', e => {
            e.preventDefault();
            const user = document.getElementById('worker-username').value.trim();
            const pass = document.getElementById('worker-password').value;
            const error = document.getElementById('worker-login-error');

            if (user === 'anis' && pass === 'anis') {
                document.getElementById('worker-login-screen').style.display = 'none';
                appContainer.style.display = 'flex';
                applyRole('worker');
                sessionStorage.setItem('userRole', 'worker');
            } else {
                error.style.display = 'block';
                error.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة!';
            }
        });
    }

    const saved = sessionStorage.getItem('userRole');
    if (saved) {
        document.getElementById('login-selection-screen').style.display = 'none';
        document.getElementById('admin-login-screen').style.display = 'none';
        document.getElementById('worker-login-screen').style.display = 'none';
        appContainer.style.display = 'flex';
        applyRole(saved);
    }
}

function showAdminLogin() {
    document.getElementById('login-selection-screen').style.display = 'none';
    document.getElementById('admin-login-screen').style.display = 'flex';
}

function showWorkerLogin() {
    document.getElementById('login-selection-screen').style.display = 'none';
    document.getElementById('worker-login-screen').style.display = 'flex';
}

function showLoginSelection() {
    document.getElementById('admin-login-screen').style.display = 'none';
    document.getElementById('worker-login-screen').style.display = 'none';
    document.getElementById('login-selection-screen').style.display = 'flex';
    document.getElementById('admin-username').value = '';
    document.getElementById('admin-password').value = '';
    document.getElementById('worker-username').value = '';
    document.getElementById('worker-password').value = '';
    document.getElementById('admin-login-error').style.display = 'none';
    document.getElementById('worker-login-error').style.display = 'none';
}

function logout() {
    sessionStorage.removeItem('userRole');
    currentRole = null;
    showLoginSelection();
    document.querySelector('.app-container').style.display = 'none';
}

initLogin();

// ================== القائمة الجانبية (موبايل) ==================
const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

if (hamburgerBtn && sidebar && sidebarOverlay) {
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
    }
    hamburgerBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('open')) toggleSidebar();
        });
    });
}

updateUI();

// ================== PWA Install ==================
let deferredInstallPrompt = null;
const installBanner = document.getElementById('install-banner');
const btnInstall = document.getElementById('btn-install');
const btnDismiss = document.getElementById('btn-dismiss-install');

window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (!sessionStorage.getItem('installDismissed')) installBanner.style.display = 'flex';
});

if (btnInstall) btnInstall.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    installBanner.style.display = 'none';
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') deferredInstallPrompt = null;
});

if (btnDismiss) btnDismiss.addEventListener('click', () => {
    installBanner.style.display = 'none';
    sessionStorage.setItem('installDismissed', '1');
});

window.addEventListener('appinstalled', () => {
    installBanner.style.display = 'none';
    deferredInstallPrompt = null;
});
