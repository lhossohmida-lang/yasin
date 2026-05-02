// ================== إعدادات Firebase والمزامنة ==================

const firebaseConfig = {
  apiKey: "AIzaSyAZwrvW6goAs7SjMPmksXWiU1x57r4UbwU",
  authDomain: "yasin-b993b.firebaseapp.com",
  projectId: "yasin-b993b",
  storageBucket: "yasin-b993b.firebasestorage.app",
  messagingSenderId: "1094100813279",
  appId: "1:1094100813279:web:bb4cf51c0ecc313a58f06a",
  measurementId: "G-NG5F1J11DY"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// المتغيرات المحلية 
let inventory = [];
let salesHistory = [];
let expenses = [];
let storeData = { totalIncome: 0.00, netProfit: 0.00, totalLosses: 0.00 };

// الاستماع للتغييرات في الوقت الفعلي
db.collection("store").doc("data").onSnapshot((doc) => {
    if (doc.exists) {
        storeData = doc.data();
        if(storeData.logo) updateLogoUI(storeData.logo);
    } else {
        db.collection("store").doc("data").set(storeData);
    }
    updateUI();
});

db.collection("inventory").onSnapshot((snapshot) => {
    inventory = [];
    snapshot.forEach((doc) => inventory.push({ id: doc.id, ...doc.data() }));
    updateUI();
});

db.collection("sales_history").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
    salesHistory = [];
    snapshot.forEach((doc) => salesHistory.push({ id: doc.id, ...doc.data() }));
    updateUI();
});

db.collection("expenses").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
    expenses = [];
    snapshot.forEach((doc) => expenses.push({ id: doc.id, ...doc.data() }));
    updateUI();
});

// دالة لتحديث إحصائيات المتجر
async function updateStoreDataInDB() {
    await db.collection("store").doc("data").set(storeData);
}

// دالة تحديث الواجهة الرئيسية
function updateUI() {
    const formatCurrency = (amount) => amount.toLocaleString('ar-DZ', { minimumFractionDigits: 2 }) + ' د.ج';

    // حساب إجمالي رأس المال بناءً على المخزون الفعلي
    const capital = inventory.reduce((sum, item) => sum + (item.qty * item.buyPrice), 0);

    document.getElementById('total-capital').innerText = formatCurrency(capital);
    document.getElementById('total-income').innerText = formatCurrency(storeData.totalIncome);
    document.getElementById('net-profit').innerText = formatCurrency(storeData.netProfit);
    document.getElementById('total-losses').innerText = formatCurrency(storeData.totalLosses);

    // تحديث الأقسام المرتبطة بالمخزون
    renderInventoryCards();
    populateSaleDropdown();
    checkLowStock();
    renderPOSProducts();
    renderDashboardGrid();
    renderSalesHistory();
    renderExpenses();
}

// ---------------- إدارة المخزون ---------------- //

// دالة عرض المخزون في بطاقات
function renderInventoryCards() {
    const container = document.getElementById('inventory-cards-container');
    container.innerHTML = '';

    inventory.forEach(item => {
        let qtyBadge = `<span class="badge badge-success">${item.qty}</span>`;
        if (item.qty <= 0) {
            qtyBadge = `<span class="badge badge-danger">نفد</span>`;
        } else if (item.qty <= 3) {
            qtyBadge = `<span class="badge badge-warning">${item.qty} (قليل)</span>`;
        }

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
                <div class="detail-row">
                    <span class="detail-label">سعر الشراء:</span>
                    <span class="detail-value">${item.buyPrice} د.ج</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">سعر البيع:</span>
                    <span class="detail-value text-blue">${item.sellPrice} د.ج</span>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn-delete-card" onclick="deleteProduct(${item.id})">
                    <i class="fa-solid fa-trash"></i> حذف
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// إضافة منتج جديد
document.getElementById('add-product-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const newProduct = {
        name: document.getElementById('inv-name').value,
        qty: parseInt(document.getElementById('inv-quantity').value),
        buyPrice: parseFloat(document.getElementById('inv-buy').value),
        sellPrice: parseFloat(document.getElementById('inv-sell').value)
    };

    try {
        await db.collection("inventory").add(newProduct);
        this.reset();
        // لا نحتاج لاستدعاء updateUI لأن onSnapshot سيتكفل بالأمر
    } catch (error) {
        console.error("Error adding product: ", error);
        alert("حدث خطأ أثناء الإضافة.");
    }
});

// حذف منتج
async function deleteProduct(id) {
    if(confirm('هل أنت متأكد من حذف هذا المنتج نهائياً من المخزون؟')) {
        try {
            await db.collection("inventory").doc(id).delete();
        } catch (error) {
            console.error("Error removing product: ", error);
        }
    }
}

// ---------------- لوحة القيادة - بيع سريع بالمربعات ---------------- //

let dashSelectedProductId = null;
let dashQty = 1;

// لم يعد هناك حاجة للقائمة المنسدلة - احتفظنا بالدالة فارغة لتجنب أخطاء
 function populateSaleDropdown() {}

function renderDashboardGrid(filterQuery = '') {
    const grid = document.getElementById('dashboard-products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = inventory.filter(item =>
        item.qty > 0 && item.name.toLowerCase().includes(filterQuery.toLowerCase())
    );

    if (filtered.length === 0) {
        grid.innerHTML = '<p class="text-secondary" style="text-align:center; padding: 1rem;">لا توجد منتجات متاحة</p>';
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('div');
        const isSelected = dashSelectedProductId === item.id;
        card.className = 'dash-product-card' + (isSelected ? ' selected' : '');
        card.onclick = () => selectDashProduct(item.id);
        card.innerHTML = `
            <div class="dash-card-qty">${item.qty}</div>
            <i class="fa-solid fa-shirt dash-card-icon"></i>
            <div class="dash-card-name">${item.name}</div>
            <div class="dash-card-price">${item.sellPrice} د.ج</div>
        `;
        grid.appendChild(card);
    });
}

