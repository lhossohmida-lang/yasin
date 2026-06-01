// ============================================================
// نظام QR — يُعرَّف مبكراً ليكون متاحاً للضغطات الموجهة من الصفحة
// ============================================================

// مولّد QR متعدد المراحل (متين تجاه فشل CDN)
function renderQRToContainer(container, text, size) {
    if (!container) return null;
    size = size || 220;
    container.innerHTML = '';

    // 1) qrcode-generator (مكتبة محلية ذاتية الاحتواء)
    if (typeof window.qrcode === 'function') {
        try {
            const qr = window.qrcode(0, 'M');
            qr.addData(text);
            qr.make();
            const moduleCount = qr.getModuleCount();
            const cellSize = Math.max(2, Math.floor(size / moduleCount));
            const dataUrl = qr.createDataURL(cellSize, 0);
            const img = document.createElement('img');
            img.src = dataUrl;
            img.alt = 'QR';
            img.style.width = size + 'px';
            img.style.height = size + 'px';
            img.style.imageRendering = 'pixelated';
            container.appendChild(img);
            return { el: img, dataUrl };
        } catch (err) {
            console.warn('qrcode-generator failed:', err);
        }
    }

    // 2) node-qrcode (canvas API)
    if (window.QRCode && typeof window.QRCode.toCanvas === 'function') {
        try {
            const canvas = document.createElement('canvas');
            container.appendChild(canvas);
            window.QRCode.toCanvas(canvas, text, { width: size, margin: 1, color: { dark: '#000', light: '#fff' } });
            return { el: canvas, dataUrl: null };
        } catch (err) {
            console.warn('node-qrcode failed:', err);
        }
    }

    // 3) قشرة آخر اللجوء: خدمة QR خارجية كصورة
    const fallback = document.createElement('img');
    fallback.src = 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(text) + '&margin=1';
    fallback.alt = 'QR';
    fallback.style.width = size + 'px';
    fallback.style.height = size + 'px';
    fallback.addEventListener('error', () => {
        container.innerHTML = '<div style="color:#888;padding:1rem;font-size:0.85rem;">تعذّر إنشاء رمز QR — تحقق من الاتصال</div>';
    });
    container.appendChild(fallback);
    return { el: fallback, dataUrl: fallback.src };
}

function getQRDataURL(el) {
    if (!el) return null;
    if (el.tagName === 'CANVAS') {
        try { return el.toDataURL('image/png'); } catch (_) { return null; }
    }
    if (el.tagName === 'IMG') return el.src;
    return null;
}

// إنشاء نافذة QR ديناميكياً إذا لم تكن موجودة في HTML (احتياط للكاش القديم)
function ensureQRLabelModal() {
    if (document.getElementById('qr-label-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'qr-label-modal';
    modal.className = 'modal';
    modal.innerHTML = ''
        + '<div class="modal-content" style="width:380px;">'
        +   '<div id="qr-print-area" style="background:#fff; padding:1.5rem;">'
        +     '<div class="qr-label-printable">'
        +       '<div class="qr-label-store" id="qr-label-store-name">أناقة للرجال</div>'
        +       '<div id="qr-label-canvas"></div>'
        +       '<div class="qr-label-name" id="qr-label-name">—</div>'
        +       '<div class="qr-label-price" id="qr-label-price">—</div>'
        +       '<div style="font-size:0.7rem;color:#888;margin-top:0.6rem;word-break:break-all;" id="qr-label-code">—</div>'
        +     '</div>'
        +   '</div>'
        +   '<div class="modal-actions no-print">'
        +     '<button class="btn btn-primary" onclick="printQRLabel()"><i class="fa-solid fa-print"></i> طباعة</button>'
        +     '<button class="btn btn-primary" style="background:#374151;" onclick="downloadQRImage()"><i class="fa-solid fa-download"></i> تحميل صورة</button>'
        +     '<button class="btn btn-danger" onclick="closeQRLabel()">إغلاق</button>'
        +   '</div>'
        + '</div>';
    document.body.appendChild(modal);
}

function ensureQRScannerModal() {
    if (document.getElementById('qr-scanner-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'qr-scanner-modal';
    modal.className = 'modal';
    modal.innerHTML = ''
        + '<div class="modal-content qr-scanner-content">'
        +   '<div style="padding:1.5rem; background:var(--bg-surface);">'
        +     '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; padding-bottom:1rem; border-bottom:1px solid var(--border-color);">'
        +       '<h2 style="font-size:1.15rem;"><i class="fa-solid fa-qrcode"></i> مسح رمز QR</h2>'
        +       '<button onclick="closeQRScanner()" style="background:none;border:none;color:var(--text-secondary);font-size:1.3rem;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>'
        +     '</div>'
        +     '<div id="qr-reader"></div>'
        +     '<div class="qr-scan-status" id="qr-scan-status">وجّه الكاميرا نحو رمز QR...</div>'
        +   '</div>'
        + '</div>';
    document.body.appendChild(modal);
}

// مُعرَّف مبكر بحيث لا يكسره أي خطأ لاحق
window.openProductQR = function(productId) {
    try {
        ensureQRLabelModal();
        const product = (typeof inventory !== 'undefined' ? inventory : []).find(p => p.id === productId);
        if (!product) { alert('المنتج غير موجود'); return; }
        const payload = 'SH-P:' + productId;
        const storeName = (typeof storeData !== 'undefined' && storeData && storeData.name) || 'أناقة للرجال';

        const setText = (id, value) => { const el = document.getElementById(id); if (el) el.innerText = value; };
        setText('qr-label-store-name', storeName);
        setText('qr-label-name', product.name);
        setText('qr-label-price', (Number(product.sellPrice) || 0).toLocaleString('ar-DZ') + ' د.ج');
        setText('qr-label-code', payload);

        const container = document.getElementById('qr-label-canvas');
        if (container) renderQRToContainer(container, payload, 220);

        const modal = document.getElementById('qr-label-modal');
        if (modal) modal.classList.add('show');
        else alert('تعذّر فتح نافذة QR — حدّث الصفحة (Ctrl+Shift+R)');
    } catch (err) {
        console.error('openProductQR error:', err);
        alert('حدث خطأ أثناء عرض رمز QR: ' + err.message);
    }
};

window.closeQRLabel = function() {
    const m = document.getElementById('qr-label-modal');
    if (m) m.classList.remove('show');
};

// ================== Firebase ==================
const firebaseConfig = {
    apiKey: "AIzaSyAZwrvW6goAs7SjMPmksXWiU1x57r4UbwU",
    authDomain: "yasin-b993b.firebaseapp.com",
    projectId: "yasin-b993b",
    storageBucket: "yasin-b993b.firebasestorage.app",
    messagingSenderId: "1094100813279",
    appId: "1:1094100813279:web:bb4cf51c0ecc313a58f06a",
    measurementId: "G-NG5F1J11DY"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================== المتغيرات ==================
let inventory = [];
let salesHistory = [];
let expenses = [];
let workerAdvances = [];
let workerSalaries = [];
let accounts = [];
let accountsListener = null;
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
                <button class="btn-qr-card" onclick="openProductQR('${item.id}')">
                    <i class="fa-solid fa-qrcode"></i> QR
                </button>
                <button class="btn-delete-card" onclick="deleteProduct('${item.id}')">
                    <i class="fa-solid fa-trash"></i> حذف
                </button>
            </div>
            <button class="btn-shop-edit" onclick="openShopDetail('${item.id}')">
                <i class="fa-solid fa-tag"></i> تفاصيل المتجر الإلكتروني
            </button>
        `;
        container.appendChild(card);
    });
}

document.getElementById('add-product-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    try {
        const docRef = await db.collection("inventory").add({
            name: document.getElementById('inv-name').value,
            qty: parseInt(document.getElementById('inv-quantity').value),
            buyPrice: parseFloat(document.getElementById('inv-buy').value),
            sellPrice: parseFloat(document.getElementById('inv-sell').value),
            showInShop: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        this.reset();
        // Show QR label automatically for the newly added product
        setTimeout(() => openProductQR(docRef.id), 350);
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
        if (targetId === 'section-ai') {
            renderAIContextSummary();
            checkAIStatus();
        }
        if (targetId === 'section-change-password') {
            const cpUsername = document.getElementById('cp-username');
            if (cpUsername) cpUsername.value = sessionStorage.getItem('username') || '';
            const cpError = document.getElementById('cp-error');
            const cpSuccess = document.getElementById('cp-success');
            if (cpError) cpError.style.display = 'none';
            if (cpSuccess) cpSuccess.style.display = 'none';
            const form = document.getElementById('change-password-form');
            if (form) form.reset();
            if (cpUsername) cpUsername.value = sessionStorage.getItem('username') || '';
        }
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

function startAccountsListener() {
    if (accountsListener) return;
    accountsListener = db.collection("accounts").onSnapshot(snapshot => {
        accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAccounts();
    });
}

async function seedDefaultAccounts() {
    try {
        const snapshot = await db.collection("accounts").limit(1).get();
        if (snapshot.empty) {
            const batch = db.batch();
            batch.set(db.collection("accounts").doc(), { username: "admin", password: "yasin4321", role: "admin", name: "المدير" });
            batch.set(db.collection("accounts").doc(), { username: "anis", password: "anis", role: "worker", name: "أنيس" });
            await batch.commit();
        }
    } catch (err) {
        console.error("Error seeding accounts:", err);
    }
}

function applyRole(role) {
    currentRole = role;
    const isWorker = role === 'worker';
    document.querySelectorAll('.nav-item').forEach(el => {
        const t = el.getAttribute('data-target');
        el.style.display = (isWorker && (t === 'section-inventory' || t === 'section-accounts' || t === 'section-shop' || t === 'section-ai')) ? 'none' : 'flex';
    });
    if (!isWorker) {
        startAccountsListener();
        if (typeof startOnlineOrdersListener === 'function') startOnlineOrdersListener();
    }
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

    async function handleLogin(form, role, screenId, usernameId, passwordId, errorId) {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const user = document.getElementById(usernameId).value.trim();
            const pass = document.getElementById(passwordId).value.trim();
            const error = document.getElementById(errorId);
            const btn = form.querySelector('button[type="submit"]');

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق...';
            error.style.display = 'none';

            try {
                const snapshot = await db.collection("accounts").where("username", "==", user).get();
                const match = snapshot.docs.find(d => d.data().role === role && d.data().password === pass);
                if (match) {
                    document.getElementById(screenId).style.display = 'none';
                    appContainer.style.display = 'flex';
                    applyRole(role);
                    sessionStorage.setItem('userRole', role);
                    sessionStorage.setItem('username', user);
                } else {
                    error.style.display = 'block';
                    error.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة!';
                }
            } catch (err) {
                error.style.display = 'block';
                if (err && err.code === 'permission-denied') {
                    error.textContent = '\u062A\u0639\u0630\u0631 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u062D\u0633\u0627\u0628\u0627\u062A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644. \u0631\u0627\u062C\u0639 \u0642\u0648\u0627\u0639\u062F Firestore \u0648\u0623\u0639\u062F \u0646\u0634\u0631\u0647\u0627.';
                    return;
                }
                error.textContent = 'خطأ في الاتصال، حاول مجددًا';
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'تسجيل الدخول <i class="fa-solid fa-arrow-left"></i>';
            }
        });
    }

    if (adminForm) handleLogin(adminForm, 'admin', 'admin-login-screen', 'admin-username', 'admin-password', 'admin-login-error');
    if (workerForm) handleLogin(workerForm, 'worker', 'worker-login-screen', 'worker-username', 'worker-password', 'worker-login-error');

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
seedDefaultAccounts();

// ================== إدارة الحسابات ==================
function renderAccounts() {
    const list = document.getElementById('accounts-list');
    if (!list) return;
    const currentUser = sessionStorage.getItem('username');
    list.innerHTML = '';
    if (accounts.length === 0) {
        list.innerHTML = '<p class="text-secondary" style="text-align:center;padding:1rem;">لا توجد حسابات</p>';
        return;
    }
    accounts.forEach(acc => {
        const roleLabel = acc.role === 'admin'
            ? '<span class="badge badge-success">مدير</span>'
            : '<span class="badge badge-warning">عامل</span>';
        const isSelf = acc.username === currentUser;
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                    <strong>${acc.name || acc.username}</strong>
                    <span style="color:var(--text-secondary);">@${acc.username}</span>
                    ${roleLabel}
                    ${isSelf ? '<span style="color:var(--text-secondary);font-size:0.8rem;">(أنت)</span>' : ''}
                </div>
                ${isSelf ? '' : `<button class="btn btn-danger" onclick="deleteAccount('${acc.id}')" style="padding:0.4rem 0.9rem;font-size:0.85rem;"><i class="fa-solid fa-trash"></i> حذف</button>`}
            </div>`;
        list.appendChild(item);
    });
}

async function addAccount(e) {
    e.preventDefault();
    const name = document.getElementById('acc-name').value.trim();
    const username = document.getElementById('acc-username').value.trim();
    const password = document.getElementById('acc-password').value;
    const role = document.getElementById('acc-role').value;

    const existing = await db.collection("accounts").where("username", "==", username).get();
    if (!existing.empty) {
        alert('اسم المستخدم مستخدم بالفعل!');
        return;
    }
    await db.collection("accounts").add({ name, username, password, role });
    document.getElementById('add-account-form').reset();
}

async function deleteAccount(id) {
    if (!confirm('هل تريد حذف هذا الحساب؟')) return;
    await db.collection("accounts").doc(id).delete();
}

async function changePassword(e) {
    e.preventDefault();
    const oldPass = document.getElementById('cp-old-password').value;
    const newPass = document.getElementById('cp-new-password').value;
    const confirmPass = document.getElementById('cp-confirm-password').value;
    const errorEl = document.getElementById('cp-error');
    const successEl = document.getElementById('cp-success');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (newPass !== confirmPass) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'كلمة السر الجديدة وتأكيدها غير متطابقين!';
        return;
    }

    if (newPass.length < 4) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'يجب أن تكون كلمة السر الجديدة مكونة من 4 أحرف أو أكثر!';
        return;
    }

    try {
        const username = sessionStorage.getItem('username');
        if (!username) {
            errorEl.style.display = 'block';
            errorEl.textContent = 'لم يتم العثور على اسم المستخدم، الرجاء تسجيل الدخول مجدداً.';
            return;
        }

        const snapshot = await db.collection("accounts").where("username", "==", username).get();
        if (snapshot.empty) {
            errorEl.style.display = 'block';
            errorEl.textContent = 'الحساب غير موجود في قاعدة البيانات!';
            return;
        }

        const accDoc = snapshot.docs[0];
        const accData = accDoc.data();

        if (accData.password !== oldPass) {
            errorEl.style.display = 'block';
            errorEl.textContent = 'كلمة السر القديمة غير صحيحة!';
            return;
        }

        await db.collection("accounts").doc(accDoc.id).update({ password: newPass });
        
        successEl.style.display = 'block';
        successEl.textContent = 'تم تغيير كلمة السر بنجاح!';
        document.getElementById('cp-old-password').value = '';
        document.getElementById('cp-new-password').value = '';
        document.getElementById('cp-confirm-password').value = '';
    } catch (err) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'حدث خطأ أثناء تحديث كلمة السر: ' + err.message;
    }
}

