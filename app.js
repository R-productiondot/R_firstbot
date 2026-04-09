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
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Ищем на что нажали, чтобы подсветить
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
};

// Функция открытия Instagram
window.openInstagram = function() {
    const url = "https://www.instagram.com/homelife_climate/";
    if (tg.openLink) {
        tg.openLink(url);
    } else {
        window.open(url, '_blank');
    }
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
        
        if (resultsDiv) render(products);

        if (searchInput) {
            searchInput.oninput = (e) => {
                const val = e.target.value.toLowerCase();
                render(products.filter(p => p.name.toLowerCase().includes(val)));
            };
        }
    })
    .catch(err => console.error("Ошибка загрузки товаров:", err));

window.addToCart = function(name, price) {
    cart.push({ name, price });
    const info = document.getElementById('cart-info');
    if (info) info.innerText = `В заказе: ${cart.length} товаров`;
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
        tg.showAlert("❌ Ошибка при отправке");
    } finally {
        tg.MainButton.hideProgress();
    }
});