function selectDashProduct(id) {
    const product = inventory.find(p => p.id === id);
    if (!product) return;

    dashSelectedProductId = id;
    dashQty = 1;

    document.getElementById('selected-product-name').innerText = product.name;
    document.getElementById('selected-product-price').innerText = `سعر البيع: ${product.sellPrice} د.ج | الكمية المتوفرة: ${product.qty}`;
    document.getElementById('dash-qty-display').innerText = dashQty;
    document.getElementById('dashboard-sale-action').style.display = 'block';

    // تحديث تظليل البطاقة المختارة
    const cards = document.querySelectorAll('.dash-product-card');
    cards.forEach(c => c.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
}

function changeDashQty(delta) {
    const product = inventory.find(p => p.id === dashSelectedProductId);
    if (!product) return;
    dashQty = Math.max(1, Math.min(dashQty + delta, product.qty));
    document.getElementById('dash-qty-display').innerText = dashQty;
}

async function confirmDashboardSale() {
    if (!dashSelectedProductId) return;
    const product = inventory.find(p => p.id === dashSelectedProductId);
    if (!product || dashQty > product.qty) {
        alert('الكمية المحددة تتجاوز المخزون!');
        return;
    }

    product.qty -= dashQty;
    const totalCost = product.buyPrice * dashQty;
    const totalRevenue = product.sellPrice * dashQty;
    storeData.totalIncome += totalRevenue;
    storeData.netProfit += (totalRevenue - totalCost);

    // تسجيل في سجل المبيعات
    const saleRecord = {
        productName: product.name,
        productId: product.id,
        qty: dashQty,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        total: totalRevenue,
        profit: totalRevenue - totalCost,
        date: new Date().toLocaleString('ar-DZ'),
        returned: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        let batch = db.batch();
        
        let prodRef = db.collection("inventory").doc(product.id);
        batch.update(prodRef, { qty: product.qty });
        
        let saleRef = db.collection("sales_history").doc();
        batch.set(saleRef, saleRecord);
        
        let storeRef = db.collection("store").doc("data");
        batch.set(storeRef, storeData);
        
        await batch.commit();

        showReceipt(product.name, product.sellPrice, dashQty, totalRevenue);

        // إعادة تعيين
        dashSelectedProductId = null;
        dashQty = 1;
        document.getElementById('dashboard-sale-action').style.display = 'none';
        document.getElementById('dash-qty-display').innerText = 1;
    } catch(error) {
        console.error("Error in sale:", error);
        alert("حدث خطأ أثناء تسجيل البيع.");
    }
}

document.getElementById('dashboard-search').addEventListener('input', (e) => {
    renderDashboardGrid(e.target.value);
});

// ---------------- التنبيهات ---------------- //

function checkLowStock() {
    const alertsList = document.getElementById('dashboard-alerts');
    alertsList.innerHTML = '';

    const lowStockItems = inventory.filter(item => item.qty <= 3);

    if (lowStockItems.length === 0) {
        alertsList.innerHTML = '<li class="alert-item" style="background:transparent; border:none"><span class="text-secondary">المخزون بحالة جيدة</span></li>';
        return;
    }

    lowStockItems.forEach(item => {
        const isOutOfStock = item.qty === 0;
        const colorClass = isOutOfStock ? 'danger' : 'warning';
        const iconClass = isOutOfStock ? 'fa-circle-xmark' : 'fa-triangle-exclamation';
        const styleText = isOutOfStock ? 'background-color: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2);' : '';
        const colorText = isOutOfStock ? 'color: var(--danger)' : '';

        const li = document.createElement('li');
        li.className = `alert-item ${colorClass}`;
        if(isOutOfStock) li.style.cssText = styleText;

        li.innerHTML = `
            <i class="fa-solid ${iconClass}" style="${colorText}"></i>
            <div class="alert-details">
                <h4 style="${colorText}">${item.name}</h4>
                <span>الكمية المتبقية: ${isOutOfStock ? 'نفد تماماً!' : item.qty + ' فقط'}</span>
            </div>
        `;
        alertsList.appendChild(li);
    });
}

// ---------------- نقطة البيع (POS) ---------------- //

let posCart = [];

function renderPOSProducts(filterQuery = '') {
    const grid = document.getElementById('pos-products-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    const filtered = inventory.filter(item => 
        item.name.toLowerCase().includes(filterQuery.toLowerCase()) && item.qty > 0
    );

    if (filtered.length === 0) {
        grid.innerHTML = '<p class="text-secondary" style="grid-column: 1/-1; text-align: center;">لا توجد منتجات مطابقة</p>';
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

document.getElementById('pos-search').addEventListener('input', (e) => {
    renderPOSProducts(e.target.value);
});

function addToCart(productId) {
    const product = inventory.find(p => p.id === productId);
    if (!product || product.qty <= 0) return;

    const cartItem = posCart.find(item => item.id === productId);
    if (cartItem) {
        if (cartItem.cartQty < product.qty) {
            cartItem.cartQty++;
        } else {
            alert('الكمية المطلوبة تتجاوز المخزون!');
            return;
        }
    } else {
        posCart.push({ ...product, cartQty: 1 });
    }
    renderCart();
}

function updateCartQty(productId, change) {
    const cartItemIndex = posCart.findIndex(item => item.id === productId);
    if (cartItemIndex === -1) return;

    const cartItem = posCart[cartItemIndex];
    const product = inventory.find(p => p.id === productId);

    cartItem.cartQty += change;

    if (cartItem.cartQty <= 0) {
        posCart.splice(cartItemIndex, 1);
    } else if (cartItem.cartQty > product.qty) {
        alert('الكمية المطلوبة تتجاوز المخزون!');
        cartItem.cartQty = product.qty;
    }

    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    if (!container || !totalEl) return;
    
    container.innerHTML = '';
    let total = 0;

    if (posCart.length === 0) {
        container.innerHTML = '<div class="empty-cart-msg text-secondary" style="text-align: center; padding: 2rem 0;">السلة فارغة حالياً</div>';
        totalEl.innerText = '0.00 د.ج';
        return;
    }

    posCart.forEach(item => {
        const itemTotal = item.sellPrice * item.cartQty;
        total += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <span class="cart-item-price">${item.sellPrice} د.ج</span>
            </div>
            <div class="cart-item-qty">
                <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)"><i class="fa-solid fa-plus"></i></button>
                <span>${item.cartQty}</span>
                <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)"><i class="fa-solid fa-minus"></i></button>
            </div>
        `;
        container.appendChild(div);
    });

    totalEl.innerText = total.toLocaleString('ar-DZ', { minimumFractionDigits: 2 }) + ' د.ج';
}

document.getElementById('btn-checkout').addEventListener('click', async () => {
    if (posCart.length === 0) return;

    let totalRevenue = 0;
    let totalCost = 0;

    let batch = db.batch();

    posCart.forEach(cartItem => {
        const product = inventory.find(p => p.id === cartItem.id);
        if (product) {
            const newQty = product.qty - cartItem.cartQty;
            const itemTotal = cartItem.sellPrice * cartItem.cartQty;
            const itemCost = cartItem.buyPrice * cartItem.cartQty;
            const itemProfit = itemTotal - itemCost;
            
            totalRevenue += itemTotal;
            totalCost += itemCost;
            
            let prodRef = db.collection("inventory").doc(product.id);
            batch.update(prodRef, { qty: newQty });

            let saleRef = db.collection("sales_history").doc();
            batch.set(saleRef, {
                productName: product.name,
                productId: product.id,
                qty: cartItem.cartQty,
                buyPrice: cartItem.buyPrice,
                sellPrice: cartItem.sellPrice,
                total: itemTotal,
                profit: itemProfit,
                date: new Date().toLocaleString('ar-DZ'),
                returned: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    });

    const profit = totalRevenue - totalCost;
    storeData.totalIncome += totalRevenue;
    storeData.netProfit += profit;

    let storeRef = db.collection("store").doc("data");
    batch.set(storeRef, storeData);

    try {
        await batch.commit();

        // تجهيز عناصر القسيمة
        const now = new Date();
        document.getElementById('receipt-date').innerText = now.toLocaleString('ar-DZ');
        
        let receiptHtml = '';
        posCart.forEach(item => {
            receiptHtml += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.cartQty}</td>
                    <td>${item.sellPrice}</td>
                    <td>${item.sellPrice * item.cartQty}</td>
                </tr>
            `;
        });
        
        document.getElementById('receipt-items').innerHTML = receiptHtml;
        document.getElementById('receipt-total').innerText = totalRevenue.toLocaleString('ar-DZ', { minimumFractionDigits: 2 });
        document.getElementById('receipt-modal').classList.add('show');

        // تصفير السلة وتحديث الواجهة
        posCart = [];
        renderCart();
    } catch(error) {
        console.error("Checkout Error:", error);
        alert("حدث خطأ أثناء الدفع!");
    }
});

