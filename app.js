const tg = window.Telegram.WebApp;
let cart = [];
const BACKEND_URL = "https://r-firstbot.onrender.com"; 

tg.expand();
tg.MainButton.setText("ПОДТВЕРДИТЬ ЗАКАЗ");

// Навигация
window.showPage = function(pageId, element) {
    if (pageId === 'profile') renderHistory();

    const pages = ['shop-page', 'info-page', 'profile-page'];
    pages.forEach(id => {
        const pg = document.getElementById(id);
        if (pg) pg.style.display = 'none';
    });
    
    document.getElementById(pageId + '-page').style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (element) element.classList.add('active');
};

// Загрузка товаров
fetch('products.json')
    .then(res => res.json())
    .then(products => {
        window.allProducts = products;
        renderItems(products);
        document.getElementById('search').oninput = (e) => {
            const val = e.target.value.toLowerCase();
            renderItems(window.allProducts.filter(p => p.name.toLowerCase().includes(val)));
        };
    });

function renderItems(items) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '';
    items.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        const safeId = p.name.replace(/[^a-z0-9]/gi, '');
        const count = cart.filter(item => item.name === p.name).length;
        
        card.innerHTML = `
            <div class="badge" id="badge-${safeId}" style="display: ${count > 0 ? 'flex' : 'none'}">${count}</div>
            <img src="${p.image || 'https://cdn-icons-png.flaticon.com/512/679/679821.png'}" class="product-img">
            <div class="card-content">
                <h3>${p.name}</h3>
                <p class="price">${p.price.toLocaleString()} сум</p>
                <div id="btns-${safeId}">
                    ${count > 0 ? renderCounter(p.name, p.price, count) : `<button class="main-add-btn" onclick="addToCart('${p.name}', ${p.price})">В корзину</button>`}
                </div>
            </div>
        `;
        resultsDiv.appendChild(card);
    });
}

function renderCounter(name, price, count) {
    return `<div class="counter-btns">
        <button class="minus-btn" onclick="removeFromCart('${name}', ${price})">−</button>
        <span class="count-num">${count}</span>
        <button class="plus-btn" onclick="addToCart('${name}', ${price})">+</button>
    </div>`;
}

window.addToCart = function(name, price) {
    cart.push({ name, price });
    updateCardUI(name);
};

window.removeFromCart = function(name, price) {
    const index = cart.findLastIndex(item => item.name === name);
    if (index > -1) cart.splice(index, 1);
    updateCardUI(name);
};

function updateCardUI(name) {
    const safeId = name.replace(/[^a-z0-9]/gi, '');
    const count = cart.filter(item => item.name === name).length;
    const badge = document.getElementById(`badge-${safeId}`);
    if (badge) {
        badge.innerText = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
    const container = document.getElementById(`btns-${safeId}`);
    if (container) {
        const product = window.allProducts.find(p => p.name === name);
        container.innerHTML = count > 0 ? renderCounter(name, product.price, count) : `<button class="main-add-btn" onclick="addToCart('${name}', ${product.price})">В корзину</button>`;
    }
    document.getElementById('cart-info').innerText = `В заказе: ${cart.length} товаров`;
    if (cart.length > 0) tg.MainButton.show(); else tg.MainButton.hide();
}

function renderHistory() {
    const historyDiv = document.getElementById('order-history');
    const history = JSON.parse(localStorage.getItem('order_history') || "[]");
    if (history.length === 0) return;

    historyDiv.innerHTML = history.map(order => `
        <div class="history-item">
            <div style="font-size: 10px; opacity: 0.5;">${order.date}</div>
            <div style="font-weight: 700; margin: 4px 0;">Заказ: ${order.total.toLocaleString()} сум</div>
            <div style="font-size: 12px;">${order.items.map(i => i.name).join(', ')}</div>
        </div>
    `).join('');
}

window.openInstagram = function() {
    tg.openLink("https://www.instagram.com/homelife_climate/");
};

tg.onEvent('mainButtonClicked', async () => {
    tg.MainButton.showProgress();
    const orderData = {
        date: new Date().toLocaleString(),
        items: [...cart],
        total: cart.reduce((s, i) => s + i.price, 0)
    };
    try {
        await fetch(`${BACKEND_URL}/order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer: tg.initDataUnsafe.user ? tg.initDataUnsafe.user.first_name : "Клиент",
                ...orderData
            })
        });
        let history = JSON.parse(localStorage.getItem('order_history') || "[]");
        history.unshift(orderData);
        localStorage.setItem('order_history', JSON.stringify(history));
        tg.showAlert("✅ Заказ отправлен!");
        cart = [];
        tg.close();
    } catch (e) {
        tg.showAlert("❌ Ошибка");
        tg.MainButton.hideProgress();
    }
});
