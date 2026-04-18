import express from "express";
import { fileURLToPath } from "url";
import path from "path";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "../src/page")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../src/page", "index.html"));
});

app.get("/grafico", (req, res) => {
  res.sendFile(path.join(__dirname, "../src/page", "grafico.html"));
});

app.get("/decolecta", (req, res) => {
  res.sendFile(path.join(__dirname, "../src/page", "decolecta.html"));
});

app.listen(PORT, () => {
  console.log(`Server corriendo en: http://localhost:${PORT}`);
});