// ---------------- التبديل بين الخانات ---------------- //
const navItems = document.querySelectorAll('.nav-item');
const pageSections = document.querySelectorAll('.page-section');
const pageTitle = document.getElementById('page-title');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        const targetId = item.getAttribute('data-target');
        pageSections.forEach(sec => sec.style.display = 'none');
        document.getElementById(targetId).style.display = 'block';

        pageTitle.innerText = item.innerText;
    });
});

// ---------------- الطباعة والقسيمة ---------------- //
function showReceipt(productName, price, quantity, total) {
    const now = new Date();
    document.getElementById('receipt-date').innerText = now.toLocaleString('ar-DZ');

    document.getElementById('receipt-items').innerHTML = `
        <tr>
            <td>${productName}</td>
            <td>${quantity}</td>
            <td>${price}</td>
            <td>${total}</td>
        </tr>
    `;
    document.getElementById('receipt-total').innerText = total.toLocaleString('ar-DZ', { minimumFractionDigits: 2 });
    document.getElementById('receipt-modal').classList.add('show');
}

function closeReceipt() {
    document.getElementById('receipt-modal').classList.remove('show');
}

function printReceipt() {
    window.print();
}

// إعداد التاريخ والتهيئة المبدئية عند فتح التطبيق
document.getElementById('current-date').innerText = new Date().toLocaleDateString('ar-DZ', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

// ---------------- سجل المبيعات ---------------- //
function renderSalesHistory(filterQuery = '') {
    const list = document.getElementById('history-list');
    if (!list) return;
    list.innerHTML = '';
    
    // البيانات مرتبة مسبقاً من Firebase
    const sortedHistory = [...salesHistory];
    const filtered = sortedHistory.filter(item => 
        item.productName.toLowerCase().includes(filterQuery.toLowerCase())
    );

    if (filtered.length === 0) {
        list.innerHTML = '<p class="text-secondary" style="text-align:center; padding: 2rem;">لا توجد مبيعات مسجلة</p>';
        return;
    }

    filtered.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'alert-item';
        itemDiv.style.justifyContent = 'space-between';
        itemDiv.style.alignItems = 'center';
        if(item.returned) {
            itemDiv.style.opacity = '0.6';
            itemDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }

        itemDiv.innerHTML = `
            <div style="display:flex; gap:1rem;">
                <i class="fa-solid fa-file-invoice" style="color:var(--accent-primary); font-size: 1.5rem; margin-top:0.2rem;"></i>
                <div class="alert-details">
                    <h4 style="margin-bottom:0.2rem; ${item.returned ? 'text-decoration: line-through;' : ''}">${item.productName}</h4>
                    <span style="color:var(--text-secondary); font-size:0.85rem;">
                        الكمية: ${item.qty} | السعر: ${item.sellPrice} د.ج | الإجمالي: ${item.total} د.ج <br>
                        ${item.date}
                    </span>
                    ${item.returned ? '<span style="color:var(--danger); display:block; margin-top:0.3rem; font-weight:bold;">[تم الإرجاع]</span>' : ''}
                </div>
            </div>
            <div>
                ${!item.returned ? `<button class="btn btn-danger" style="padding: 0.5rem 1rem; width: auto; font-size: 0.9rem;" onclick="returnSaleItem(${item.id})"><i class="fa-solid fa-rotate-left"></i> إرجاع</button>` : ''}
            </div>
        `;
        list.appendChild(itemDiv);
    });
}

