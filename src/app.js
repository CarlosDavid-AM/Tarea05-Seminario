import express from "express";
import { fileURLToPath } from "url";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

// Carga variables desde .env hacia process.env (p. ej. DECOLECTA_API_TOKEN) antes de usarlas en el proxy
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: "*",
    methods: "GET, POST, HEAD, PUT, PATCH, DELETE",
    credentials: true,
  })
);

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

/*
 * PROXY hacia Decolecta (solución al error CORS en el navegador)
 *
 * 1) Problema: Si el HTML llama con fetch() directamente a https://api.decolecta.com/...,
 *    el navegador aplica CORS: el origen (p. ej. http://localhost:3000) debe estar
 *    permitido por el API con la cabecera Access-Control-Allow-Origin. Ese API no
 *    envía esa cabecera para localhost, así que el navegador bloquea la respuesta.
 *
 * 2) Solución: La página solo habla con tu mismo servidor (mismo origen), sin CORS.
 *    Express recibe GET /api/sunat/ruc?numero=... y él sí puede llamar a api.decolecta.com
 *    desde Node (las peticiones servidor-a-servidor no son bloqueadas por CORS del navegador).
 *
 * 3) Token: El Bearer no va en el HTML (evita exponer el token en el cliente). Se lee
 *    de process.env (p. ej. cargado desde .env con dotenv al inicio de este archivo).
 */
app.get("/api/sunat/ruc", async (req, res) => {
  // Paso A: Leer el RUC que el front envía como ?numero=...
  const numero = req.query.numero;
  if (!numero || typeof numero !== "string") {
    return res.status(400).json({ error: "Falta el query ?numero=" });
  }

  // Paso B: Obtener el token secreto solo en el servidor (no en el navegador)
  const token = process.env.DECOLECTA_API_TOKEN;
  if (!token) {
    return res.status(500).json({
      error:
        "Configura la variable de entorno DECOLECTA_API_TOKEN con tu token de Decolecta.",
    });
  }

  // Paso C: Construir la URL exacta que espera Decolecta (codificar el RUC por seguridad en la query)
  const upstreamUrl = `https://api.decolecta.com/v1/sunat/ruc?numero=${numero}`;

  try {
    // Paso D: Petición desde Node a Decolecta; aquí sí se envía Authorization: Bearer
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    // Paso E: Reenviar cuerpo y tipo al navegador; el cliente ve respuesta de tu mismo origen
    const body = await upstream.text();
    const contentType =
      upstream.headers.get("content-type") || "application/json";
    res.status(upstream.status).type(contentType).send(body);
  } catch (err) {
    // Paso F: Fallo de red (DNS, timeout, etc.): informar sin filtrar el token
    res.status(500).json({
      error: "No se pudo contactar a Decolecta",
      detail: err?.message ?? String(err),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server corriendo en: http://localhost:${PORT}`);
});