const tg = window.Telegram.WebApp;
let cart = [];
const BACKEND_URL = "https://r-firstbot.onrender.com"; 

tg.expand();
tg.MainButton.setText("ПОДТВЕРДИТЬ ЗАКАЗ");

// Навигация
window.showPage = function(pageId, element) {
    document.getElementById('shop-page').style.display = 'none';
    document.getElementById('info-page').style.display = 'none';
    document.getElementById(pageId + '-page').style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (element) element.classList.add('active');
};

window.openInstagram = function() {
    tg.openLink("https://www.instagram.com/homelife_climate/");
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
    resultsDiv.innerHTML = '';
    items.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        const badgeId = `badge-${p.name.replace(/[^a-z0-9]/gi, '')}`;
        const count = cart.filter(item => item.name === p.name).length;
        
        // Если картинки нет, подставим иконку-заглушку
        const imgSrc = p.image && p.image !== "" ? p.image : "https://cdn-icons-png.flaticon.com/512/679/679821.png";

        card.innerHTML = `
            <div class="badge" id="${badgeId}" style="display: ${count > 0 ? 'flex' : 'none'}">${count}</div>
            <img src="${imgSrc}" class="product-img">
            <div class="card-content">
                <h3>${p.name}</h3>
                <p class="category">${p.category}</p>
                <p class="price">${p.price.toLocaleString()} сум</p>
                <button onclick="addToCart('${p.name}', ${p.price})">В корзину</button>
            </div>
        `;
        resultsDiv.appendChild(card);
    });
}

window.addToCart = function(name, price) {
    cart.push({ name, price });
    
    const badgeId = `badge-${name.replace(/[^a-z0-9]/gi, '')}`;
    const badge = document.getElementById(badgeId);
    const count = cart.filter(item => item.name === name).length;
    
    if (badge) {
        badge.innerText = count;
        badge.style.display = 'flex';
    }

    document.getElementById('cart-info').innerText = `В заказе: ${cart.length} товаров`;
    tg.MainButton.show();
};

tg.onEvent('mainButtonClicked', async () => {
    tg.MainButton.showProgress();
    const user = tg.initDataUnsafe.user;
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
        tg.showAlert("❌ Ошибка соединения");
        tg.MainButton.hideProgress();
    }
});