async function returnSaleItem(saleId) {
    if(!confirm('هل أنت متأكد من إرجاع هذه العملية؟ (سيتم إعادة الكمية للمخزون وخصم المبلغ من الأرباح)')) return;
    
    const saleIndex = salesHistory.findIndex(s => s.id === saleId);
    if(saleIndex === -1) return;
    
    const sale = salesHistory[saleIndex];
    if(sale.returned) return;
    
    try {
        let batch = db.batch();

        // استرجاع الكمية للمخزون
        const product = inventory.find(p => p.id === sale.productId);
        if(product) {
            let prodRef = db.collection("inventory").doc(sale.productId);
            batch.update(prodRef, { qty: product.qty + sale.qty });
        }
        
        // خصم الأرباح والإيرادات
        storeData.totalIncome -= sale.total;
        storeData.netProfit -= sale.profit;
        
        let storeRef = db.collection("store").doc("data");
        batch.set(storeRef, storeData);

        // تحديث حالة العملية
        let saleRef = db.collection("sales_history").doc(saleId);
        batch.update(saleRef, { returned: true });
        
        await batch.commit();
    } catch(error) {
        console.error("Error returning sale:", error);
        alert("حدث خطأ أثناء الإرجاع!");
    }
}

document.getElementById('history-search').addEventListener('input', (e) => {
    renderSalesHistory(e.target.value);
});

