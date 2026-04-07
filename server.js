const tg = window.Telegram.WebApp;
let cart = [];
const BACKEND_URL = "ЗАМЕНИ_МЕНЯ_НА_ССЫЛКУ_ОТ_RENDER"; 

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
  const user = tg.initDataUnsafe.user || { first_name: "Покупатель", username: "unknown" };
  
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

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const TOKEN = "8354739145:AAFld83mllCINDwFj772gEOc7_QHdDmZAsg"; 
const EMPLOYEE_ID = "5750848806"; 

app.post('/order', async (req, res) => {
  const { customer, username, items, total } = req.body;

  let itemsList = items.map(i => `• ${i.name} (${i.price.toLocaleString()} сум)`).join('\n');
  
  const text = `📦 **НОВЫЙ ЗАКАЗ**\n\n` +
               `👤 Клиент: ${customer} (@${username})\n\n` +
               `🛒 Товары:\n${itemsList}\n\n` +
               `💰 **ИТОГО: ${total.toLocaleString()} сум**`;

  try {
    await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      chat_id: EMPLOYEE_ID,
      text: text,
      parse_mode: 'Markdown'
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
