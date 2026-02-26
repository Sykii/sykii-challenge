# 🎮 SoloQ Challenge — El Infiltrado

Web de seguimiento en tiempo real para el SoloQ Challenge, con ranking comparativo y bridge para overlays de streaming.

---

## 🚀 Setup rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.local.example .env.local
```
Edita `.env.local`:
```env
RIOT_API_KEY=RGAPI-tu-key-aqui        # De developer.riotgames.com
INFILTRADO_SUMMONER_NAME=TuNombre     # Tu nombre exacto en LoL
RIOT_REGION=euw1                      # Tu región
ADMIN_PASSWORD=unaPasswordSegura      # Para el panel /admin
```

### 3. Editar participantes
Abre `lib/participants.ts` y actualiza:
- `OFFICIAL_PARTICIPANTS`: lista de streamers oficiales con sus cuentas exactas
- `INFILTRADO`: tus datos

### 4. Lanzar
```bash
npm run dev       # Desarrollo (http://localhost:3000)
npm run build && npm start   # Producción
```

---

## 🔌 Conectar tu Overlay (IMPORTANTE)

### Opción A — Browser Source en OBS (recomendado)

El endpoint `/api/my-stats` devuelve JSON con todos tus datos:

```
http://localhost:3000/api/my-stats
```

**Respuesta de ejemplo:**
```json
{
  "position": 14,
  "display": "TOP 14",
  "diff_next": 47,
  "next_player": "ElYoya",
  "infiltrado_status": "👾 SISTEMA INFILTRADO",
  "infiltrado": {
    "summoner_name": "TuCuenta",
    "tier": "GRANDMASTER",
    "rank": "",
    "lp": 312,
    "wins": 87,
    "losses": 65,
    "winrate": 57,
    "games": 152
  },
  "updated_at": "2024-01-15T20:30:00.000Z"
}
```

#### En OBS/Streamlabs con Browser Source + HTML:
1. Crea un archivo `overlay.html` en tu PC:

```html
<!DOCTYPE html>
<html>
<head>
<style>
  body { background: transparent; font-family: monospace; }
  #widget {
    color: #00ff41;
    font-size: 28px;
    font-weight: bold;
    text-shadow: 0 0 10px #00ff41;
    padding: 10px;
  }
  #diff { font-size: 16px; color: #aaa; margin-top: 4px; }
</style>
</head>
<body>
<div id="widget">
  <div id="position">TOP ?</div>
  <div id="diff">— LP para subir</div>
</div>
<script>
async function update() {
  try {
    const res = await fetch('http://localhost:3000/api/my-stats');
    const data = await res.json();
    document.getElementById('position').textContent = data.display;
    document.getElementById('diff').textContent = 
      data.diff_next > 0 
        ? `${data.diff_next} LP → ${data.next_player}` 
        : '🏆 LÍDER';
  } catch(e) { console.error(e); }
}
update();
setInterval(update, 30000); // refresh cada 30s
</script>
</body>
</html>
```

2. En OBS: **Fuentes → + → Navegador**
3. En "URL" pon la ruta local: `file:///C:/ruta/a/overlay.html`
4. Marca **"Actualizar navegador cuando la escena se active"**

#### Opción B — URL directa como Browser Source
Si despliegas la web en un servidor (Vercel, VPS):
- URL del overlay: `https://tu-dominio.com/api/my-stats`
- En tu software de overlay, usa un plugin de JSON/HTTP para leer el campo `display` o `position`

### Opción C — Herramientas externas
- **StreamElements / Nightbot**: Configura un comando que lea la URL con `$(urlfetch https://tu-web.com/api/my-stats)` y muestre `position`
- **SAMMI / Streamer.bot**: Usa HTTP request a la URL y extrae `display`

---

## 🔑 Renovar Riot API Key (cada 24h)

1. Ve a [developer.riotgames.com](https://developer.riotgames.com)
2. Regenera tu Development Key
3. Abre `http://localhost:3000/admin`
4. Introduce tu contraseña y pega la nueva key

---

## 📁 Estructura del proyecto

```
soloq-challenge/
├── app/
│   ├── page.tsx              # Página principal con la tabla
│   ├── layout.tsx            # Layout con fuentes
│   ├── globals.css           # Estilos hacker neon
│   ├── admin/page.tsx        # Panel de admin
│   └── api/
│       ├── rankings/route.ts # API tabla completa
│       ├── my-stats/route.ts # 🔌 BRIDGE PARA OVERLAY
│       └── admin/route.ts    # Gestión de API key
├── components/
│   ├── RankingTable.tsx      # Tabla principal
│   └── TwitchSidebar.tsx     # Sidebar con embed
└── lib/
    ├── participants.ts       # ← EDITA ESTA LISTA
    └── riot.ts               # Lógica Riot API
```

---

## ⚠️ Notas importantes

- La **Development Key de Riot** expira cada 24h. Para producción considera solicitar una **Production Key** (requiere aprobación de Riot).
- Los datos se cachean 5 minutos para no sobrepasar los rate limits.
- Configura `INFILTRADO.twitch` en `lib/participants.ts` para el embed del sidebar.