// ---------------- المصاريف والخسائر ---------------- //
document.getElementById('expense-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const desc = document.getElementById('exp-desc').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    
    const newExpense = {
        desc: desc,
        amount: amount,
        date: new Date().toLocaleString('ar-DZ'),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    storeData.totalLosses += amount;
    storeData.netProfit -= amount; // خصم المصروف من الأرباح الصافية
    
    try {
        let batch = db.batch();
        let expRef = db.collection("expenses").doc();
        batch.set(expRef, newExpense);
        
        let storeRef = db.collection("store").doc("data");
        batch.set(storeRef, storeData);
        
        await batch.commit();
        this.reset();
    } catch(error) {
        console.error("Error adding expense:", error);
        alert("حدث خطأ أثناء إضافة المصروف!");
    }
});

function renderExpenses() {
    const list = document.getElementById('expenses-list');
    const totalDisplay = document.getElementById('total-expenses-display');
    if (!list || !totalDisplay) return;
    list.innerHTML = '';
    
    if (expenses.length === 0) {
        list.innerHTML = '<p class="text-secondary" style="text-align:center; padding: 2rem;">لا توجد مصاريف مسجلة</p>';
        totalDisplay.innerText = '0.00 د.ج';
        return;
    }

    expenses.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'alert-item';
        itemDiv.style.justifyContent = 'space-between';
        itemDiv.style.alignItems = 'center';
        
        itemDiv.innerHTML = `
            <div style="display:flex; gap:1rem;">
                <i class="fa-solid fa-money-bill-wave" style="color:var(--danger); font-size: 1.5rem; margin-top:0.2rem;"></i>
                <div class="alert-details">
                    <h4 style="margin-bottom:0.2rem;">${item.desc}</h4>
                    <span style="color:var(--text-secondary); font-size:0.85rem;">${item.date}</span>
                </div>
            </div>
            <div>
                <span class="text-danger" style="font-weight:bold;">${item.amount.toLocaleString('ar-DZ')} د.ج</span>
            </div>
        `;
        list.appendChild(itemDiv);
    });
    
    totalDisplay.innerText = storeData.totalLosses.toLocaleString('ar-DZ', { minimumFractionDigits: 2 }) + ' د.ج';
}

// ---------------- تغيير الشعار ---------------- //
function updateLogoUI(logoStr) {
    const img = document.getElementById('app-logo-img');
    if (logoStr) {
        img.src = logoStr;
    } else {
        img.src = './icon.png';
    }
}

document.getElementById('logo-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(event) {
            const base64Str = event.target.result;
            // Update UI
            updateLogoUI(base64Str);
            // Save to Firestore
            storeData.logo = base64Str;
            try {
                await updateStoreDataInDB();
            } catch(err) {
                console.error("Error saving logo:", err);
            }
        };
        reader.readAsDataURL(file);
    }
});

});

// ---------------- القائمة الجانبية للموبايل ---------------- //
const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

if (hamburgerBtn && sidebar && sidebarOverlay) {
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
        if(sidebar.classList.contains('open')) {
            document.body.style.overflow = 'hidden'; // لمنع التمرير تحت القائمة
        } else {
            document.body.style.overflow = '';
        }
    }

    hamburgerBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);

    // إغلاق القائمة عند النقر على أحد الروابط (للموبايل)
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                toggleSidebar();
            }
        });
    });
}

updateUI();