// ================== AI assistant ==================
const AI_TEXT = {
    TITLE: '\u{645}\u{633}\u{627}\u{639}\u{62f} \u{627}\u{644}\u{645}\u{62a}\u{62c}\u{631} \u{627}\u{644}\u{630}\u{643}\u{64a}',
    STATUS_CHECK: '\u{641}\u{62d}\u{635} \u{627}\u{644}\u{627}\u{62a}\u{635}\u{627}\u{644}',
    STATUS_ONLINE: '\u{645}\u{62a}\u{635}\u{644}',
    STATUS_OFFLINE: '\u{63a}\u{64a}\u{631} \u{645}\u{62a}\u{635}\u{644}',
    STATUS_UNKNOWN: '\u{644}\u{645} \u{64a}\u{62a}\u{645} \u{641}\u{62d}\u{635} \u{627}\u{644}\u{627}\u{62a}\u{635}\u{627}\u{644} \u{628}\u{639}\u{62f}',
    LOADING: '\u{62c}\u{627}\u{631}\u{64a} \u{627}\u{644}\u{62a}\u{62d}\u{644}\u{64a}\u{644}...',
    ERROR_GENERIC: '\u{62d}\u{62f}\u{62b} \u{62e}\u{637}\u{623} \u{623}\u{62b}\u{646}\u{627}\u{621} \u{627}\u{644}\u{62a}\u{648}\u{627}\u{635}\u{644} \u{645}\u{639} \u{627}\u{644}\u{645}\u{633}\u{627}\u{639}\u{62f}.',
    EMPTY_ERROR: '\u{627}\u{643}\u{62a}\u{628} \u{633}\u{624}\u{627}\u{644}\u{64b}\u{627} \u{623}\u{648}\u{644}\u{64b}\u{627}.',
    CHAT_EMPTY: '\u{627}\u{633}\u{623}\u{644} \u{639}\u{646} \u{627}\u{644}\u{631}\u{628}\u{62d}\u{60c} \u{627}\u{644}\u{645}\u{62e}\u{632}\u{648}\u{646}\u{60c} \u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{627}\u{62a} \u{627}\u{644}\u{631}\u{627}\u{643}\u{62f}\u{629}\u{60c} \u{623}\u{648} \u{627}\u{642}\u{62a}\u{631}\u{627}\u{62d} \u{639}\u{631}\u{648}\u{636}.',
    TODAY_SALES: '\u{645}\u{628}\u{64a}\u{639}\u{627}\u{62a} \u{627}\u{644}\u{64a}\u{648}\u{645}',
    TODAY_PROFIT: '\u{631}\u{628}\u{62d} \u{627}\u{644}\u{64a}\u{648}\u{645}',
    ORDERS: '\u{639}\u{62f}\u{62f} \u{627}\u{644}\u{637}\u{644}\u{628}\u{627}\u{62a}',
    PRODUCTS: '\u{639}\u{62f}\u{62f} \u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{627}\u{62a}',
    LOW_STOCK: '\u{642}\u{627}\u{631}\u{628} \u{627}\u{644}\u{646}\u{641}\u{627}\u{62f}',
    OUT_STOCK: '\u{646}\u{641}\u{62f} \u{627}\u{644}\u{645}\u{62e}\u{632}\u{648}\u{646}',
    DEAD_STOCK: '\u{645}\u{646}\u{62a}\u{62c}\u{627}\u{62a} \u{631}\u{627}\u{643}\u{62f}\u{629}',
    CURRENCY: '\u{62f}\u{62c}',
    UNKNOWN: '\u{63a}\u{64a}\u{631} \u{645}\u{62d}\u{62f}\u{62f}'
};

