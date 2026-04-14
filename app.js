const tg = window.Telegram.WebApp;
let cart = [];
const BACKEND_URL = "https://r-firstbot.onrender.com"; 

tg.expand();
tg.MainButton.setText("ПОДТВЕРДИТЬ ЗАКАЗ");

// 1. Навигация между страницами
window.showPage = function(pageId, element) {
    document.getElementById('shop-page').style.display = 'none';
    document.getElementById('info-page').style.display = 'none';
    document.getElementById(pageId + '-page').style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (element) element.classList.add('active');
};

// 2. Открытие Instagram
window.openInstagram = function() {
    tg.openLink("https://www.instagram.com/homelife_climate/");
};

// 3. Загрузка товаров из JSON
fetch('products.json')
    .then(res => res.json())
    .then(products => {
        window.allProducts = products;
        renderItems(products);

        // Поиск по товарам
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.oninput = (e) => {
                const val = e.target.value.toLowerCase();
                renderItems(window.allProducts.filter(p => p.name.toLowerCase().includes(val)));
            };
        }
    });

// 4. Отрисовка карточек товаров
function renderItems(items) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    
    items.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Генерируем ID без пробелов и спецсимволов для элементов
        const safeId = p.name.replace(/[^a-z0-9]/gi, '');
        const count = cart.filter(item => item.name === p.name).length;
        
        // Ссылка на картинку (заглушка, если пусто)
        const imgSrc = p.image && p.image !== "" ? p.image : "https://cdn-icons-png.flaticon.com/512/679/679821.png";

        card.innerHTML = `
            <div class="badge" id="badge-${safeId}" style="display: ${count > 0 ? 'flex' : 'none'}">${count}</div>
            <img src="${imgSrc}" class="product-img">
            <div class="card-content">
                <h3>${p.name}</h3>
                <p class="price">${p.price.toLocaleString()} сум</p>
                
                <div class="buttons-container" id="btns-${safeId}">
                    ${count > 0 ? `
                        <div class="counter-btns">
                            <button class="minus-btn" onclick="removeFromCart('${p.name}', ${p.price})">−</button>
                            <span class="count-num">${count}</span>
                            <button class="plus-btn" onclick="addToCart('${p.name}', ${p.price})">+</button>
                        </div>
                    ` : `
                        <button class="main-add-btn" onclick="addToCart('${p.name}', ${p.price})">В корзину</button>
                    `}
                </div>
            </div>
        `;
        resultsDiv.appendChild(card);
    });
}

// 5. Добавление товара
window.addToCart = function(name, price
