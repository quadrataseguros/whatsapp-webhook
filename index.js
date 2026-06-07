const IG_USER_ID = process.env.IG_USER_ID || "";

async function sendInstagramReply(to, text) {
  if (!INSTAGRAM_ACCESS_TOKEN || !IG_USER_ID) return;
  await axios.post(
    `https://graph.facebook.com/v19.0/${IG_USER_ID}/messages`,
    {
      recipient: { id: to },
      message: { text },
      messaging_type: "RESPONSE",
    },
    {
      params: { access_token: INSTAGRAM_ACCESS_TOKEN },
      headers: { "Content-Type": "application/json" },
    }
  );
}
