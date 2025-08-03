
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/catalog", async (req, res) => {
  try {
    const { query } = req.body;
    const assistant_id = "asst_TfurmecYMDtppRzVXftWoMaU";

    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `${query}\n\nReturn MARC21 in .mrc format.`
    });

    const run = await openai.beta.threads.runs.create(thread.id, { assistant_id });

    let status = "";
    let tries = 0;
    while (tries++ < 15) {
      const check = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      status = check.status;
      if (status === "completed") break;
      if (status === "failed") return res.status(500).send("Run failed.");
      await new Promise(r => setTimeout(r, 2000));
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const content = messages.data[0]?.content?.[0]?.text?.value || "No MARC data returned";
    res.send(content);

  } catch (e) {
    console.error(e);
    res.status(500).send("Cataloging failed.");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
