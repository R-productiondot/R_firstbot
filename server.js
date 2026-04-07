const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// ВСТАВЬ СВОИ ДАННЫЕ ТУТ
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
    console.error("Ошибка Telegram API:", error.response ? error.response.data : error.message);
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

