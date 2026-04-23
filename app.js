const tg = window.Telegram.WebApp;
let cart = [];
const BACKEND_URL = "https://r-firstbot.onrender.com"; 

tg.expand();
tg.MainButton.setText("ПОДТВЕРДИТЬ ЗАКАЗ");

// 1. Навигация
window.showPage = function(pageId, element) {
    const shopPage = document.getElementById('shop-page');
    const infoPage = document.getElementById('info-page');
    if (shopPage) shopPage.style.display = 'none';
    if (infoPage) infoPage.style.display = 'none';
    
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) targetPage.style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (element) element.classList.add('active');
};

// 2. Инстаграм
window.openInstagram = function() {
    const url = "https://www.instagram.com/homelife_climate/";
    if (tg.openLink) {
        tg.openLink(url);
    } else {
        window.open(url, '_blank');
    }
};

// 3. Загрузка товаров
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
    })
    .catch(err => console.error("Ошибка загрузки товаров:", err));

// 4. Отрисовка товаров
function renderItems(items) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '';
    
    items.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        const safeId = p.name.replace(/[^a-z0-9]/gi, '');
        const count = cart.filter(item => item.name === p.name).length;
        const imgSrc = p.image || "https://cdn-icons-png.flaticon.com/512/679/679821.png";

        card.innerHTML = `
            <div class="badge" id="badge-${safeId}" style="display: ${count > 0 ? 'flex' : 'none'}">${count}</div>
            <img src="${imgSrc}" class="product-img">
            <div class="card-content">
                <h3>${p.name}</h3>
                <p class="price">${p.price.toLocaleString()} сум</p>
                <div class="buttons-container" id="btns-${safeId}">
                    ${count > 0 ? renderCounter(p.name, p.price, count) : `<button class="main-add-btn" onclick="addToCart('${p.name}', ${p.price})">В корзину</button>`}
                </div>
            </div>
        `;
        resultsDiv.appendChild(card);
    });
}

// Вспомогательная функция для кнопок счетчика
function renderCounter(name, price, count) {
    return `
        <div class="counter-btns">
            <button class="minus-btn" onclick="removeFromCart('${name}', ${price})">−</button>
            <span class="count-num">${count}</span>
            <button class="plus-btn" onclick="addToCart('${name}', ${price})">+</button>
        </div>
    `;
}

// 5. Добавление и удаление
window.addToCart = function(name, price) {
    cart.push({ name, price });
    updateCardUI(name);
};

window.removeFromCart = function(name, price) {
    const index = cart.findLastIndex(item => item.name === name);
    if (index > -1) cart.splice(index, 1);
    updateCardUI(name);
};

// 6. Обновление интерфейса
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

    const cartInfo = document.getElementById('cart-info');
    if (cartInfo) cartInfo.innerText = `В заказе: ${cart.length} товаров`;
    
    if (cart.length > 0) tg.MainButton.show(); else tg.MainButton.hide();
}

// Сохранение и отправка заказа
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

        // СОХРАНЯЕМ В ПАМЯТЬ ТЕЛЕФОНА
        let history = JSON.parse(localStorage.getItem('order_history') || "[]");
        history.unshift(orderData); // Добавляем новый заказ в начало списка
        localStorage.setItem('order_history', JSON.stringify(history));

        tg.showAlert("✅ Заказ отправлен!");
        cart = []; // Очищаем корзину
        updateCardUI(""); // Сбрасываем кнопки на товарах
        tg.close();
    } catch (e) {
        tg.showAlert("❌ Ошибка отправки");
        tg.MainButton.hideProgress();
    }
});

// Функция для отрисовки истории заказов
function renderHistory() {
    const historyDiv = document.getElementById('order-history');
    const history = JSON.parse(localStorage.getItem('order_history') || "[]");

    if (history.length === 0) {
        historyDiv.innerHTML = '<p style="opacity: 0.6; text-align: center;">У вас пока нет заказов</p>';
        return;
    }

    historyDiv.innerHTML = history.map(order => `
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 15px; margin-bottom: 10px; border-left: 4px solid #2ecc71;">
            <div style="font-size: 12px; opacity: 0.6;">${order.date}</div>
            <div style="font-weight: bold; margin: 5px 0;">Заказ на ${order.total.toLocaleString()} сум</div>
            <div style="font-size: 13px;">${order.items.map(i => i.name).join(', ')}</div>
        </div>
    `).join('');
}

// Обновим функцию showPage, чтобы при переходе в профиль обновлялась история
const oldShowPage = window.showPage;
window.showPage = function(pageId, element) {
    if (pageId === 'profile') renderHistory();
    
    // Скрываем все страницы
    document.getElementById('shop-page').style.display = 'none';
    document.getElementById('info-page').style.display = 'none';
    document.getElementById('profile-page').style.display = 'none';
    
    document.getElementById(pageId + '-page').style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (element) element.classList.add('active');
};
