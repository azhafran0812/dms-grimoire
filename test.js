const url = "http://127.0.0.1:20128/v1/chat/completions";
const apiKey = "sk-6cb7349c0bfd6b8f-x403dp-2bad9dc6";

async function testAI() {
  console.log("⏳ Mengirim pesan ke 9router...");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "ai-combo",
        messages: [{ role: "user", content: "Halo! Tolong balas dengan satu kalimat singkat." }],
        stream: false // Tegaskan agar 9router tidak mengirim stream
      })
    });

    const rawText = await response.text();
    console.log("\n📩 Teks Mentah dari 9router:\n", rawText);

  } catch (error) {
    console.error("\n❌ Error koneksi:", error.message);
  }
}

testAI();