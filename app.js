const tg = window.Telegram.WebApp;
let cart = [];
const BACKEND_URL = "https://r-firstbot.onrender.com"; 

window.showPage = function(pageId) {
    // Скрываем все страницы
    document.getElementById('shop-page').style.display = 'none';
    document.getElementById('info-page').style.display = 'none';
    
    // Показываем нужную
    document.getElementById(pageId + '-page').style.display = 'block';
    
    // Меняем активную иконку в меню
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    if (pageId === 'shop') navItems[0].classList.add('active');
    else navItems[1].classList.add('active');
};

tg.expand();
tg.MainButton.setText("ОФОРМИТЬ ЗАКАЗ");
tg.MainButton.setParams({ color: '#2ecc71' });

// Функция для отрисовки товаров
function displayProducts(items) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = '';
    if (items.length === 0) {
        resultsDiv.innerHTML = '<p style="color:white; text-align:center;">Товары не найдены</p>';
        return;
    }

    items.forEach(product => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${product.name}</h3>
            <p>${product.price.toLocaleString()} сум</p>
            <button onclick="addToCart('${product.name}', ${product.price})">В корзину</button>
        `;
        resultsDiv.appendChild(card);
    });
}

// Загрузка товаров
fetch('products.json')
    .then(res => {
        if (!res.ok) throw new Error('Ошибка загрузки products.json');
        return res.json();
    })
    .then(products => {
        displayProducts(products);

        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = products.filter(p => p.name.toLowerCase().includes(term));
                displayProducts(filtered);
            });
        }
    })
    .catch(err => {
        console.error(err);
        document.getElementById('results').innerHTML = '<p style="color:white;">Ошибка: проверьте файл products.json</p>';
    });

window.addToCart = function(name, price) {
    cart.push({ name, price });
    const cartInfo = document.getElementById('cart-info');
    if (cartInfo) {
        cartInfo.innerText = `В заказе: ${cart.length} товаров`;
    }
    tg.MainButton.show();
};

// Отправка заказа
tg.onEvent('mainButtonClicked', async () => {
    const user = tg.initDataUnsafe.user;
    const customerName = user ? user.first_name : "Покупатель";
    const customerUsername = user ? (user.username || "нет_ника") : "unknown";

    tg.MainButton.showProgress();

    try {
        const response = await fetch(`${BACKEND_URL}/order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer: customerName,
                username: customerUsername,
                items: cart,
                total: cart.reduce((sum, item) => sum + item.price, 0)
            })
        });

        if (response.ok) {
            tg.showAlert("✅ Заказ успешно отправлен!");
            tg.close();
        } else {
            throw new Error();
        }
    } catch (e) {
        tg.showAlert("❌ Ошибка сервера.");
    } finally {
        tg.MainButton.hideProgress();
    }
});
