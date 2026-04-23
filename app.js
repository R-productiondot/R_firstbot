const tg = window.Telegram.WebApp;
let cart = [];
const BACKEND_URL = "https://r-firstbot.onrender.com"; 

tg.expand();
tg.MainButton.setText("ПОДТВЕРДИТЬ ЗАКАЗ");

// 1. Навигация
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

// 2. Загрузка товаров
fetch('products.json')
    .then(res => res.json())
    .then(products => {
        window.allProducts = products;
        renderItems(products);

        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.oninput = (e) => {
                const val = e.target.value.toLowerCase();
                renderItems(window.allProducts.filter(p => p.name.toLowerCase().includes(val)));
            };
        }
    });

// 3. Отрисовка товаров в магазине
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
            <img src="${p.image || ''}" class="product-img">
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
    return `
        <div class="counter-btns">
            <button class="minus-btn" onclick="removeFromCart('${name}', ${price})">−</button>
            <span class="count-num">${count}</span>
            <button class="plus-btn" onclick="addToCart('${name}', ${price})">+</button>
        </div>
    `;
}

// 4. Логика корзины
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
    
    if (cart.length > 0) tg.MainButton.show(); else tg.MainButton.hide();
}

// 5. ИСТОРИЯ ЗАКАЗОВ (Исправленная логика с кружочками)
function renderHistory() {
    const historyDiv = document.getElementById('order-history');
    if (!historyDiv) return;
    const history = JSON.parse(localStorage.getItem('order_history') || "[]");

    if (history.length === 0) {
        historyDiv.innerHTML = '<p style="text-align: center; opacity: 0.5; color: white; margin-top: 50px;">Заказов пока нет</p>';
        return;
    }

    historyDiv.innerHTML = history.map(order => {
        // Группируем товары
        const counts = {};
        order.items.forEach(item => {
            counts[item.name] = (counts[item.name] || 0) + 1;
        });

        const itemsHtml = Object.keys(counts).map(name => {
            // Ищем данные о товаре (цену и картинку) из общего списка
            const productInfo = window.allProducts.find(p => p.name === name) || {};
            const itemTotal = (productInfo.price || 0) * counts[name];

            return `
            <div class="uzum-item">
                <img src="${productInfo.image || ''}" class="uzum-img">
                <div class="uzum-info">
                    <div class="uzum-name">${name}</div>
                    <div class="uzum-controls">
                        <div class="uzum-qty-badge">${counts[name]} шт.</div>
                        <div class="uzum-price">${itemTotal.toLocaleString()} сум</div>
                    </div>
                </div>
            </div>`;
        }).join('');
        
        return `
        <div class="uzum-card">
            <div class="uzum-card-header">
                <span class="uzum-date">${order.date}</span>
                <span class="uzum-status">Доставлено</span>
            </div>
            <div class="uzum-items-list">${itemsHtml}</div>
            <div class="uzum-card-footer">
                Итого: <b>${order.total.toLocaleString()} сум</b>
            </div>
        </div>
        `;
    }).join('');
}

// 6. Контакты
window.openInstagram = function() {
    tg.openLink("https://www.instagram.com/homelife_climate/");
};

// 7. Отправка заказа
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

        tg.showAlert("✅ Заказ отправлен!", () => {
            cart = []; 
            updateCardUI(""); 
            renderHistory();
            showPage('profile', document.querySelectorAll('.nav-item')[2]);
        });

    } catch (e) {
        tg.showAlert("❌ Ошибка отправки");
    } finally {
        tg.MainButton.hideProgress();
    }
});
