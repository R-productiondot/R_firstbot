const tg = window.Telegram.WebApp;
let cart = [];
const BACKEND_URL = "https://r-firstbot.onrender.com"; 

tg.expand();
tg.MainButton.setText("ПОДТВЕРДИТЬ ЗАКАЗ");
tg.MainButton.setParams({ color: '#2ecc71' });

// Переключение страниц
window.showPage = function(pageId) {
    document.getElementById('shop-page').style.display = 'none';
    document.getElementById('info-page').style.display = 'none';
    document.getElementById(pageId + '-page').style.display = 'block';
    
    const items = document.querySelectorAll('.nav-item');
    items.forEach(i => i.classList.remove('active'));
    event.currentTarget.classList.add('active');
};

window.openInstagram = function() {
    tg.openInstagram("https://www.instagram.com/homelife_climate");
};

// Загрузка товаров
fetch('products.json')
    .then(res => res.json())
    .then(products => {
        const resultsDiv = document.getElementById('results');
        const searchInput = document.getElementById('search');

        function render(items) {
            resultsDiv.innerHTML = '';
            items.forEach(p => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${p.name}</h3>
                    <p>${p.price.toLocaleString()} сум</p>
                    <button onclick="addToCart('${p.name}', ${p.price})">В корзину</button>
                `;
                resultsDiv.appendChild(card);
            });
        }
        render(products);
        searchInput.oninput = (e) => {
            const val = e.target.value.toLowerCase();
            render(products.filter(p => p.name.toLowerCase().includes(val)));
        };
    });

window.addToCart = function(name, price) {
    cart.push({ name, price });
    document.getElementById('cart-info').innerText = `В заказе: ${cart.length} товаров`;
    tg.MainButton.show();
};

tg.onEvent('mainButtonClicked', async () => {
    const user = tg.initDataUnsafe.user;
    tg.MainButton.showProgress();
    try {
        await fetch(`${BACKEND_URL}/order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer: user ? user.first_name : "Клиент",
                username: user ? user.username : "unknown",
                items: cart,
                total: cart.reduce((s, i) => s + i.price, 0)
            })
        });
        tg.showAlert("✅ Заказ отправлен!");
        tg.close();
    } catch (e) {
        tg.showAlert("❌ Ошибка");
    } finally {
        tg.MainButton.hideProgress();
    }
});

window.openInstagram = function() {
    const url = "https://www.instagram.com/homelife_climate"; // Проверь ник!
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openLink(url);
    } else {
        window.open(url, '_blank');
    }
};
