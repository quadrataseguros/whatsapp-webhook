/**
 * Envio em massa do convite "Arraiá da Copa" via WhatsApp Cloud API.
 *
 * Uso:
 *   node send-invite.js                        # lê convidados.txt
 *   node send-invite.js 5511999990001 5511999990002
 *
 * Variáveis de ambiente (além das já usadas em index.js):
 *   INVITE_LOCAL      - nome/endereço do local do evento (obrigatório)
 *   INVITE_IMAGE_URL  - URL pública da imagem do convite (opcional)
 *   INVITE_DELAY_MS   - pausa entre envios em ms (padrão: 1000)
 */

require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || "";
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || "";
const LOCAL = process.env.INVITE_LOCAL || "[A CONFIRMAR]";
const IMAGE_URL = process.env.INVITE_IMAGE_URL || "";
const DELAY_MS = parseInt(process.env.INVITE_DELAY_MS || "1000", 10);

const INVITE_TEXT =
  `🎉 *CONVITE ESPECIAL*\n` +
  `🎪 *ARRAIÁ DA COPA*\n\n` +
  `📅 *14 de Junho | 20h*\n` +
  `📍 ${LOCAL}\n\n` +
  `Com o apoio de *Quadrata Seguros* 🤝\n\n` +
  `Contamos com sua presença! 🤠`;

function numbersFromArgs() {
  const args = process.argv.slice(2).filter((a) => /^\d+$/.test(a));
  return args;
}

function numbersFromFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .map((l) => l.trim().replace(/\D/g, ""))
    .filter((l) => l.length >= 10);
}

async function sendMessage(to, payload) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`,
    { messaging_product: "whatsapp", to, ...payload },
    {
      headers: {
        Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function sendInvite(to) {
  if (IMAGE_URL) {
    await sendMessage(to, {
      type: "image",
      image: { link: IMAGE_URL, caption: INVITE_TEXT },
    });
  } else {
    await sendMessage(to, {
      type: "text",
      text: { body: INVITE_TEXT },
    });
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) {
    console.error("Erro: WA_PHONE_NUMBER_ID e WA_ACCESS_TOKEN são obrigatórios.");
    process.exit(1);
  }

  const numbers =
    numbersFromArgs().length > 0
      ? numbersFromArgs()
      : numbersFromFile(path.join(__dirname, "convidados.txt"));

  if (numbers.length === 0) {
    console.error(
      "Nenhum número encontrado. Crie convidados.txt ou passe os números como argumentos."
    );
    process.exit(1);
  }

  console.log(`Enviando convite para ${numbers.length} número(s)...`);
  console.log(`Local do evento: ${LOCAL}`);
  if (IMAGE_URL) console.log(`Imagem: ${IMAGE_URL}`);
  console.log("---");

  let ok = 0;
  let fail = 0;

  for (const num of numbers) {
    try {
      await sendInvite(num);
      console.log(`✓ ${num}`);
      ok++;
    } catch (err) {
      const detail = err.response?.data?.error?.message || err.message;
      console.error(`✗ ${num}: ${detail}`);
      fail++;
    }
    if (numbers.indexOf(num) < numbers.length - 1) await sleep(DELAY_MS);
  }

  console.log("---");
  console.log(`Concluído: ${ok} enviados, ${fail} falhas.`);
}

main();
