/* =====================================================
   StyleHub — Customer Storefront Logic
   ===================================================== */

// ============================ Firebase ============================
const firebaseConfig = {
    apiKey: "AIzaSyAZwrvW6goAs7SjMPmksXWiU1x57r4UbwU",
    authDomain: "yasin-b993b.firebaseapp.com",
    projectId: "yasin-b993b",
    storageBucket: "yasin-b993b.firebasestorage.app",
    messagingSenderId: "1094100813279",
    appId: "1:1094100813279:web:bb4cf51c0ecc313a58f06a",
    measurementId: "G-NG5F1J11DY"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============================ State ============================
let inventory = [];
let inventoryLoaded = false;
let cart = JSON.parse(localStorage.getItem('sh_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('sh_wishlist') || '[]');
let customer = JSON.parse(localStorage.getItem('sh_customer') || 'null');
let appliedPromo = null;
let heroSlideIndex = 0;
let heroInterval = null;

// ============================ Constants ============================
const FREE_SHIPPING_THRESHOLD = 299;
const SHIPPING_FEE = 600;
const PROMO_CODES = {
    'STYLE10': { type: 'percent', value: 10, label: 'خصم 10%' }
};

const CATEGORIES = [
    { id: 'men', name: 'الرجال', icon: 'fa-male', img: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=400&q=80' },
    { id: 'women', name: 'النساء', icon: 'fa-female', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80' },
    { id: 'kids', name: 'الأطفال', icon: 'fa-child', img: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=400&q=80' },
    { id: 'hoodies', name: 'هوديز و سويتشيرت', icon: 'fa-vest', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80' },
    { id: 'shoes', name: 'أحذية', icon: 'fa-shoe-prints', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' },
    { id: 'accessories', name: 'إكسسوارات', icon: 'fa-glasses', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80' }
];

const WILAYAS = [
    '01 - أدرار','02 - الشلف','03 - الأغواط','04 - أم البواقي','05 - باتنة',
    '06 - بجاية','07 - بسكرة','08 - بشار','09 - البليدة','10 - البويرة',
    '11 - تمنراست','12 - تبسة','13 - تلمسان','14 - تيارت','15 - تيزي وزو',
    '16 - الجزائر','17 - الجلفة','18 - جيجل','19 - سطيف','20 - سعيدة',
    '21 - سكيكدة','22 - سيدي بلعباس','23 - عنابة','24 - قالمة','25 - قسنطينة',
    '26 - المدية','27 - مستغانم','28 - المسيلة','29 - معسكر','30 - ورقلة',
    '31 - وهران','32 - البيض','33 - إليزي','34 - برج بوعريريج','35 - بومرداس',
    '36 - الطارف','37 - تندوف','38 - تيسمسيلت','39 - الوادي','40 - خنشلة',
    '41 - سوق أهراس','42 - تيبازة','43 - ميلة','44 - عين الدفلى','45 - النعامة',
    '46 - عين تموشنت','47 - غرداية','48 - غليزان'
];

const DEFAULT_PRODUCT_IMAGES = {
    men: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80',
    women: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80',
    kids: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=80',
    hoodies: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80',
    shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    accessories: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
    default: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80'
};

const HERO_SLIDES = [
    {
        title: 'أحدث صيحات الموضة تنتظرك',
        subtitle: 'اكتشف مجموعتنا الجديدة من الملابس العصرية لجميع الأذواق والمناسبات',
        cta: 'تسوق الآن',
        link: '#/category/new',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=80'
    },
    {
        title: 'خصومات لا تفوّت',
        subtitle: 'وفّر حتى 30% على مجموعة مختارة من أفضل المنتجات',
        cta: 'اكتشف العروض',
        link: '#/category/offers',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&q=80'
    },
    {
        title: 'كولكشن الرجال 2026',
        subtitle: 'إطلالات أنيقة وعصرية لجميع المناسبات',
        cta: 'تسوق الرجال',
        link: '#/category/men',
        image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1400&q=80'
    }
];

// ============================ Utils ============================
function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function fmtPrice(n) {
    return `${Math.round(n).toLocaleString('ar-DZ')} د.ج`;
}

function safeNum(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function genOrderNumber() {
    const ts = Date.now().toString().slice(-7);
    const rnd = Math.floor(Math.random() * 900 + 100);
    return `SH-${ts}${rnd}`;
}

function inferCategory(name) {
    const n = String(name || '').toLowerCase();
    if (/(هودي|سويت|hoodie|sweat)/.test(n)) return 'hoodies';
    if (/(حذاء|بوت|سنيكر|shoe|boot|sneaker|كاب|cap|قبعة)/.test(n)) {
        if (/(كاب|cap|قبعة)/.test(n)) return 'accessories';
        return 'shoes';
    }
    if (/(حقيبة|نظارة|حزام|ساعة|bag|glass|belt|watch)/.test(n)) return 'accessories';
    if (/(طفل|أطفال|بنت|ولد|child|kid)/.test(n)) return 'kids';
    if (/(فستان|تنورة|نساء|نسائي|woman|women|dress|skirt)/.test(n)) return 'women';
    return 'men';
}

function getProductImage(product) {
    if (product.image) return product.image;
    if (Array.isArray(product.images) && product.images.length) return product.images[0];
    const cat = product.category || inferCategory(product.name);
    return DEFAULT_PRODUCT_IMAGES[cat] || DEFAULT_PRODUCT_IMAGES.default;
}

function getProductImages(product) {
    const imgs = [];
    if (product.image) imgs.push(product.image);
    if (Array.isArray(product.images)) imgs.push(...product.images);
    if (!imgs.length) imgs.push(getProductImage(product));
    return Array.from(new Set(imgs));
}

function getProductSizes(product) {
    if (Array.isArray(product.sizes) && product.sizes.length) return product.sizes;
    const cat = product.category || inferCategory(product.name);
    if (cat === 'shoes') return ['39', '40', '41', '42', '43', '44'];
    if (cat === 'accessories') return ['قياس واحد'];
    if (cat === 'kids') return ['2-4', '4-6', '6-8', '8-10', '10-12'];
    return ['S', 'M', 'L', 'XL', 'XXL'];
}

function getProductColors(product) {
    if (Array.isArray(product.colors) && product.colors.length) return product.colors;
    return [
        { name: 'أسود', hex: '#0F172A' },
        { name: 'أبيض', hex: '#F8FAFC' },
        { name: 'كحلي', hex: '#1E3A8A' }
    ];
}

function getProductDescription(product) {
    if (product.description) return product.description;
    const cat = product.category || inferCategory(product.name);
    const txt = {
        men: 'قطعة عصرية للرجال بخامة فاخرة وراحة لا مثيل لها، مثالية للإطلالات اليومية والمناسبات.',
        women: 'تصميم نسائي أنيق يجمع بين الراحة والذوق العصري، بخامات ناعمة تدوم طويلاً.',
        kids: 'ملابس أطفال آمنة ومريحة بألوان مبهجة، مصنوعة من قطن طبيعي 100%.',
        hoodies: 'هودي عصري بخامة قطنية فاخرة، دفء ونعومة لإطلالة كاجوال راقية.',
        shoes: 'حذاء عصري بنعل مريح وتصميم متين يمنحك ثباتاً وأناقة طوال اليوم.',
        accessories: 'إكسسوار يلفت الأنظار ويكمل إطلالتك بلمسة من الفخامة.'
    };
    return txt[cat] || txt.men;
}

function isNewProduct(product) {
    if (product.isNew === true) return true;
    if (product.timestamp) {
        const date = product.timestamp.toDate ? product.timestamp.toDate() : new Date(product.timestamp.seconds * 1000);
        return (Date.now() - date.getTime()) < (1000 * 60 * 60 * 24 * 21);
    }
    return false;
}

function persistCart() { localStorage.setItem('sh_cart', JSON.stringify(cart)); }
function persistWishlist() { localStorage.setItem('sh_wishlist', JSON.stringify(wishlist)); }

// ============================ QR Renderer (multi-fallback) ============================
function renderShopQR(container, text, size = 200) {
    container.innerHTML = '';

    // 1) qrcode-generator (self-contained)
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
            return;
        } catch (err) {
            console.warn('qrcode-generator failed:', err);
        }
    }

    // 2) node-qrcode
    if (window.QRCode && typeof window.QRCode.toCanvas === 'function') {
        try {
            const canvas = document.createElement('canvas');
            container.appendChild(canvas);
            window.QRCode.toCanvas(canvas, text, { width: size, margin: 1, color: { dark: '#0A1024', light: '#FFFFFF' } });
            return;
        } catch (err) {
            console.warn('node-qrcode failed:', err);
        }
    }

    // 3) External API fallback
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&margin=1`;
    img.alt = 'QR';
    img.style.width = size + 'px';
    img.style.height = size + 'px';
    img.addEventListener('error', () => {
        container.innerHTML = '<div style="color:#888;padding:1rem;font-size:0.85rem">تعذّر إنشاء الرمز — تحقق من الاتصال</div>';
    });
    container.appendChild(img);
}

// ============================ Toast ============================
function toast(message, type = 'info') {
    const c = $('#sh-toast-container');
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info';
    const t = document.createElement('div');
    t.className = `sh-toast sh-toast-${type}`;
    t.innerHTML = `<i class="fa-solid ${icon}"></i><span>${escapeHtml(message)}</span>`;
    c.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateY(20px)';
        setTimeout(() => t.remove(), 300);
    }, 2500);
}

function showLoading(show) {
    $('#sh-loading-overlay').classList.toggle('show', !!show);
}

// ============================ Firebase: Inventory ============================
db.collection('inventory').onSnapshot(snapshot => {
    inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    inventoryLoaded = true;
    rerouteCurrent();
    updateBadges();
}, err => {
    console.error('Inventory load failed:', err);
    inventoryLoaded = true;
    rerouteCurrent();
});

function visibleProducts() {
    return inventory.filter(p => p.showInShop !== false && safeNum(p.sellPrice) > 0);
}

// ============================ Routing ============================
const routes = {
    '/': renderHome,
    '/cart': renderCart,
    '/checkout': renderCheckout,
    '/success': renderSuccess,
    '/wishlist': renderWishlist,
    '/account': renderAccount
};

function parseHash() {
    const raw = window.location.hash.replace(/^#/, '') || '/';
    return raw;
}

function navigate(path) {
    window.location.hash = path;
}

function router() {
    const path = parseHash();
    if (path.startsWith('/category/')) return renderCategory(path.replace('/category/', ''));
    if (path.startsWith('/product/')) return renderProduct(path.replace('/product/', ''));
    const handler = routes[path] || renderHome;
    handler();
    highlightNav(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function rerouteCurrent() {
    if (!inventoryLoaded) return;
    router();
}

window.addEventListener('hashchange', router);

function highlightNav(path) {
    $$('.sh-nav-link').forEach(el => {
        el.classList.toggle('active', el.dataset.route === path || (path === '/' && el.dataset.route === '/'));
    });
    $$('.sh-bnav-item').forEach(el => {
        const r = el.dataset.route;
        let active = false;
        if (r === path) active = true;
        else if (r === '/category/all' && path.startsWith('/category/')) active = true;
        el.classList.toggle('active', active);
    });
}

// ============================ Render: Home ============================
function renderHome() {
    const tpl = $('#tpl-home').content.cloneNode(true);
    $('#sh-main').replaceChildren(tpl);

    // Hero slides
    const slidesContainer = $('#sh-hero-slides');
    const dots = $('#sh-hero-dots');
    slidesContainer.innerHTML = '';
    dots.innerHTML = '';
    HERO_SLIDES.forEach((s, i) => {
        const slide = document.createElement('div');
        slide.className = 'sh-hero-slide' + (i === 0 ? ' active' : '');
        slide.innerHTML = `
            <div class="sh-hero-image" style="background-image:url('${s.image}')"></div>
            <div class="sh-hero-content">
                <h1>${escapeHtml(s.title)}</h1>
                <p>${escapeHtml(s.subtitle)}</p>
                <a href="${s.link}" class="sh-btn sh-btn-primary">${escapeHtml(s.cta)}</a>
            </div>`;
        slidesContainer.appendChild(slide);

        const dot = document.createElement('div');
        dot.className = 'sh-hero-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => setHeroSlide(i));
        dots.appendChild(dot);
    });
    startHeroAutoplay();

    // Categories
    const catGrid = $('#sh-categories-grid');
    catGrid.innerHTML = '';
    CATEGORIES.forEach(c => {
        const card = document.createElement('div');
        card.className = 'sh-category-card';
        card.addEventListener('click', () => navigate(`/category/${c.id}`));
        card.innerHTML = `
            <div class="sh-category-img">
                <img src="${c.img}" alt="${escapeHtml(c.name)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('i'),{className:'fa-solid ${c.icon}'}))">
            </div>
            <div class="sh-category-name">${escapeHtml(c.name)}</div>
            <div class="sh-category-underline"></div>`;
        catGrid.appendChild(card);
    });

    // New products
    const newGrid = $('#sh-new-products');
    const newest = visibleProducts()
        .slice()
        .sort((a, b) => {
            const da = a.timestamp?.toDate?.()?.getTime?.() || 0;
            const db_ = b.timestamp?.toDate?.()?.getTime?.() || 0;
            return db_ - da;
        })
        .slice(0, 12);
    renderProductsInto(newGrid, newest, { showNewBadge: true });
}

function startHeroAutoplay() {
    if (heroInterval) clearInterval(heroInterval);
    heroSlideIndex = 0;
    heroInterval = setInterval(() => {
        setHeroSlide((heroSlideIndex + 1) % HERO_SLIDES.length);
    }, 5500);
}

function setHeroSlide(i) {
    heroSlideIndex = i;
    $$('.sh-hero-slide').forEach((s, idx) => s.classList.toggle('active', idx === i));
    $$('.sh-hero-dot').forEach((d, idx) => d.classList.toggle('active', idx === i));
}

// ============================ Render: Product Card ============================
function renderProductsInto(container, products, opts = {}) {
    container.innerHTML = '';
    if (!inventoryLoaded) {
        for (let i = 0; i < 6; i++) {
            const sk = document.createElement('div');
            sk.className = 'sh-skeleton sh-skeleton-card';
            container.appendChild(sk);
        }
        return;
    }
    if (!products.length) {
        container.innerHTML = `
            <div class="sh-empty" style="grid-column:1/-1">
                <i class="fa-solid fa-box-open"></i>
                <h3>لا توجد منتجات</h3>
                <p>${escapeHtml(opts.emptyText || 'لا توجد منتجات لعرضها حالياً')}</p>
                <a href="#/" class="sh-btn sh-btn-primary">العودة للرئيسية</a>
            </div>`;
        return;
    }
    products.forEach(p => container.appendChild(productCard(p, opts)));
}

function productCard(product, opts = {}) {
    const card = document.createElement('div');
    card.className = 'sh-product-card';
    const inStock = safeNum(product.qty) > 0;
    const img = getProductImage(product);
    const isNew = opts.showNewBadge && (isNewProduct(product) || inferIsNewByOrder(product));
    const wished = wishlist.includes(product.id);
    card.innerHTML = `
        <div class="sh-product-img">
            ${isNew ? '<span class="sh-product-badge">جديد</span>' : ''}
            <button class="sh-product-wishlist ${wished ? 'active' : ''}" data-wish="${product.id}" title="المفضلة">
                <i class="${wished ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <img src="${img}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.style.display='none'">
            ${!inStock ? '<div class="sh-product-out">غير متوفر</div>' : ''}
        </div>
        <div class="sh-product-body">
            <div class="sh-product-title" data-open="${product.id}">${escapeHtml(product.name)}</div>
            <div class="sh-product-foot">
                <span class="sh-product-price-main">${fmtPrice(product.sellPrice)}</span>
                <button class="sh-product-add" data-add="${product.id}" ${!inStock ? 'disabled' : ''} title="${inStock ? 'أضف للسلة' : 'غير متوفر'}">
                    <i class="fa-solid fa-bag-shopping"></i>
                </button>
            </div>
        </div>`;

    card.querySelector('.sh-product-img img').addEventListener('error', function() {
        const ph = document.createElement('div');
        ph.className = 'sh-placeholder';
        ph.innerHTML = '<i class="fa-solid fa-shirt"></i>';
        this.replaceWith(ph);
    });

    card.querySelector('[data-open]').addEventListener('click', () => navigate(`/product/${product.id}`));
    card.querySelector('.sh-product-img').addEventListener('click', e => {
        if (!e.target.closest('button')) navigate(`/product/${product.id}`);
    });
    card.querySelector('[data-wish]').addEventListener('click', e => {
        e.stopPropagation();
        toggleWishlist(product.id);
    });
    const addBtn = card.querySelector('[data-add]');
    if (inStock) {
        addBtn.addEventListener('click', e => {
            e.stopPropagation();
            quickAddToCart(product);
        });
    }
    return card;
}

function inferIsNewByOrder(p) {
    const all = visibleProducts();
    const idx = all.findIndex(x => x.id === p.id);
    return idx >= 0 && idx < 6;
}

// ============================ Render: Category Listing ============================
function renderCategory(cat) {
    const tpl = $('#tpl-category').content.cloneNode(true);
    $('#sh-main').replaceChildren(tpl);

    const titleMap = {
        all: 'جميع المنتجات',
        new: 'وصل حديثاً',
        offers: 'العروض',
        ...Object.fromEntries(CATEGORIES.map(c => [c.id, c.name]))
    };
    $('#sh-cat-title').innerText = titleMap[cat] || 'المنتجات';

    const products = filterByCategory(cat);
    const grid = $('#sh-listing-grid');

    const sortSelect = $('#sh-sort');
    sortSelect.addEventListener('change', () => {
        renderProductsInto(grid, applySort(products, sortSelect.value), { showNewBadge: true });
    });
    renderProductsInto(grid, applySort(products, 'newest'), { showNewBadge: true });
}

function filterByCategory(cat) {
    const all = visibleProducts();
    if (cat === 'all') return all;
    if (cat === 'new') {
        return all.filter(p => isNewProduct(p) || inferIsNewByOrder(p));
    }
    if (cat === 'offers') {
        return all.filter(p => p.discount || p.salePrice);
    }
    return all.filter(p => (p.category || inferCategory(p.name)) === cat);
}

function applySort(arr, mode) {
    const list = arr.slice();
    switch (mode) {
        case 'price-asc': return list.sort((a, b) => safeNum(a.sellPrice) - safeNum(b.sellPrice));
        case 'price-desc': return list.sort((a, b) => safeNum(b.sellPrice) - safeNum(a.sellPrice));
        case 'name': return list.sort((a, b) => String(a.name).localeCompare(String(b.name), 'ar'));
        case 'newest':
        default:
            return list.sort((a, b) => {
                const da = a.timestamp?.toDate?.()?.getTime?.() || 0;
                const db_ = b.timestamp?.toDate?.()?.getTime?.() || 0;
                return db_ - da;
            });
    }
}

// ============================ Render: Product Detail ============================
let currentProductSel = { id: null, size: null, color: null, qty: 1, imgIdx: 0 };

function renderProduct(id) {
    const product = inventory.find(p => p.id === id);
    if (!product) {
        $('#sh-main').innerHTML = `
            <div class="sh-empty">
                <i class="fa-solid fa-circle-exclamation"></i>
                <h3>المنتج غير موجود</h3>
                <p>قد يكون هذا المنتج محذوفاً أو غير متاح حالياً.</p>
                <a href="#/" class="sh-btn sh-btn-primary">العودة للرئيسية</a>
            </div>`;
        return;
    }
    const tpl = $('#tpl-product').content.cloneNode(true);
    $('#sh-main').replaceChildren(tpl);

    const images = getProductImages(product);
    const sizes = getProductSizes(product);
    const colors = getProductColors(product);
    const inStock = safeNum(product.qty) > 0;

    currentProductSel = { id, size: sizes[0], color: colors[0], qty: 1, imgIdx: 0 };

    $('#sh-product-bc').innerText = product.name;
    $('#sh-product-name').innerText = product.name;
    $('#sh-product-price').innerText = fmtPrice(product.sellPrice);
    $('#sh-product-desc').innerText = getProductDescription(product);

    const mainImg = $('#sh-product-main-img');
    const thumbs = $('#sh-product-thumbs');
    function updateMain() {
        mainImg.innerHTML = '';
        const img = document.createElement('img');
        img.src = images[currentProductSel.imgIdx];
        img.alt = product.name;
        img.addEventListener('error', () => {
            const ph = document.createElement('div');
            ph.className = 'sh-placeholder';
            ph.innerHTML = '<i class="fa-solid fa-shirt"></i>';
            mainImg.replaceChildren(ph);
        });
        mainImg.appendChild(img);
    }
    updateMain();
    thumbs.innerHTML = '';
    images.forEach((src, i) => {
        const t = document.createElement('div');
        t.className = 'sh-thumb' + (i === 0 ? ' active' : '');
        t.innerHTML = `<img src="${src}" alt="" onerror="this.parentElement.style.display='none'">`;
        t.addEventListener('click', () => {
            currentProductSel.imgIdx = i;
            updateMain();
            $$('.sh-thumb').forEach((el, idx) => el.classList.toggle('active', idx === i));
        });
        thumbs.appendChild(t);
    });

    const sizeBox = $('#sh-product-sizes');
    sizeBox.innerHTML = '';
    sizes.forEach((s, i) => {
        const chip = document.createElement('button');
        chip.className = 'sh-option-chip' + (i === 0 ? ' active' : '');
        chip.innerText = s;
        chip.addEventListener('click', () => {
            currentProductSel.size = s;
            $$('#sh-product-sizes .sh-option-chip').forEach(el => el.classList.remove('active'));
            chip.classList.add('active');
        });
        sizeBox.appendChild(chip);
    });

    const colorBox = $('#sh-product-colors');
    colorBox.innerHTML = '';
    colors.forEach((c, i) => {
        const chip = document.createElement('button');
        chip.className = 'sh-option-chip' + (i === 0 ? ' active' : '');
        const hex = typeof c === 'string' ? '#888' : (c.hex || '#888');
        const name = typeof c === 'string' ? c : (c.name || 'لون');
        chip.style.backgroundColor = hex;
        chip.title = name;
        chip.addEventListener('click', () => {
            currentProductSel.color = c;
            $$('#sh-product-colors .sh-option-chip').forEach(el => el.classList.remove('active'));
            chip.classList.add('active');
        });
        colorBox.appendChild(chip);
    });

    const qtyInput = $('#sh-qty-value');
    $('#sh-qty-minus').addEventListener('click', () => {
        const v = Math.max(1, parseInt(qtyInput.value || '1') - 1);
        qtyInput.value = v;
        currentProductSel.qty = v;
    });
    $('#sh-qty-plus').addEventListener('click', () => {
        const max = safeNum(product.qty, 99);
        const v = Math.min(max, parseInt(qtyInput.value || '1') + 1);
        qtyInput.value = v;
        currentProductSel.qty = v;
    });
    qtyInput.addEventListener('input', () => {
        let v = parseInt(qtyInput.value || '1');
        if (isNaN(v) || v < 1) v = 1;
        const max = safeNum(product.qty, 99);
        if (v > max) v = max;
        qtyInput.value = v;
        currentProductSel.qty = v;
    });

    const addBtn = $('#sh-add-to-cart');
    if (!inStock) {
        addBtn.disabled = true;
        addBtn.style.opacity = 0.5;
        addBtn.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> غير متوفر';
    } else {
        addBtn.addEventListener('click', () => addToCart(product, currentProductSel));
    }

    const wishBtn = $('#sh-add-to-wishlist');
    function syncWishBtn() {
        const w = wishlist.includes(product.id);
        wishBtn.innerHTML = `<i class="${w ? 'fa-solid' : 'fa-regular'} fa-heart"></i>`;
        wishBtn.style.color = w ? 'var(--sh-danger)' : '';
    }
    syncWishBtn();
    wishBtn.addEventListener('click', () => {
        toggleWishlist(product.id);
        syncWishBtn();
    });

    $('#sh-product-meta').innerHTML = `
        <div><i class="fa-solid fa-truck-fast"></i> شحن مجاني للطلبات فوق ${FREE_SHIPPING_THRESHOLD} د.ج</div>
        <div><i class="fa-solid fa-arrow-rotate-left"></i> إرجاع مجاني خلال 14 يوم</div>
        <div><i class="fa-solid fa-shield-halved"></i> دفع آمن عند الاستلام</div>
        <div><i class="fa-solid fa-box-open"></i> الكمية المتوفرة: ${inStock ? safeNum(product.qty) : 'غير متوفر'}</div>`;
}

// ============================ Cart ============================
function quickAddToCart(product) {
    const sizes = getProductSizes(product);
    const colors = getProductColors(product);
    addToCart(product, { size: sizes[0], color: colors[0], qty: 1 });
}

function addToCart(product, sel) {
    if (safeNum(product.qty) <= 0) {
        toast('المنتج غير متوفر حالياً', 'error');
        return;
    }
    const colorObj = typeof sel.color === 'string' ? { name: sel.color, hex: '#888' } : sel.color;
    const key = `${product.id}__${sel.size}__${colorObj.name}`;
    const existing = cart.find(i => i.key === key);
    const desiredQty = (existing ? existing.qty : 0) + safeNum(sel.qty, 1);
    if (desiredQty > safeNum(product.qty)) {
        toast(`الكمية المطلوبة تتجاوز المخزون (${safeNum(product.qty)} متاح)`, 'error');
        return;
    }
    if (existing) {
        existing.qty = desiredQty;
    } else {
        cart.push({
            key,
            productId: product.id,
            name: product.name,
            sellPrice: safeNum(product.sellPrice),
            buyPrice: safeNum(product.buyPrice),
            image: getProductImage(product),
            size: sel.size,
            color: colorObj,
            qty: safeNum(sel.qty, 1)
        });
    }
    persistCart();
    updateBadges();
    toast('تمت إضافة المنتج إلى السلة', 'success');
}

function updateCartItemQty(key, delta) {
    const item = cart.find(i => i.key === key);
    if (!item) return;
    const product = inventory.find(p => p.id === item.productId);
    const max = product ? safeNum(product.qty) : 99;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
        cart = cart.filter(i => i.key !== key);
    } else if (newQty > max) {
        toast(`الكمية القصوى ${max}`, 'error');
        return;
    } else {
        item.qty = newQty;
    }
    persistCart();
    updateBadges();
    renderCart();
}

function removeCartItem(key) {
    cart = cart.filter(i => i.key !== key);
    persistCart();
    updateBadges();
    renderCart();
    toast('تم حذف المنتج من السلة', 'info');
}

function cartSubtotal() {
    return cart.reduce((s, i) => s + i.sellPrice * i.qty, 0);
}

function cartDiscount() {
    if (!appliedPromo) return 0;
    const sub = cartSubtotal();
    if (appliedPromo.type === 'percent') return Math.round(sub * appliedPromo.value / 100);
    if (appliedPromo.type === 'amount') return Math.min(appliedPromo.value, sub);
    return 0;
}

function cartShipping() {
    if (!cart.length) return 0;
    const sub = cartSubtotal();
    return sub >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

function cartTotal() {
    return Math.max(0, cartSubtotal() - cartDiscount() + cartShipping());
}

function renderCart() {
    const tpl = $('#tpl-cart').content.cloneNode(true);
    $('#sh-main').replaceChildren(tpl);

    const items = $('#sh-cart-items');
    const summary = $('#sh-cart-summary');

    if (!cart.length) {
        $('#sh-main').innerHTML = `
            <div class="sh-empty">
                <i class="fa-solid fa-cart-shopping"></i>
                <h3>السلة فارغة</h3>
                <p>أضف بعض المنتجات لتظهر هنا</p>
                <a href="#/category/all" class="sh-btn sh-btn-primary">تصفح المنتجات</a>
            </div>`;
        return;
    }

    items.innerHTML = '';
    cart.forEach(item => {
        const product = inventory.find(p => p.id === item.productId);
        const outOfStock = !product || safeNum(product?.qty) <= 0;
        const row = document.createElement('div');
        row.className = 'sh-cart-item';
        row.innerHTML = `
            <div class="sh-cart-item-img"></div>
            <div class="sh-cart-item-info">
                <h4>${escapeHtml(item.name)}</h4>
                <div class="sh-cart-meta">
                    المقاس: <b>${escapeHtml(item.size || '-')}</b> · اللون: <b>${escapeHtml(item.color?.name || '-')}</b>
                    ${outOfStock ? '<br><span style="color:var(--sh-danger)">غير متوفر — يرجى الحذف</span>' : ''}
                </div>
                <div class="sh-cart-price">${fmtPrice(item.sellPrice * item.qty)}</div>
            </div>
            <div class="sh-cart-item-qty">
                <button data-q="-" title="نقص"><i class="fa-solid fa-minus"></i></button>
                <span>${item.qty}</span>
                <button data-q="+" title="زيادة"><i class="fa-solid fa-plus"></i></button>
            </div>
            <button class="sh-cart-item-remove" data-remove title="حذف"><i class="fa-solid fa-trash"></i></button>`;
        const imgWrap = row.querySelector('.sh-cart-item-img');
        const imgEl = document.createElement('img');
        imgEl.src = item.image;
        imgEl.alt = item.name;
        imgEl.addEventListener('error', () => {
            const ph = document.createElement('div');
            ph.className = 'sh-placeholder';
            ph.innerHTML = '<i class="fa-solid fa-shirt"></i>';
            imgWrap.replaceChildren(ph);
        });
        imgWrap.appendChild(imgEl);
        row.querySelector('[data-q="-"]').addEventListener('click', () => updateCartItemQty(item.key, -1));
        row.querySelector('[data-q="+"]').addEventListener('click', () => updateCartItemQty(item.key, 1));
        row.querySelector('[data-remove]').addEventListener('click', () => removeCartItem(item.key));
        items.appendChild(row);
    });

    renderSummaryInto(summary, true);
}

function renderSummaryInto(container, showCheckout) {
    const sub = cartSubtotal();
    const ship = cartShipping();
    const disc = cartDiscount();
    container.innerHTML = `
        <h3><i class="fa-solid fa-receipt"></i> ملخص الطلب</h3>
        <div class="sh-summary-row"><span>المجموع الفرعي</span><span>${fmtPrice(sub)}</span></div>
        ${disc ? `<div class="sh-summary-row"><span>الخصم (${appliedPromo.label})</span><span style="color:var(--sh-success)">- ${fmtPrice(disc)}</span></div>` : ''}
        <div class="sh-summary-row"><span>الشحن</span><span>${ship === 0 ? '<span style="color:var(--sh-success)">مجاني</span>' : fmtPrice(ship)}</span></div>
        ${ship > 0 ? `<div style="color:var(--sh-text-3);font-size:.8rem;margin-bottom:.5rem">أضف ${fmtPrice(FREE_SHIPPING_THRESHOLD - sub)} للحصول على شحن مجاني</div>` : ''}
        <div class="sh-summary-row sh-total"><span>الإجمالي</span><span>${fmtPrice(cartTotal())}</span></div>
        ${showCheckout ? `<a href="#/checkout" class="sh-btn sh-btn-primary sh-btn-block" style="margin-top:1rem">إتمام الطلب <i class="fa-solid fa-arrow-left"></i></a>` : ''}
        <a href="#/category/all" class="sh-btn sh-btn-ghost sh-btn-block" style="margin-top:.6rem">متابعة التسوق</a>`;
}

// ============================ Wishlist ============================
function toggleWishlist(id) {
    if (wishlist.includes(id)) {
        wishlist = wishlist.filter(x => x !== id);
        toast('تم إزالة المنتج من المفضلة', 'info');
    } else {
        wishlist.push(id);
        toast('تمت إضافة المنتج إلى المفضلة', 'success');
    }
    persistWishlist();
    updateBadges();
    if (parseHash() === '/wishlist') renderWishlist();
    else {
        $$('.sh-product-wishlist').forEach(btn => {
            const pid = btn.dataset.wish;
            const w = wishlist.includes(pid);
            btn.classList.toggle('active', w);
            btn.querySelector('i').className = (w ? 'fa-solid' : 'fa-regular') + ' fa-heart';
        });
    }
}

function renderWishlist() {
    const tpl = $('#tpl-wishlist').content.cloneNode(true);
    $('#sh-main').replaceChildren(tpl);
    const list = wishlist.map(id => inventory.find(p => p.id === id)).filter(Boolean);
    const grid = $('#sh-wishlist-grid');
    if (!list.length) {
        $('#sh-main').innerHTML = `
            <div class="sh-empty">
                <i class="fa-regular fa-heart"></i>
                <h3>قائمة المفضلة فارغة</h3>
                <p>أضف منتجات إلى المفضلة لتجدها هنا لاحقاً</p>
                <a href="#/category/all" class="sh-btn sh-btn-primary">تصفح المنتجات</a>
            </div>`;
        return;
    }
    renderProductsInto(grid, list);
}

// ============================ Checkout ============================
function renderCheckout() {
    if (!cart.length) { navigate('/cart'); return; }
    const tpl = $('#tpl-checkout').content.cloneNode(true);
    $('#sh-main').replaceChildren(tpl);

    const wilSel = $('#co-wilaya');
    wilSel.innerHTML = '<option value="">اختر الولاية</option>' +
        WILAYAS.map(w => `<option value="${escapeHtml(w)}">${escapeHtml(w)}</option>`).join('');

    if (customer) {
        $('#co-name').value = customer.name || '';
        $('#co-phone').value = customer.phone || '';
        if (customer.wilaya) $('#co-wilaya').value = customer.wilaya;
        $('#co-baladiya').value = customer.baladiya || '';
        $('#co-address').value = customer.address || '';
    }

    renderCheckoutSummary();

    $('#co-apply-promo').addEventListener('click', () => {
        const code = $('#co-promo').value.trim().toUpperCase();
        if (PROMO_CODES[code]) {
            appliedPromo = { code, ...PROMO_CODES[code] };
            toast(`تم تطبيق الخصم: ${appliedPromo.label}`, 'success');
        } else {
            appliedPromo = null;
            toast('كود الخصم غير صالح', 'error');
        }
        renderCheckoutSummary();
    });

    $('#sh-checkout-form').addEventListener('submit', e => {
        e.preventDefault();
        submitOrder();
    });
}

function renderCheckoutSummary() {
    const summary = $('#sh-checkout-summary');
    const itemsHtml = cart.map(item => `
        <div class="sh-co-item">
            <div class="sh-co-item-img">
                <img src="${item.image}" alt="" onerror="this.style.display='none'">
            </div>
            <div class="sh-co-item-info">
                <h5>${escapeHtml(item.name)}</h5>
                <span>${escapeHtml(item.size || '-')} · ${escapeHtml(item.color?.name || '-')} · x${item.qty}</span>
            </div>
            <div class="sh-co-item-price">${fmtPrice(item.sellPrice * item.qty)}</div>
        </div>`).join('');

    const sub = cartSubtotal();
    const disc = cartDiscount();
    const ship = cartShipping();
    summary.innerHTML = `
        <h3><i class="fa-solid fa-receipt"></i> ملخص الطلب</h3>
        <div class="sh-co-items">${itemsHtml}</div>
        <div class="sh-summary-row"><span>المجموع الفرعي</span><span>${fmtPrice(sub)}</span></div>
        ${disc ? `<div class="sh-summary-row"><span>الخصم</span><span style="color:var(--sh-success)">- ${fmtPrice(disc)}</span></div>` : ''}
        <div class="sh-summary-row"><span>الشحن</span><span>${ship === 0 ? '<span style="color:var(--sh-success)">مجاني</span>' : fmtPrice(ship)}</span></div>
        <div class="sh-summary-row sh-total"><span>الإجمالي</span><span>${fmtPrice(cartTotal())}</span></div>
        <button type="button" class="sh-btn sh-btn-primary sh-btn-block" style="margin-top:1rem" id="sh-submit-order">
            <i class="fa-solid fa-check"></i> تأكيد الطلب
        </button>`;

    $('#sh-submit-order').addEventListener('click', () => {
        const form = $('#sh-checkout-form');
        if (!form.reportValidity()) return;
        submitOrder();
    });
}

async function submitOrder() {
    const name = $('#co-name').value.trim();
    const phone = $('#co-phone').value.trim();
    const wilaya = $('#co-wilaya').value.trim();
    const baladiya = $('#co-baladiya').value.trim();
    const address = $('#co-address').value.trim();
    const notes = $('#co-notes').value.trim();
    if (!name || !phone || !wilaya || !baladiya || !address) {
        toast('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }

    // Re-validate stock just before submitting
    const stockIssue = cart.find(item => {
        const p = inventory.find(pp => pp.id === item.productId);
        return !p || safeNum(p.qty) < item.qty || p.showInShop === false;
    });
    if (stockIssue) {
        toast(`المنتج "${stockIssue.name}" لم يعد متوفراً بالكمية المطلوبة`, 'error');
        return;
    }

    showLoading(true);
    try {
        const orderNumber = genOrderNumber();
        const order = {
            orderNumber,
            customerName: name,
            phone,
            wilaya,
            baladiya,
            address,
            notes,
            items: cart.map(item => ({
                productId: item.productId,
                name: item.name,
                qty: item.qty,
                size: item.size || '',
                colorName: item.color?.name || '',
                colorHex: item.color?.hex || '',
                sellPrice: item.sellPrice,
                buyPrice: item.buyPrice,
                image: item.image
            })),
            subtotal: cartSubtotal(),
            discount: cartDiscount(),
            promoCode: appliedPromo?.code || null,
            shipping: cartShipping(),
            totalPrice: cartTotal(),
            paymentMethod: 'cod',
            status: 'new',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await db.collection('online_orders').add(order);

        customer = { name, phone, wilaya, baladiya, address };
        localStorage.setItem('sh_customer', JSON.stringify(customer));

        const myOrders = JSON.parse(localStorage.getItem('sh_my_orders') || '[]');
        myOrders.unshift({ id: docRef.id, orderNumber, total: order.totalPrice, status: 'new', date: new Date().toISOString() });
        localStorage.setItem('sh_my_orders', JSON.stringify(myOrders.slice(0, 20)));

        sessionStorage.setItem('sh_last_order', JSON.stringify({
            orderNumber, name, phone, address: `${wilaya} - ${baladiya} - ${address}`,
            total: order.totalPrice, items: order.items.length
        }));

        cart = [];
        appliedPromo = null;
        persistCart();
        updateBadges();
        navigate('/success');
    } catch (err) {
        console.error('Order submit failed:', err);
        toast('حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================ Success ============================
function renderSuccess() {
    const tpl = $('#tpl-success').content.cloneNode(true);
    $('#sh-main').replaceChildren(tpl);

    const data = JSON.parse(sessionStorage.getItem('sh_last_order') || 'null');
    const box = $('#sh-success-order');
    const qrCard = $('#sh-order-qr-card');

    if (data) {
        box.innerHTML = `
            <div class="sh-summary-row"><span>رقم الطلب</span><b>${escapeHtml(data.orderNumber)}</b></div>
            <div class="sh-summary-row"><span>الاسم</span><span>${escapeHtml(data.name)}</span></div>
            <div class="sh-summary-row"><span>الهاتف</span><span>${escapeHtml(data.phone)}</span></div>
            <div class="sh-summary-row"><span>العنوان</span><span style="text-align:left">${escapeHtml(data.address)}</span></div>
            <div class="sh-summary-row"><span>عدد المنتجات</span><span>${data.items}</span></div>
            <div class="sh-summary-row sh-total"><span>الإجمالي</span><span>${fmtPrice(data.total)}</span></div>`;

        // Render order QR with fallback chain
        const payload = 'SH-O:' + data.orderNumber;
        $('#sh-order-qr-code').innerText = payload;
        const wrap = $('.sh-order-qr-canvas-wrap');
        if (wrap) {
            // Remove the static canvas; renderShopQR will inject the right element
            wrap.innerHTML = '';
            renderShopQR(wrap, payload, 200);
        }

        function currentQRDataUrl() {
            const el = wrap && wrap.querySelector('canvas, img');
            if (!el) return null;
            if (el.tagName === 'CANVAS') {
                try { return el.toDataURL('image/png'); } catch (_) { return null; }
            }
            return el.src || null;
        }

        $('#sh-qr-download').addEventListener('click', () => {
            const dataUrl = currentQRDataUrl();
            if (!dataUrl) return;
            const link = document.createElement('a');
            link.download = `${data.orderNumber}.png`;
            link.href = dataUrl;
            link.click();
        });

        $('#sh-qr-print').addEventListener('click', () => {
            const dataUrl = currentQRDataUrl();
            if (!dataUrl) return;
            const w = window.open('', '_blank', 'width=480,height=620');
            if (!w) return;
            w.document.write(`
                <!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>QR الطلب</title>
                <style>
                    body { font-family: 'Cairo', Arial, sans-serif; margin:0; padding:2rem; display:flex; align-items:center; justify-content:center; min-height:100vh; }
                    .box { text-align:center; max-width:340px; border:1px dashed #999; padding:1.5rem; border-radius:10px; }
                    .box .t { font-size:0.9rem; color:#666; margin-bottom:.5rem; }
                    .box img { width:220px; height:220px; }
                    .box .n { font-weight:700; margin-top:.7rem; font-family:monospace; word-break:break-all; }
                    .box .h { font-size:0.8rem; color:#666; margin-top:.5rem; }
                    @media print { .box { border:none; } }
                </style></head><body>
                <div class="box">
                    <div class="t">StyleHub — رمز استلام الطلب</div>
                    <img src="${dataUrl}" alt="QR">
                    <div class="n">${payload}</div>
                    <div class="h">قدّم هذا الرمز عند الاستلام</div>
                </div>
                <script>window.onload=function(){setTimeout(function(){window.print();window.close();},200);};<\/script>
                </body></html>`);
            w.document.close();
        });
    } else {
        if (box) box.style.display = 'none';
        if (qrCard) qrCard.style.display = 'none';
    }
}

// ============================ Account ============================
function renderAccount() {
    const tpl = $('#tpl-account').content.cloneNode(true);
    $('#sh-main').replaceChildren(tpl);

    if (customer) {
        $('#sh-account-name').innerText = customer.name;
        $('#sh-account-phone').innerText = customer.phone;
        $('#sh-login-name').value = customer.name;
        $('#sh-login-phone').value = customer.phone;
    }

    $('#sh-login-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = $('#sh-login-name').value.trim();
        const phone = $('#sh-login-phone').value.trim();
        if (!name || !phone) return;
        customer = { ...(customer || {}), name, phone };
        localStorage.setItem('sh_customer', JSON.stringify(customer));
        $('#sh-account-name').innerText = name;
        $('#sh-account-phone').innerText = phone;
        toast('تم حفظ بياناتك', 'success');
        loadMyOrders();
    });

    loadMyOrders();
}

async function loadMyOrders() {
    const box = $('#sh-my-orders');
    if (!box) return;
    const local = JSON.parse(localStorage.getItem('sh_my_orders') || '[]');
    if (!local.length) {
        box.innerHTML = '<p style="color:var(--sh-text-3); text-align:center; padding:1.5rem 0">لا توجد طلبات سابقة</p>';
        return;
    }
    box.innerHTML = '<div style="display:flex;flex-direction:column;gap:.6rem">' +
        local.map(o => `
            <div style="padding:.8rem;background:var(--sh-bg-2);border-radius:12px;border:1px solid var(--sh-border);display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap">
                <div>
                    <div style="font-weight:600">${escapeHtml(o.orderNumber)}</div>
                    <div style="color:var(--sh-text-3);font-size:.8rem">${new Date(o.date).toLocaleString('ar-DZ')}</div>
                </div>
                <div style="color:var(--sh-accent-2);font-weight:700">${fmtPrice(o.total)}</div>
            </div>`).join('') + '</div>';

    // Try to fetch fresh statuses
    try {
        const phone = customer?.phone;
        if (phone) {
            const snap = await db.collection('online_orders').where('phone', '==', phone).limit(20).get();
            const fresh = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            if (fresh.length) {
                box.innerHTML = '<div style="display:flex;flex-direction:column;gap:.6rem">' +
                    fresh.map(o => {
                        const statusLabel = {
                            'new': { t: 'جديد', c: 'var(--sh-accent-2)' },
                            'processing': { t: 'قيد التجهيز', c: 'var(--sh-warning)' },
                            'shipped': { t: 'تم الشحن', c: 'var(--sh-accent-2)' },
                            'delivered': { t: 'تم التسليم', c: 'var(--sh-success)' },
                            'cancelled': { t: 'ملغي', c: 'var(--sh-danger)' }
                        }[o.status] || { t: o.status, c: 'var(--sh-text-3)' };
                        const date = o.createdAt?.toDate?.()?.toLocaleString('ar-DZ') || '';
                        return `
                            <div style="padding:.9rem;background:var(--sh-bg-2);border-radius:12px;border:1px solid var(--sh-border)">
                                <div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap">
                                    <div>
                                        <div style="font-weight:600">${escapeHtml(o.orderNumber)}</div>
                                        <div style="color:var(--sh-text-3);font-size:.8rem">${date}</div>
                                    </div>
                                    <div style="color:var(--sh-accent-2);font-weight:700">${fmtPrice(o.totalPrice)}</div>
                                </div>
                                <div style="margin-top:.5rem;display:flex;justify-content:space-between;color:var(--sh-text-3);font-size:.8rem">
                                    <span>${o.items?.length || 0} منتج</span>
                                    <span style="color:${statusLabel.c};font-weight:600">${statusLabel.t}</span>
                                </div>
                            </div>`;
                    }).join('') + '</div>';
            }
        }
    } catch (e) {
        // silent — fall back to local cache
    }
}

// ============================ Badges ============================
function updateBadges() {
    const cartCount = cart.reduce((s, i) => s + i.qty, 0);
    const wishCount = wishlist.length;
    ['#sh-cart-badge', '#sh-cart-badge-m', '#sh-cart-badge-b'].forEach(sel => {
        const el = $(sel);
        if (!el) return;
        el.innerText = cartCount;
        el.style.display = cartCount > 0 ? 'flex' : 'none';
    });
    const wEl = $('#sh-wishlist-badge');
    if (wEl) {
        wEl.innerText = wishCount;
        wEl.style.display = wishCount > 0 ? 'flex' : 'none';
    }
}

// ============================ Search ============================
function setupSearch() {
    const input = $('#sh-search-input');
    const results = $('#sh-search-results');
    const mInput = $('#sh-mobile-search-input');
    const mBox = $('#sh-mobile-search');
    const mBtn = $('#sh-mobile-search-btn');

    function doSearch(q, target) {
        if (!q || q.length < 1) {
            target.classList.remove('show');
            target.innerHTML = '';
            return;
        }
        const matches = visibleProducts().filter(p =>
            String(p.name).toLowerCase().includes(q.toLowerCase())
        ).slice(0, 8);
        if (!matches.length) {
            target.innerHTML = '<div class="sh-search-result-item" style="cursor:default;color:var(--sh-text-3)">لا توجد نتائج</div>';
            target.classList.add('show');
            return;
        }
        target.innerHTML = matches.map(p => `
            <div class="sh-search-result-item" data-id="${p.id}">
                <div class="sh-search-result-img"><img src="${getProductImage(p)}" alt="" onerror="this.style.display='none'"></div>
                <div class="sh-search-result-info">
                    <h5>${escapeHtml(p.name)}</h5>
                    <span>${fmtPrice(p.sellPrice)}</span>
                </div>
            </div>`).join('');
        target.classList.add('show');
        target.querySelectorAll('[data-id]').forEach(el => {
            el.addEventListener('click', () => {
                navigate(`/product/${el.dataset.id}`);
                target.classList.remove('show');
                if (input) input.value = '';
                if (mInput) mInput.value = '';
            });
        });
    }

    if (input) {
        input.addEventListener('input', () => doSearch(input.value, results));
        input.addEventListener('focus', () => { if (input.value) doSearch(input.value, results); });
        document.addEventListener('click', e => {
            if (!input.contains(e.target) && !results.contains(e.target)) {
                results.classList.remove('show');
            }
        });
    }

    if (mBtn && mBox && mInput) {
        mBtn.addEventListener('click', () => {
            const shown = mBox.style.display !== 'none';
            mBox.style.display = shown ? 'none' : 'block';
            if (!shown) mInput.focus();
        });
        const mResults = document.createElement('div');
        mResults.className = 'sh-search-results';
        mResults.style.position = 'absolute';
        mResults.style.top = 'calc(100% + .4rem)';
        mResults.style.right = '0';
        mResults.style.left = '0';
        mBox.style.position = 'relative';
        mBox.appendChild(mResults);
        mInput.addEventListener('input', () => doSearch(mInput.value, mResults));
    }
}

setupSearch();

// ============================ Init ============================
function init() {
    updateBadges();
    if (!window.location.hash) window.location.hash = '/';
    else router();
}
init();
