const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const VERIFY_TOKEN = "quadrata123";

// Validação da Meta
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(403);
  }
});

// Receber mensagens e mandar para o Make
app.post("/webhook", async (req, res) => {
  console.log("Mensagem recebida:", JSON.stringify(req.body, null, 2));
  await axios.post("https://hook.make.com/SEU_WEBHOOK_ID", req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