const AI_SUGGESTIONS = [
    '\u{627}\u{62d}\u{633}\u{628} \u{631}\u{628}\u{62d} \u{627}\u{644}\u{64a}\u{648}\u{645}',
    '\u{644}\u{62e}\u{635} \u{644}\u{64a} \u{645}\u{628}\u{64a}\u{639}\u{627}\u{62a} \u{627}\u{644}\u{64a}\u{648}\u{645}',
    '\u{645}\u{627} \u{647}\u{64a} \u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{627}\u{62a} \u{627}\u{644}\u{623}\u{643}\u{62b}\u{631} \u{645}\u{628}\u{64a}\u{639}\u{64b}\u{627}\u{61f}',
    '\u{645}\u{627} \u{647}\u{64a} \u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{627}\u{62a} \u{627}\u{644}\u{62a}\u{64a} \u{642}\u{627}\u{631}\u{628}\u{62a} \u{639}\u{644}\u{649} \u{627}\u{644}\u{646}\u{641}\u{627}\u{62f}\u{61f}',
    '\u{645}\u{627} \u{647}\u{64a} \u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{627}\u{62a} \u{627}\u{644}\u{631}\u{627}\u{643}\u{62f}\u{629}\u{61f}',
    '\u{645}\u{627} \u{647}\u{648} \u{623}\u{641}\u{636}\u{644} \u{633}\u{639}\u{631} \u{628}\u{64a}\u{639} \u{644}\u{647}\u{630}\u{627} \u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{61f}',
    '\u{645}\u{627} \u{647}\u{64a} \u{627}\u{644}\u{645}\u{642}\u{627}\u{633}\u{627}\u{62a} \u{627}\u{644}\u{623}\u{643}\u{62b}\u{631} \u{637}\u{644}\u{628}\u{64b}\u{627}\u{61f}',
    '\u{645}\u{627} \u{647}\u{64a} \u{627}\u{644}\u{623}\u{644}\u{648}\u{627}\u{646} \u{627}\u{644}\u{623}\u{643}\u{62b}\u{631} \u{637}\u{644}\u{628}\u{64b}\u{627}\u{61f}',
    '\u{627}\u{642}\u{62a}\u{631}\u{62d} \u{644}\u{64a} \u{639}\u{631}\u{636}\u{64b}\u{627} \u{644}\u{62a}\u{635}\u{631}\u{64a}\u{641} \u{627}\u{644}\u{645}\u{62e}\u{632}\u{648}\u{646}',
    '\u{643}\u{645} \u{623}\u{62d}\u{62a}\u{627}\u{62c} \u{623}\u{646} \u{623}\u{634}\u{62a}\u{631}\u{64a} \u{645}\u{646} \u{647}\u{630}\u{627} \u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{61f}',
    '\u{62d}\u{644}\u{644} \u{644}\u{64a} \u{627}\u{644}\u{641}\u{648}\u{627}\u{62a}\u{64a}\u{631}',
    '\u{623}\u{639}\u{637}\u{646}\u{64a} \u{646}\u{635}\u{627}\u{626}\u{62d} \u{644}\u{632}\u{64a}\u{627}\u{62f}\u{629} \u{627}\u{644}\u{631}\u{628}\u{62d}'
];

const AI_API_BASE = (() => {
    const isHttp = window.location.protocol.startsWith('http');
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const isDevFrontend = isLocalhost && ['3000', '5173'].includes(window.location.port);
    if (isHttp && (!isLocalhost || isDevFrontend)) return '/api/ai';
    return 'http://localhost:5000/api/ai';
})();

let aiChatHistory = [];

