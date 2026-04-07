const tg = window.Telegram.WebApp;
let cart = [];
const BACKEND_URL = "https://r-firstbot.onrender.com"; 

tg.expand();
tg.MainButton.setText("ОФОРМИТЬ ЗАКАЗ");
tg.MainButton.setParams({ color: '#2ecc71' }); // Зеленая кнопка заказа

fetch('products.json')
  .then(res => res.json())
  .then(products => {
    const searchInput = document.getElementById('search');
    const resultsDiv = document.getElementById('results');

    function displayProducts(items) {
      resultsDiv.innerHTML = '';
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

    displayProducts(products);

    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = products.filter(p => p.name.toLowerCase().includes(term));
      displayProducts(filtered);
    });
  });

window.addToCart = function(name, price) {
  cart.push({ name, price });
  document.getElementById('cart-info').innerText = `В заказе: ${cart.length} товаров`;
  tg.MainButton.show();
};

tg.onEvent('mainButtonClicked', async () => {
  // Вытаскиваем данные пользователя из Telegram
  const user = tg.initDataUnsafe.user;
  
  // Если данных нет (например, зашли через браузер), ставим заглушки
  const customerName = user ? user.first_name : "Покупатель";
  const customerUsername = user ? (user.username || "нет_ника") : "unknown";

  tg.MainButton.showProgress();

  try {
    const response = await fetch(`${BACKEND_URL}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: customerName,      // Отправляем реальное имя
        username: customerUsername,  // Отправляем реальный ник
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
    tg.showAlert("❌ Ошибка при отправке.");
  } finally {
    tg.MainButton.hideProgress();
  }
});
  
  tg.MainButton.showProgress();

  try {
    const response = await fetch(`${BACKEND_URL}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: user.first_name,
        username: user.username,
        items: cart,
        total: cart.reduce((sum, item) => sum + item.price, 0)
      })
    });

    if (response.ok) {
      tg.showAlert("✅ Заказ успешно отправлен сотрудникам!");
      tg.close();
    } else {
      throw new Error();
    }
  } catch (e) {
    tg.showAlert("❌ Ошибка при отправке. Проверьте сервер.");
  } finally {
    tg.MainButton.hideProgress();
  }
});