function getDocDate(item) {
    if (!item) return null;
    if (item.timestamp && typeof item.timestamp.toDate === 'function') return item.timestamp.toDate();
    if (item.timestamp && item.timestamp.seconds) return new Date(item.timestamp.seconds * 1000);
    if (item.date) {
        const parsed = new Date(item.date);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return null;
}

function isSameDay(date, reference) {
    return date && date.getFullYear() === reference.getFullYear()
        && date.getMonth() === reference.getMonth()
        && date.getDate() === reference.getDate();
}

function isSameMonth(date, reference) {
    return date && date.getFullYear() === reference.getFullYear()
        && date.getMonth() === reference.getMonth();
}

function sumBy(items, mapper) {
    return items.reduce((sum, item) => sum + (Number(mapper(item)) || 0), 0);
}

function roundAmount(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
}

function formatAICurrency(value) {
    return `${roundAmount(value).toLocaleString('ar-DZ')} ${AI_TEXT.CURRENCY}`;
}

function summarizeProductSales(sales) {
    const grouped = new Map();
    sales.forEach(sale => {
        const key = sale.productId || sale.productName || AI_TEXT.UNKNOWN;
        const current = grouped.get(key) || {
            name: sale.productName || AI_TEXT.UNKNOWN,
            soldQty: 0,
            revenue: 0,
            profit: 0
        };
        current.soldQty += Number(sale.qty) || 0;
        current.revenue += Number(sale.total) || 0;
        current.profit += Number(sale.profit) || 0;
        grouped.set(key, current);
    });
    return Array.from(grouped.values())
        .sort((a, b) => b.soldQty - a.soldQty)
        .slice(0, 10)
        .map(item => ({
            name: item.name,
            soldQty: item.soldQty,
            revenue: roundAmount(item.revenue),
            profit: roundAmount(item.profit)
        }));
}

function summarizeInventoryBy(fieldName) {
    const grouped = new Map();
    inventory.forEach(item => {
        const key = item[fieldName] || AI_TEXT.UNKNOWN;
        const current = grouped.get(key) || {
            name: key,
            productsCount: 0,
            stockQty: 0,
            purchaseValue: 0,
            expectedSalesValue: 0
        };
        current.productsCount += 1;
        current.stockQty += Number(item.qty) || 0;
        current.purchaseValue += (Number(item.qty) || 0) * (Number(item.buyPrice) || 0);
        current.expectedSalesValue += (Number(item.qty) || 0) * (Number(item.sellPrice) || 0);
        grouped.set(key, current);
    });
    return Array.from(grouped.values())
        .sort((a, b) => b.stockQty - a.stockQty)
        .slice(0, 12)
        .map(item => ({
            ...item,
            purchaseValue: roundAmount(item.purchaseValue),
            expectedSalesValue: roundAmount(item.expectedSalesValue)
        }));
}

function buildAIBusinessContext() {
    const now = new Date();
    const activeSales = salesHistory.filter(sale => !sale.returned);
    const todaySales = activeSales.filter(sale => isSameDay(getDocDate(sale), now));
    const monthSales = activeSales.filter(sale => isSameMonth(getDocDate(sale), now));
    const expenseRows = [
        ...expenses.map(item => ({ ...item, aiType: 'expense' })),
        ...workerSalaries.map(item => ({ ...item, aiType: 'salary' }))
    ];
    const todayExpenses = expenseRows.filter(item => isSameDay(getDocDate(item), now));
    const monthExpenses = expenseRows.filter(item => isSameMonth(getDocDate(item), now));
    const soldProductKeys = new Set(activeSales.map(sale => sale.productId || sale.productName));
    const deadStockProducts = inventory
        .filter(item => (Number(item.qty) || 0) > 0 && !soldProductKeys.has(item.id) && !soldProductKeys.has(item.name))
        .sort((a, b) => (Number(b.qty) || 0) - (Number(a.qty) || 0))
        .slice(0, 15);

    const todaySalesTotal = sumBy(todaySales, sale => sale.total);
    const todayPurchaseCost = sumBy(todaySales, sale => (Number(sale.buyPrice) || 0) * (Number(sale.qty) || 0));
    const todayExpenseTotal = sumBy(todayExpenses, item => item.amount);
    const monthSalesTotal = sumBy(monthSales, sale => sale.total);
    const monthExpenseTotal = sumBy(monthExpenses, item => item.amount);

    return {
        appKnowledge: {
            appName: 'إدارة متجر الملابس',
            pages: Array.from(document.querySelectorAll('.nav-item')).map(item => item.innerText.trim()),
            calculations: {
                profit: 'sales - purchaseCost - expenses',
                profitMargin: 'profit / sales * 100',
                stockValue: 'qty * purchaseCost',
                expectedRevenue: 'qty * sellPrice'
            }
        },
        today: {
            salesTotal: roundAmount(todaySalesTotal),
            purchaseCost: roundAmount(todayPurchaseCost),
            expenses: roundAmount(todayExpenseTotal),
            profit: roundAmount(todaySalesTotal - todayPurchaseCost - todayExpenseTotal),
            ordersCount: todaySales.length,
            soldItemsCount: sumBy(todaySales, sale => sale.qty)
        },
        month: {
            salesTotal: roundAmount(monthSalesTotal),
            profit: roundAmount(sumBy(monthSales, sale => sale.profit) - monthExpenseTotal),
            ordersCount: monthSales.length,
            soldItemsCount: sumBy(monthSales, sale => sale.qty)
        },
        inventory: {
            totalProducts: inventory.length,
            totalStockQty: sumBy(inventory, item => item.qty),
            lowStockCount: inventory.filter(item => (Number(item.qty) || 0) > 0 && (Number(item.qty) || 0) <= 3).length,
            outOfStockCount: inventory.filter(item => (Number(item.qty) || 0) <= 0).length,
            deadStockCount: deadStockProducts.length,
            stockPurchaseValue: roundAmount(sumBy(inventory, item => (Number(item.qty) || 0) * (Number(item.buyPrice) || 0))),
            expectedSalesValue: roundAmount(sumBy(inventory, item => (Number(item.qty) || 0) * (Number(item.sellPrice) || 0)))
        },
        topSellingProducts: summarizeProductSales(activeSales),
        lowStockProducts: inventory
            .filter(item => (Number(item.qty) || 0) > 0 && (Number(item.qty) || 0) <= 3)
            .sort((a, b) => (Number(a.qty) || 0) - (Number(b.qty) || 0))
            .slice(0, 15)
            .map(item => ({
                name: item.name,
                qty: Number(item.qty) || 0,
                sellPrice: Number(item.sellPrice) || 0,
                buyPrice: Number(item.buyPrice) || 0
            })),
        deadStockProducts: deadStockProducts.map(item => ({
            name: item.name,
            qty: Number(item.qty) || 0,
            sellPrice: Number(item.sellPrice) || 0,
            buyPrice: Number(item.buyPrice) || 0
        })),
        inventorySummary: inventory.slice(0, 20).map(item => ({
            name: item.name,
            qty: Number(item.qty) || 0,
            buyPrice: Number(item.buyPrice) || 0,
            sellPrice: Number(item.sellPrice) || 0,
            stockValue: roundAmount((Number(item.qty) || 0) * (Number(item.buyPrice) || 0)),
            expectedRevenue: roundAmount((Number(item.qty) || 0) * (Number(item.sellPrice) || 0))
        })),
        categoriesSummary: summarizeInventoryBy('category'),
        sizesSummary: summarizeInventoryBy('size'),
        colorsSummary: summarizeInventoryBy('color'),
        recentSales: activeSales.slice(0, 12).map(sale => ({
            productName: sale.productName,
            qty: Number(sale.qty) || 0,
            sellPrice: Number(sale.sellPrice) || 0,
            total: Number(sale.total) || 0,
            profit: Number(sale.profit) || 0,
            date: sale.date || ''
        })),
        currency: AI_TEXT.CURRENCY
    };
}

async function checkAIStatus() {
    const pill = document.getElementById('ai-status-pill');
    const label = document.getElementById('ai-status-label');
    const detail = document.getElementById('ai-status-detail');
    if (!pill || !label || !detail) return;

    pill.className = 'ai-status-pill loading';
    label.textContent = AI_TEXT.LOADING;
    detail.textContent = '';

    try {
        const response = await fetch(`${AI_API_BASE}/status`);
        const data = await response.json();
        if (data.online) {
            pill.className = 'ai-status-pill online';
            label.textContent = AI_TEXT.STATUS_ONLINE;
            detail.textContent = `${data.provider || 'tencent-hy3-openrouter'} · ${data.model || ''}`;
        } else {
            pill.className = 'ai-status-pill offline';
            label.textContent = AI_TEXT.STATUS_OFFLINE;
            detail.textContent = data.error || AI_TEXT.ERROR_GENERIC;
        }
    } catch (err) {
        pill.className = 'ai-status-pill offline';
        label.textContent = AI_TEXT.STATUS_OFFLINE;
        detail.textContent = AI_TEXT.ERROR_GENERIC;
    }
}

async function sendAIMessage(message, businessContext, history) {
    const response = await fetch(`${AI_API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, businessContext, history })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || AI_TEXT.ERROR_GENERIC);
    return data;
}

function renderAIContextSummary() {
    const container = document.getElementById('ai-context-summary');
    if (!container) return;

    const context = buildAIBusinessContext();
    const rows = [
        [AI_TEXT.TODAY_SALES, formatAICurrency(context.today.salesTotal)],
        [AI_TEXT.TODAY_PROFIT, formatAICurrency(context.today.profit)],
        [AI_TEXT.ORDERS, context.today.ordersCount],
        [AI_TEXT.PRODUCTS, context.inventory.totalProducts],
        [AI_TEXT.LOW_STOCK, context.inventory.lowStockCount],
        [AI_TEXT.OUT_STOCK, context.inventory.outOfStockCount],
        [AI_TEXT.DEAD_STOCK, context.inventory.deadStockCount]
    ];

    container.innerHTML = '';
    rows.forEach(([label, value]) => {
        const item = document.createElement('div');
        item.className = 'ai-context-item';
        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        const valueEl = document.createElement('strong');
        valueEl.textContent = value;
        item.append(labelEl, valueEl);
        container.appendChild(item);
    });
}

function renderAISuggestions() {
    const container = document.getElementById('ai-suggestions');
    const input = document.getElementById('ai-message-input');
    if (!container || !input) return;

    container.innerHTML = '';
    AI_SUGGESTIONS.forEach(text => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ai-suggestion';
        button.textContent = text;
        button.addEventListener('click', () => {
            input.value = text;
            input.focus();
        });
        container.appendChild(button);
    });
}

function renderAIChat() {
    const messages = document.getElementById('ai-chat-messages');
    if (!messages) return;
    messages.innerHTML = '';

    if (aiChatHistory.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'ai-empty-state';
        empty.textContent = AI_TEXT.CHAT_EMPTY;
        messages.appendChild(empty);
        return;
    }

    aiChatHistory.forEach(item => {
        const row = document.createElement('div');
        row.className = `ai-message ${item.role}`;
        row.textContent = item.content;
        messages.appendChild(row);
    });
    messages.scrollTop = messages.scrollHeight;
}

function showAIError(message) {
    const error = document.getElementById('ai-error');
    if (!error) return;
    error.textContent = message || '';
    error.style.display = message ? 'block' : 'none';
}

function initAIChat() {
    const form = document.getElementById('ai-chat-form');
    const input = document.getElementById('ai-message-input');
    const clearBtn = document.getElementById('ai-clear-chat');
    const checkBtn = document.getElementById('ai-check-status');
    const sendBtn = document.getElementById('ai-send-message');
    if (!form || !input) return;

    renderAISuggestions();
    renderAIContextSummary();
    renderAIChat();
    checkAIStatus();

    if (checkBtn) checkBtn.addEventListener('click', checkAIStatus);
    if (clearBtn) clearBtn.addEventListener('click', () => {
        aiChatHistory = [];
        showAIError('');
        renderAIChat();
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const message = input.value.trim();
        if (!message) {
            showAIError(AI_TEXT.EMPTY_ERROR);
            return;
        }

        showAIError('');
        const requestHistory = aiChatHistory.slice(-8);
        aiChatHistory.push({ role: 'user', content: message });
        aiChatHistory.push({ role: 'assistant', content: AI_TEXT.LOADING });
        input.value = '';
        if (sendBtn) sendBtn.disabled = true;
        renderAIChat();

        try {
            const businessContext = buildAIBusinessContext();
            const data = await sendAIMessage(message, businessContext, requestHistory);
            aiChatHistory[aiChatHistory.length - 1] = {
                role: 'assistant',
                content: data.reply || AI_TEXT.ERROR_GENERIC
            };
        } catch (err) {
            aiChatHistory[aiChatHistory.length - 1] = {
                role: 'assistant',
                content: err.message || AI_TEXT.ERROR_GENERIC
            };
            showAIError(err.message || AI_TEXT.ERROR_GENERIC);
        } finally {
            if (sendBtn) sendBtn.disabled = false;
            renderAIChat();
        }
    });
}

initAIChat();

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

// ================== المتجر الإلكتروني — الطلبات الأونلاين ==================
let onlineOrders = [];
let onlineOrdersListener = null;

function startOnlineOrdersListener() {
    if (onlineOrdersListener) return;
    onlineOrdersListener = db.collection('online_orders')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snap => {
            onlineOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            renderOnlineOrders();
            renderOnlineOrdersStats();
        }, err => {
            console.error('Online orders load failed:', err);
            const list = document.getElementById('online-orders-list');
            if (list) {
                list.innerHTML = '<p class="text-secondary" style="text-align:center;padding:2rem;">تعذر تحميل الطلبات. تحقق من قواعد Firestore.</p>';
            }
        });
}

const ORDER_STATUS = {
    new: { label: 'جديد', class: 'status-new', icon: 'fa-circle' },
    processing: { label: 'قيد التجهيز', class: 'status-processing', icon: 'fa-box-open' },
    shipped: { label: 'تم الشحن', class: 'status-shipped', icon: 'fa-truck' },
    delivered: { label: 'تم التسليم', class: 'status-delivered', icon: 'fa-check-circle' },
    cancelled: { label: 'ملغي', class: 'status-cancelled', icon: 'fa-circle-xmark' }
};

function renderOnlineOrdersStats() {
    const newCount = onlineOrders.filter(o => o.status === 'new').length;
    const progCount = onlineOrders.filter(o => o.status === 'processing' || o.status === 'shipped').length;
    const delvCount = onlineOrders.filter(o => o.status === 'delivered').length;
    const revenue = onlineOrders
        .filter(o => o.status === 'delivered')
        .reduce((s, o) => s + (Number(o.totalPrice) || 0), 0);

    const el1 = document.getElementById('shop-new-count');
    const el2 = document.getElementById('shop-progress-count');
    const el3 = document.getElementById('shop-delivered-count');
    const el4 = document.getElementById('shop-revenue');
    if (el1) el1.innerText = newCount;
    if (el2) el2.innerText = progCount;
    if (el3) el3.innerText = delvCount;
    if (el4) el4.innerText = revenue.toLocaleString('ar-DZ', { minimumFractionDigits: 2 }) + ' د.ج';
}

function renderOnlineOrders() {
    const list = document.getElementById('online-orders-list');
    if (!list) return;
    const search = (document.getElementById('shop-orders-search')?.value || '').trim().toLowerCase();
    const filterStatus = document.getElementById('shop-orders-filter')?.value || 'all';

    let filtered = onlineOrders.slice();
    if (filterStatus !== 'all') filtered = filtered.filter(o => o.status === filterStatus);
    if (search) {
        filtered = filtered.filter(o =>
            String(o.orderNumber || '').toLowerCase().includes(search) ||
            String(o.customerName || '').toLowerCase().includes(search) ||
            String(o.phone || '').toLowerCase().includes(search)
        );
    }

    if (filtered.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:3rem 1rem; color:var(--text-secondary);">
                <i class="fa-solid fa-inbox" style="font-size:3rem; opacity:0.4; margin-bottom:1rem; display:block;"></i>
                <p>${onlineOrders.length === 0 ? 'لا توجد طلبات أونلاين بعد' : 'لا توجد طلبات مطابقة للبحث'}</p>
            </div>`;
        return;
    }

    list.innerHTML = '';
    filtered.forEach(order => {
        const status = ORDER_STATUS[order.status] || ORDER_STATUS.new;
        const created = order.createdAt?.toDate?.()?.toLocaleString('ar-DZ') || '';
        const card = document.createElement('div');
        card.className = 'online-order-card';
        card.innerHTML = `
            <div class="online-order-head">
                <div>
                    <span class="online-order-number">#${escapeForHTML(order.orderNumber || order.id)}</span>
                    <span style="color:var(--text-secondary); font-size:0.82rem; margin-right:0.7rem;">${escapeForHTML(created)}</span>
                </div>
                <span class="status-badge ${status.class}"><i class="fa-solid ${status.icon}"></i> ${status.label}</span>
            </div>
            <div class="online-order-customer">
                <div><b>الزبون:</b> ${escapeForHTML(order.customerName)}</div>
                <div><b>الهاتف:</b> ${escapeForHTML(order.phone)}</div>
                <div><b>الولاية:</b> ${escapeForHTML(order.wilaya)}</div>
                <div><b>البلدية:</b> ${escapeForHTML(order.baladiya)}</div>
                <div style="grid-column:1/-1"><b>العنوان:</b> ${escapeForHTML(order.address)}</div>
                <div><b>المنتجات:</b> ${order.items?.length || 0} قطعة</div>
                <div><b>الدفع:</b> ${order.paymentMethod === 'cod' ? 'عند الاستلام' : escapeForHTML(order.paymentMethod || '-')}</div>
            </div>
            <div class="online-order-foot">
                <span class="online-order-total">${(Number(order.totalPrice) || 0).toLocaleString('ar-DZ')} د.ج</span>
                <div class="online-order-actions">
                    <button class="btn-mini" onclick="openOrderDetail('${order.id}')"><i class="fa-solid fa-eye"></i> التفاصيل</button>
                    ${order.status === 'new' ? `<button class="btn-mini btn-mini-success" onclick="updateOrderStatus('${order.id}','processing')"><i class="fa-solid fa-check"></i> قبول</button>` : ''}
                    ${order.status === 'processing' ? `<button class="btn-mini btn-mini-success" onclick="updateOrderStatus('${order.id}','shipped')"><i class="fa-solid fa-truck"></i> شحن</button>` : ''}
                    ${order.status === 'shipped' ? `<button class="btn-mini btn-mini-success" onclick="updateOrderStatus('${order.id}','delivered')"><i class="fa-solid fa-circle-check"></i> تسليم</button>` : ''}
                    ${(order.status !== 'cancelled' && order.status !== 'delivered') ? `<button class="btn-mini btn-mini-danger" onclick="updateOrderStatus('${order.id}','cancelled')"><i class="fa-solid fa-xmark"></i> إلغاء</button>` : ''}
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

function escapeForHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

window.openOrderDetail = function(orderId) {
    const order = onlineOrders.find(o => o.id === orderId);
    if (!order) return;
    const content = document.getElementById('order-detail-content');
    const actions = document.getElementById('order-detail-actions');
    const status = ORDER_STATUS[order.status] || ORDER_STATUS.new;
    const created = order.createdAt?.toDate?.()?.toLocaleString('ar-DZ') || '';

    const itemsHtml = (order.items || []).map(item => {
        const img = item.image
            ? `<img src="${item.image}" alt="" onerror="this.outerHTML='<div class=\\'order-item-icon\\'><i class=\\'fa-solid fa-shirt\\'></i></div>'">`
            : `<div class="order-item-icon"><i class="fa-solid fa-shirt"></i></div>`;
        return `
            <div class="order-item-row">
                ${img}
                <div class="order-item-info">
                    <h4>${escapeForHTML(item.name)}</h4>
                    <span>المقاس: ${escapeForHTML(item.size || '-')} · اللون: ${escapeForHTML(item.colorName || '-')} · الكمية: ${item.qty}</span>
                </div>
                <div style="color:var(--accent-primary); font-weight:700; white-space:nowrap;">${(item.sellPrice * item.qty).toLocaleString('ar-DZ')} د.ج</div>
            </div>`;
    }).join('');

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <strong style="color:var(--accent-primary); font-size:1.1rem;">#${escapeForHTML(order.orderNumber || order.id)}</strong>
            <span class="status-badge ${status.class}"><i class="fa-solid ${status.icon}"></i> ${status.label}</span>
        </div>
        <div class="online-order-customer" style="margin-bottom:1rem;">
            <div><b>الزبون:</b> ${escapeForHTML(order.customerName)}</div>
            <div><b>الهاتف:</b> ${escapeForHTML(order.phone)}</div>
            <div><b>الولاية:</b> ${escapeForHTML(order.wilaya)}</div>
            <div><b>البلدية:</b> ${escapeForHTML(order.baladiya)}</div>
            <div style="grid-column:1/-1"><b>العنوان:</b> ${escapeForHTML(order.address)}</div>
            ${order.notes ? `<div style="grid-column:1/-1"><b>ملاحظات:</b> ${escapeForHTML(order.notes)}</div>` : ''}
            <div><b>تاريخ الطلب:</b> ${escapeForHTML(created)}</div>
            <div><b>الدفع:</b> ${order.paymentMethod === 'cod' ? 'عند الاستلام' : escapeForHTML(order.paymentMethod)}</div>
        </div>
        <h4 style="margin-bottom:0.6rem;">المنتجات</h4>
        <div class="order-items-list" style="margin-bottom:1rem;">${itemsHtml}</div>
        <div style="background:rgba(0,0,0,0.2); border-radius:0.5rem; padding:0.85rem 1rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem; color:var(--text-secondary);"><span>المجموع الفرعي</span><span>${(Number(order.subtotal) || 0).toLocaleString('ar-DZ')} د.ج</span></div>
            ${order.discount ? `<div style="display:flex; justify-content:space-between; margin-bottom:0.3rem; color:var(--success);"><span>الخصم${order.promoCode ? ' (' + escapeForHTML(order.promoCode) + ')' : ''}</span><span>- ${(Number(order.discount) || 0).toLocaleString('ar-DZ')} د.ج</span></div>` : ''}
            <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem; color:var(--text-secondary);"><span>الشحن</span><span>${order.shipping ? (Number(order.shipping)).toLocaleString('ar-DZ') + ' د.ج' : 'مجاني'}</span></div>
            <div style="display:flex; justify-content:space-between; padding-top:0.6rem; margin-top:0.4rem; border-top:1px solid var(--border-color); font-weight:700; font-size:1.05rem;"><span>الإجمالي</span><span class="text-blue">${(Number(order.totalPrice) || 0).toLocaleString('ar-DZ')} د.ج</span></div>
        </div>
    `;

    let actionButtons = '';
    if (order.status === 'new') actionButtons += `<button class="btn btn-primary" style="width:auto; padding:0.6rem 1rem;" onclick="updateOrderStatus('${order.id}','processing'); closeOrderDetail();"><i class="fa-solid fa-check"></i> قبول الطلب</button>`;
    if (order.status === 'processing') actionButtons += `<button class="btn btn-primary" style="width:auto; padding:0.6rem 1rem;" onclick="updateOrderStatus('${order.id}','shipped'); closeOrderDetail();"><i class="fa-solid fa-truck"></i> شحن</button>`;
    if (order.status === 'shipped') actionButtons += `<button class="btn btn-primary" style="width:auto; padding:0.6rem 1rem;" onclick="updateOrderStatus('${order.id}','delivered'); closeOrderDetail();"><i class="fa-solid fa-circle-check"></i> تأكيد التسليم</button>`;
    if (order.status !== 'cancelled' && order.status !== 'delivered') actionButtons += `<button class="btn btn-danger" style="width:auto; padding:0.6rem 1rem;" onclick="updateOrderStatus('${order.id}','cancelled'); closeOrderDetail();"><i class="fa-solid fa-xmark"></i> إلغاء الطلب</button>`;
    actionButtons += `<button class="btn btn-danger" style="width:auto; padding:0.6rem 1rem; background:#374151;" onclick="closeOrderDetail()">إغلاق</button>`;
    actions.innerHTML = actionButtons;

    document.getElementById('order-detail-modal').classList.add('show');
};

window.closeOrderDetail = function() {
    document.getElementById('order-detail-modal').classList.remove('show');
};

window.updateOrderStatus = async function(orderId, newStatus) {
    const order = onlineOrders.find(o => o.id === orderId);
    if (!order) return;

    // When moving from "new" to "processing", decrement stock
    if (order.status === 'new' && newStatus === 'processing') {
        // First verify all items have enough stock
        for (const item of (order.items || [])) {
            const product = inventory.find(p => p.id === item.productId);
            if (!product || (Number(product.qty) || 0) < (Number(item.qty) || 0)) {
                alert(`لا يمكن قبول الطلب: الكمية المتوفرة من "${item.name}" غير كافية.`);
                return;
            }
        }
        try {
            const batch = db.batch();
            (order.items || []).forEach(item => {
                const product = inventory.find(p => p.id === item.productId);
                if (product) {
                    batch.update(db.collection('inventory').doc(product.id), { qty: (Number(product.qty) || 0) - (Number(item.qty) || 0) });
                }
            });
            batch.update(db.collection('online_orders').doc(orderId), {
                status: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                stockDeducted: true
            });
            await batch.commit();
            return;
        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء قبول الطلب وخصم المخزون.');
            return;
        }
    }

    // When moving to "delivered", credit revenue
    if (newStatus === 'delivered' && order.status !== 'delivered') {
        try {
            const batch = db.batch();
            const revenue = Number(order.totalPrice) || 0;
            const cost = (order.items || []).reduce((s, it) => s + (Number(it.buyPrice) || 0) * (Number(it.qty) || 0), 0);
            storeData.totalIncome = (Number(storeData.totalIncome) || 0) + revenue;
            storeData.netProfit = (Number(storeData.netProfit) || 0) + (revenue - cost);
            batch.set(db.collection('store').doc('data'), storeData);
            batch.update(db.collection('online_orders').doc(orderId), {
                status: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                revenueAccounted: true
            });
            await batch.commit();
            return;
        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء تأكيد التسليم.');
            return;
        }
    }

    // When cancelling an order that already deducted stock, restore stock
    if (newStatus === 'cancelled' && order.stockDeducted && order.status !== 'delivered') {
        try {
            const batch = db.batch();
            (order.items || []).forEach(item => {
                const product = inventory.find(p => p.id === item.productId);
                if (product) {
                    batch.update(db.collection('inventory').doc(product.id), { qty: (Number(product.qty) || 0) + (Number(item.qty) || 0) });
                }
            });
            batch.update(db.collection('online_orders').doc(orderId), {
                status: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                stockDeducted: false
            });
            await batch.commit();
            return;
        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء إلغاء الطلب.');
            return;
        }
    }

    // Default: just update status
    try {
        await db.collection('online_orders').doc(orderId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء تحديث حالة الطلب.');
    }
};

// Search & filter listeners
const shopOrdersSearch = document.getElementById('shop-orders-search');
const shopOrdersFilter = document.getElementById('shop-orders-filter');
if (shopOrdersSearch) shopOrdersSearch.addEventListener('input', renderOnlineOrders);
if (shopOrdersFilter) shopOrdersFilter.addEventListener('change', renderOnlineOrders);

// ================== تفاصيل المنتج للمتجر الإلكتروني ==================
window.openShopDetail = function(productId) {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;
    document.getElementById('sd-product-id').value = productId;
    document.getElementById('sd-category').value = product.category || 'men';
    document.getElementById('sd-image').value = product.image || '';
    document.getElementById('sd-description').value = product.description || '';
    document.getElementById('sd-sizes').value = Array.isArray(product.sizes) ? product.sizes.join(', ') : '';
    document.getElementById('sd-colors').value = Array.isArray(product.colors)
        ? product.colors.map(c => typeof c === 'string' ? c : `${c.name || ''}|${c.hex || ''}`).join(', ')
        : '';
    document.getElementById('sd-show').checked = product.showInShop !== false;
    document.getElementById('sd-new').checked = product.isNew === true;
    document.getElementById('shop-detail-modal').classList.add('show');
};

window.closeShopDetail = function() {
    document.getElementById('shop-detail-modal').classList.remove('show');
};

const shopDetailForm = document.getElementById('shop-detail-form');
if (shopDetailForm) {
    shopDetailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('sd-product-id').value;
        const sizes = document.getElementById('sd-sizes').value
            .split(',').map(s => s.trim()).filter(Boolean);
        const colors = document.getElementById('sd-colors').value
            .split(',').map(s => s.trim()).filter(Boolean)
            .map(token => {
                const [name, hex] = token.split('|').map(x => (x || '').trim());
                return { name: name || token, hex: hex || '#666666' };
            });
        const update = {
            category: document.getElementById('sd-category').value,
            image: document.getElementById('sd-image').value.trim(),
            description: document.getElementById('sd-description').value.trim(),
            sizes,
            colors,
            showInShop: document.getElementById('sd-show').checked,
            isNew: document.getElementById('sd-new').checked
        };
        try {
            await db.collection('inventory').doc(id).update(update);
            closeShopDetail();
        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء حفظ التفاصيل.');
        }
    });
}

// ================== Seed demo data ==================
const DEMO_PRODUCTS = [
    { name: 'هودي أساسي', qty: 20, buyPrice: 3500, sellPrice: 5600, category: 'hoodies', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80', description: 'هودي قطني عصري بقصة مريحة وخامة فاخرة، مثالي لإطلالاتك اليومية.', sizes: ['S','M','L','XL','XXL'], colors: [{name:'كحلي',hex:'#1E3A8A'},{name:'أسود',hex:'#0F172A'},{name:'رمادي',hex:'#64748B'}], isNew: true },
    { name: 'جاكيت جينز', qty: 15, buyPrice: 5000, sellPrice: 7900, category: 'men', image: 'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=600&q=80', description: 'جاكيت جينز كلاسيكي يضفي لمسة كاجوال أنيقة على إطلالتك.', sizes: ['M','L','XL'], colors: [{name:'أزرق',hex:'#1D4ED8'},{name:'أسود',hex:'#0F172A'}], isNew: true },
    { name: 'قميص أوفر سايز', qty: 25, buyPrice: 2800, sellPrice: 4800, category: 'men', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80', description: 'قميص أوفر سايز بخامة قطنية ناعمة وقصة عصرية.', sizes: ['S','M','L','XL'], colors: [{name:'بيج',hex:'#D4C5A0'},{name:'أبيض',hex:'#F8FAFC'}], isNew: true },
    { name: 'تيشيرت قطني', qty: 40, buyPrice: 1500, sellPrice: 3200, category: 'men', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80', description: 'تيشيرت قطن 100% بقصة كلاسيكية مناسبة للاستخدام اليومي.', sizes: ['S','M','L','XL','XXL'], colors: [{name:'أسود',hex:'#0F172A'},{name:'أبيض',hex:'#F8FAFC'},{name:'كحلي',hex:'#1E3A8A'},{name:'رمادي',hex:'#64748B'}], isNew: true },
    { name: 'كاب أسود', qty: 30, buyPrice: 900, sellPrice: 2300, category: 'accessories', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80', description: 'كاب رياضي أسود بتصميم بسيط وعصري.', sizes: ['قياس واحد'], colors: [{name:'أسود',hex:'#0F172A'}], isNew: true },
    { name: 'حذاء أبيض', qty: 18, buyPrice: 4500, sellPrice: 7500, category: 'shoes', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', description: 'حذاء أبيض كلاسيكي بنعل مريح يناسب جميع الإطلالات.', sizes: ['39','40','41','42','43','44'], colors: [{name:'أبيض',hex:'#F8FAFC'}] },
    { name: 'حقيبة ظهر', qty: 12, buyPrice: 3200, sellPrice: 5500, category: 'accessories', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80', description: 'حقيبة ظهر متينة بتصميم عملي وأنيق وجيوب متعددة.', sizes: ['قياس واحد'], colors: [{name:'أسود',hex:'#0F172A'}] },
    { name: 'فستان نسائي', qty: 14, buyPrice: 4000, sellPrice: 6800, category: 'women', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80', description: 'فستان نسائي أنيق لجميع المناسبات.', sizes: ['S','M','L','XL'], colors: [{name:'كحلي',hex:'#1E3A8A'},{name:'أسود',hex:'#0F172A'}] },
    { name: 'تيشيرت أطفال', qty: 22, buyPrice: 800, sellPrice: 1800, category: 'kids', image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=80', description: 'تيشيرت أطفال قطني بألوان مبهجة.', sizes: ['2-4','4-6','6-8','8-10'], colors: [{name:'أحمر',hex:'#DC2626'},{name:'أزرق',hex:'#2563EB'}] },
    { name: 'سويتشيرت نسائي', qty: 16, buyPrice: 2900, sellPrice: 4900, category: 'hoodies', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80', description: 'سويتشيرت نسائي بخامة دافئة وقصة عصرية.', sizes: ['S','M','L','XL'], colors: [{name:'وردي',hex:'#EC4899'},{name:'رمادي',hex:'#64748B'}] }
];

const btnSeedDemo = document.getElementById('btn-seed-demo');
if (btnSeedDemo) {
    btnSeedDemo.addEventListener('click', async () => {
        if (!confirm('سيتم إضافة ' + DEMO_PRODUCTS.length + ' منتجاً تجريبياً إلى المخزون. هل تريد المتابعة؟')) return;
        btnSeedDemo.disabled = true;
        btnSeedDemo.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإضافة...';
        try {
            const batch = db.batch();
            DEMO_PRODUCTS.forEach(p => {
                const ref = db.collection('inventory').doc();
                batch.set(ref, {
                    ...p,
                    showInShop: true,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
            alert('تم إضافة البيانات التجريبية بنجاح!');
        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء إضافة البيانات التجريبية.');
        } finally {
            btnSeedDemo.disabled = false;
            btnSeedDemo.innerHTML = '<i class="fa-solid fa-database"></i> إضافة بيانات تجريبية';
        }
    });
}

// If admin is already logged in via session restore
if (currentRole === 'admin') startOnlineOrdersListener();

// =====================================================
// نظام رموز QR
// =====================================================
const QR_PRODUCT_PREFIX = 'SH-P:';
const QR_ORDER_PREFIX = 'SH-O:';

// تطبيع أي نص يمسحه الماسح إلى نوع + معرف
function parseQRPayload(raw) {
    const text = String(raw || '').trim();
    if (!text) return null;
    if (text.startsWith(QR_PRODUCT_PREFIX)) return { type: 'product', id: text.slice(QR_PRODUCT_PREFIX.length) };
    if (text.startsWith(QR_ORDER_PREFIX)) return { type: 'order', code: text.slice(QR_ORDER_PREFIX.length) };
    // Fallback: نص خام = جرّب كمعرف منتج ثم كرقم طلب
    if (inventory.some(p => p.id === text)) return { type: 'product', id: text };
    if (onlineOrders.some(o => o.orderNumber === text || o.id === text)) return { type: 'order', code: text };
    return { type: 'unknown', value: text };
}

function buildProductQRPayload(productId) {
    return QR_PRODUCT_PREFIX + productId;
}

function buildOrderQRPayload(orderNumber) {
    return QR_ORDER_PREFIX + orderNumber;
}

// ============== مولّد QR متعدد المراحل (متين) ==============
// يعيد كائن { el, dataUrl } — el إما <canvas> أو <img>.
function renderQRToContainer(container, text, size = 220) {
    container.innerHTML = '';

    // 1) qrcode-generator (مكتبة محلية ذاتية الاحتواء)
    if (typeof window.qrcode === 'function') {
        try {
            const qr = window.qrcode(0, 'M');
            qr.addData(text);
            qr.make();
            const moduleCount = qr.getModuleCount();
            const cellSize = Math.max(2, Math.floor(size / moduleCount));
            const dataUrl = qr.createDataURL(cellSize, 0);
            const img = document.createElement('img');
            img.src = dataUrl;
            img.alt = 'QR';
            img.style.width = size + 'px';
            img.style.height = size + 'px';
            img.style.imageRendering = 'pixelated';
            container.appendChild(img);
            return { el: img, dataUrl };
        } catch (err) {
            console.warn('qrcode-generator failed:', err);
        }
    }

    // 2) node-qrcode (canvas API)
    if (window.QRCode && typeof window.QRCode.toCanvas === 'function') {
        try {
            const canvas = document.createElement('canvas');
            container.appendChild(canvas);
            window.QRCode.toCanvas(canvas, text, { width: size, margin: 1, color: { dark: '#000', light: '#fff' } });
            return { el: canvas, dataUrl: null };
        } catch (err) {
            console.warn('node-qrcode failed:', err);
        }
    }

    // 3) قشرة آخر اللجوء: خدمة QR خارجية كصورة
    const fallback = document.createElement('img');
    fallback.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&margin=1`;
    fallback.alt = 'QR';
    fallback.style.width = size + 'px';
    fallback.style.height = size + 'px';
    fallback.addEventListener('error', () => {
        container.innerHTML = '<div style="color:#888; padding:1rem; font-size:0.85rem;">تعذّر إنشاء رمز QR — تحقق من الاتصال أو حدّث الصفحة</div>';
    });
    container.appendChild(fallback);
    return { el: fallback, dataUrl: fallback.src };
}

// يستخرج رابط بيانات الصورة من العنصر الناتج (canvas أو img)
function getQRDataURL(el) {
    if (!el) return null;
    if (el.tagName === 'CANVAS') {
        try { return el.toDataURL('image/png'); } catch (_) { return null; }
    }
    if (el.tagName === 'IMG') return el.src;
    return null;
}

// ============== إظهار QR لمنتج ==============
window.openProductQR = function(productId) {
    const product = inventory.find(p => p.id === productId);
    if (!product) { alert('المنتج غير موجود'); return; }
    const payload = buildProductQRPayload(productId);
    const storeName = (storeData && storeData.name) || 'أناقة للرجال';

    document.getElementById('qr-label-store-name').innerText = storeName;
    document.getElementById('qr-label-name').innerText = product.name;
    document.getElementById('qr-label-price').innerText = (Number(product.sellPrice) || 0).toLocaleString('ar-DZ') + ' د.ج';
    document.getElementById('qr-label-code').innerText = payload;

    const container = document.getElementById('qr-label-canvas');
    renderQRToContainer(container, payload, 220);

    document.getElementById('qr-label-modal').classList.add('show');
};

window.closeQRLabel = function() {
    document.getElementById('qr-label-modal').classList.remove('show');
};

window.printQRLabel = function() {
    const area = document.getElementById('qr-print-area');
    if (!area) return;
    const w = window.open('', '_blank', 'width=480,height=600');
    if (!w) { window.print(); return; }
    const qrEl = area.querySelector('#qr-label-canvas canvas, #qr-label-canvas img');
    const dataUrl = getQRDataURL(qrEl) || '';
    const storeName = document.getElementById('qr-label-store-name').innerText;
    const name = document.getElementById('qr-label-name').innerText;
    const price = document.getElementById('qr-label-price').innerText;
    const code = document.getElementById('qr-label-code').innerText;
    w.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>طباعة QR</title>
        <style>
            body { font-family: 'Cairo', Arial, sans-serif; display:flex; align-items:center; justify-content:center; min-height: 100vh; margin:0; }
            .lbl { text-align:center; border: 1px dashed #999; padding: 1rem 1.5rem; border-radius: 8px; max-width: 320px; }
            .lbl .s { font-size: 0.8rem; color:#666; margin-bottom: .5rem; }
            .lbl img { width: 200px; height: 200px; }
            .lbl .n { font-size: 1.1rem; font-weight: 700; margin-top: .5rem; }
            .lbl .p { font-size: 0.95rem; color:#444; margin-top: .25rem; }
            .lbl .c { font-size: 0.7rem; color:#999; margin-top: .5rem; word-break: break-all; }
            @media print { .lbl { border:none; } }
        </style></head>
        <body><div class="lbl">
            <div class="s">${storeName}</div>
            <img src="${dataUrl}" alt="QR">
            <div class="n">${name}</div>
            <div class="p">${price}</div>
            <div class="c">${code}</div>
        </div>
        <script>window.onload=function(){setTimeout(function(){window.print();window.close();},200);};<\/script>
        </body></html>`);
    w.document.close();
};

window.downloadQRImage = function() {
    const area = document.getElementById('qr-print-area');
    const qrEl = area && area.querySelector('#qr-label-canvas canvas, #qr-label-canvas img');
    const dataUrl = getQRDataURL(qrEl);
    if (!dataUrl) { alert('لا يمكن تنزيل الصورة الآن'); return; }
    const link = document.createElement('a');
    const name = document.getElementById('qr-label-name').innerText || 'product';
    link.download = `qr-${name}.png`;
    link.href = dataUrl;
    link.click();
};

// ============== ماسح QR بالكاميرا ==============
let html5QrScanner = null;
let qrScannerContext = 'pos'; // 'pos' | 'order'
let qrScanCooldown = false;

window.openQRScanner = function(context = 'pos') {
    qrScannerContext = context;
    const modal = document.getElementById('qr-scanner-modal');
    const status = document.getElementById('qr-scan-status');
    status.innerText = 'يجري تشغيل الكاميرا...';
    status.style.color = 'var(--text-secondary)';
    modal.classList.add('show');

    if (!window.Html5Qrcode) {
        status.innerText = 'تعذر تحميل مكتبة الماسح. تحقق من اتصال الإنترنت.';
        status.style.color = 'var(--danger)';
        return;
    }

    if (html5QrScanner) {
        try { html5QrScanner.stop().catch(() => {}); } catch (_) {}
        html5QrScanner = null;
    }

    html5QrScanner = new Html5Qrcode('qr-reader');
    const config = {
        fps: 12,
        qrbox: { width: 230, height: 230 },
        aspectRatio: 1.0
    };

    html5QrScanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
            if (qrScanCooldown) return;
            qrScanCooldown = true;
            setTimeout(() => { qrScanCooldown = false; }, 1500);
            handleScannedQR(decodedText);
        },
        () => {}
    ).then(() => {
        status.innerText = 'وجّه الكاميرا نحو رمز QR...';
    }).catch(err => {
        console.error('QR scanner start failed:', err);
        status.innerText = 'تعذر فتح الكاميرا. تأكد من منح الصلاحيات.';
        status.style.color = 'var(--danger)';
    });
};

window.closeQRScanner = function() {
    if (html5QrScanner) {
        try { html5QrScanner.stop().then(() => html5QrScanner.clear()).catch(() => {}); } catch (_) {}
        html5QrScanner = null;
    }
    document.getElementById('qr-scanner-modal').classList.remove('show');
};

function flashScanStatus(message, ok = true) {
    const status = document.getElementById('qr-scan-status');
    if (!status) return;
    status.innerText = message;
    status.style.color = ok ? 'var(--success)' : 'var(--danger)';
    setTimeout(() => {
        status.style.color = 'var(--text-secondary)';
        status.innerText = 'وجّه الكاميرا نحو رمز QR...';
    }, 1800);
}

function handleScannedQR(raw) {
    const parsed = parseQRPayload(raw);
    if (!parsed) {
        flashScanStatus('رمز غير صالح', false);
        return;
    }

    if (qrScannerContext === 'pos') {
        if (parsed.type !== 'product') {
            flashScanStatus('هذا الرمز ليس رمز منتج', false);
            return;
        }
        const product = inventory.find(p => p.id === parsed.id);
        if (!product) {
            flashScanStatus('المنتج غير موجود في المخزون', false);
            return;
        }
        if ((Number(product.qty) || 0) <= 0) {
            flashScanStatus(`${product.name} — غير متوفر`, false);
            return;
        }
        addToCart(product.id);
        flashScanStatus(`✓ تمت إضافة "${product.name}"`, true);
        return;
    }

    if (qrScannerContext === 'order') {
        if (parsed.type !== 'order') {
            flashScanStatus('هذا الرمز ليس رمز طلب', false);
            return;
        }
        const order = onlineOrders.find(o => o.orderNumber === parsed.code || o.id === parsed.code);
        if (!order) {
            flashScanStatus('الطلب غير موجود', false);
            return;
        }
        flashScanStatus(`✓ طلب ${order.orderNumber}`, true);
        setTimeout(() => {
            closeQRScanner();
            openOrderDetail(order.id);
        }, 600);
        return;
    }
}

// ============== مسح بجهاز QR خارجي (لوحة مفاتيح USB) ==============
// أجهزة المسح اليدوي تعمل كلوحة مفاتيح: تكتب النص ثم Enter سريعًا.
(function setupHardwareScanner() {
    let buffer = '';
    let lastKeyTime = Date.now();
    const RESET_AFTER_MS = 50; // إعادة ضبط بين الضغطات لتجنب التقاط كتابة عادية

    document.addEventListener('keydown', (e) => {
        // تجاهل الإدخال داخل الحقول العادية (إلا حقل بحث POS)
        const active = document.activeElement;
        const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');
        const isPosSearch = active && active.id === 'pos-search';
        if (isInput && !isPosSearch) return;

        const now = Date.now();
        if (now - lastKeyTime > RESET_AFTER_MS && e.key !== 'Enter') buffer = '';
        lastKeyTime = now;

        if (e.key === 'Enter') {
            if (buffer.length >= 4) {
                e.preventDefault();
                // POS context عند فتح صفحة البيع، وإلا order context
                const onPOS = document.getElementById('section-sales')?.style.display !== 'none';
                qrScannerContext = onPOS ? 'pos' : 'order';
                handleScannedQR(buffer);
                if (isPosSearch) active.value = '';
            }
            buffer = '';
            return;
        }

        if (e.key.length === 1) buffer += e.key;
        if (buffer.length > 120) buffer = buffer.slice(-120);
    });
})();

// ============== QR للطلب الأونلاين (للمدير: عرض + مسح للاستلام) ==============
function injectOrderQRIntoDetail(order) {
    const content = document.getElementById('order-detail-content');
    if (!content) return;
    const payload = buildOrderQRPayload(order.orderNumber || order.id);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin-top:1rem; padding:1rem; background:#fff; border-radius:0.6rem; text-align:center;';
    wrap.innerHTML = `
        <div style="font-size:0.85rem; color:#666; margin-bottom:0.5rem; font-weight:600;">رمز QR الخاص بالطلب</div>
        <div id="order-qr-wrap" style="display:flex; justify-content:center;"></div>
        <div style="font-size:0.75rem; color:#888; margin-top:0.5rem; word-break:break-all;">${payload}</div>
        <div style="font-size:0.75rem; color:#888; margin-top:0.3rem;">يستخدم الزبون هذا الرمز لاستلام طلبه</div>
    `;
    content.appendChild(wrap);
    const target = wrap.querySelector('#order-qr-wrap');
    if (target) renderQRToContainer(target, payload, 180);
}

// Hook into openOrderDetail to add QR — patch after definition
const _origOpenOrderDetail = window.openOrderDetail;
window.openOrderDetail = function(orderId) {
    _origOpenOrderDetail(orderId);
    const order = onlineOrders.find(o => o.id === orderId);
    if (order) injectOrderQRIntoDetail(order);

    // Add a "scan order QR" shortcut button in actions
    const actions = document.getElementById('order-detail-actions');
    if (actions && !document.getElementById('btn-scan-order-qr')) {
        const btn = document.createElement('button');
        btn.id = 'btn-scan-order-qr';
        btn.className = 'btn btn-primary';
        btn.style.cssText = 'width:auto; padding:0.6rem 1rem; background:#1F2937;';
        btn.innerHTML = '<i class="fa-solid fa-qrcode"></i> مسح QR للاستلام';
        btn.onclick = () => { closeOrderDetail(); openQRScanner('order'); };
        actions.insertBefore(btn, actions.firstChild);
    }
};

// زر مستقل لفتح ماسح QR من قسم الطلبات
(function addOrderQRScanButton() {
    const tries = [0, 200, 800, 1500];
    tries.forEach(delay => setTimeout(() => {
        const panel = document.querySelector('#section-shop .panel-header h2');
        if (panel && !document.getElementById('btn-order-scan-header')) {
            const wrap = panel.parentElement;
            const btn = document.createElement('button');
            btn.id = 'btn-order-scan-header';
            btn.className = 'btn btn-primary';
            btn.style.cssText = 'width:auto; padding:0.55rem 1rem; margin-right:auto;';
            btn.innerHTML = '<i class="fa-solid fa-qrcode"></i> مسح QR طلب';
            btn.onclick = () => openQRScanner('order');
            wrap.appendChild(btn);
        }
    }, delay));
})();

// ================== إعدادات الشحن ==================
const WILAYAS_LIST = [
    '01 - أدرار','02 - الشلف','03 - الأغواط','04 - أم البواقي','05 - باتنة',
    '06 - بجاية','07 - بسكرة','08 - بشار','09 - البليدة','10 - البويرة',
    '11 - تمنراست','12 - تبسة','13 - تلمسان','14 - تيارت','15 - تيزي وزو',
    '16 - الجزائر','17 - الجلفة','18 - جيجل','19 - سطيف','20 - سعيدة',
    '21 - سكيكدة','22 - سيدي بلعباس','23 - عنابة','24 - قالمة','25 - قسنطينة',
    '26 - المدية','27 - مستغانم','28 - المسيلة','29 - معسكر','30 - ورقلة',
    '31 - وهران','32 - البيض','33 - إليزي','34 - برج بوعريريج','35 - بومرداس',
    '36 - الطارف','37 - تندوف','38 - تيسمسيلت','39 - الوادي','40 - خنشلة',
    '41 - سوق أهراس','42 - تيبازة','43 - ميلة','44 - عين الدفلى','45 - النعامة',
    '46 - عين تموشنت','47 - غرداية','48 - غليزان','49 - تيميمون','50 - برج باجي مختار',
    '51 - أولاد جلال','52 - بني عباس','53 - إن صالح','54 - إن قزام','55 - تقرت',
    '56 - جانت','57 - المغير','58 - المنيعة'
];

let shippingSettings = {};

function renderShippingForm() {
    const container = document.getElementById('wilayas-shipping-container');
    if (!container) return;
    container.innerHTML = '';
    WILAYAS_LIST.forEach(wilaya => {
        const val = shippingSettings[wilaya] !== undefined ? shippingSettings[wilaya] : 600;
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `
            <label>${wilaya}</label>
            <input type="number" min="0" class="wilaya-shipping-input" data-wilaya="${wilaya}" value="${val}" required placeholder="سعر الشحن (د.ج)">
        `;
        container.appendChild(div);
    });
}

db.collection('store').doc('shipping').onSnapshot(doc => {
    if (doc.exists) {
        shippingSettings = doc.data() || {};
    } else {
        shippingSettings = {};
    }
    renderShippingForm();
});

const shippingForm = document.getElementById('shipping-settings-form');
if (shippingForm) {
    shippingForm.addEventListener('submit', async e => {
        e.preventDefault();
        const inputs = document.querySelectorAll('.wilaya-shipping-input');
        const newSettings = {};
        inputs.forEach(input => {
            newSettings[input.dataset.wilaya] = Number(input.value) || 0;
        });
        
        try {
            const btn = shippingForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
            btn.disabled = true;
            
            await db.collection('store').doc('shipping').set(newSettings);
            
            btn.innerHTML = '<i class="fa-solid fa-check"></i> تم الحفظ';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
        } catch (err) {
            console.error(err);
            alert("حدث خطأ أثناء حفظ الإعدادات!");
            shippingForm.querySelector('button[type="submit"]').disabled = false;
        }
    });
}
