let mapa = null;
let minutosEstimados = 0;

function toggleModo() {
    document.documentElement.classList.toggle('dark');
    const btn = document.getElementById('btnModo');
    btn.innerText = document.documentElement.classList.contains('dark') ? "☀️" : "🌙";
    // Si el mapa existe, habría que recargar las teselas (opcional)
}

async function obtenerRutaOSRM(ori, dest) {
    try {
        const geo = async (l) => {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(l)}`);
            const d = await r.json();
            return d[0];
        };
        const oData = await geo(ori);
        const dData = await geo(dest);

        if (oData && dData) {
            const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${oData.lon},${oData.lat};${dData.lon},${dData.lat}?overview=full&geometries=geojson`);
            const data = await r.json();
            return {
                minutos: Math.round(data.routes[0].duration / 60),
                coords: data.routes[0].geometry.coordinates,
                oLat: oData.lat, oLon: oData.lon,
                dLat: dData.lat, dLon: dData.lon
            };
        }
    } catch (e) { console.error(e); }
    return null;
}

async function iniciarRuta() {
    const ori = document.getElementById('origen').value.trim();
    const dest = document.getElementById('destino').value.trim();
    const btn = document.getElementById('btnTrazar');

    if (!ori || !dest) return alert("Introduce origen y destino");

    btn.innerText = "BUSCANDO RUTA...";
    btn.disabled = true;

    const datos = await obtenerRutaOSRM(ori, dest);

    if (!datos) {
        alert("No se pudo obtener la ruta real.");
        btn.innerText = "TRAZAR RUTA";
        btn.disabled = false;
        return;
    }

    minutosEstimados = datos.minutos;
    document.getElementById('indicadorRuta').innerText = ori + " ➔ " + dest;
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.remove('hidden');

    // Actualizar Hora de Llegada
    let llegada = new Date();
    llegada.setMinutes(llegada.getMinutes() + minutosEstimados);
    const h = llegada.getHours();
    const m = llegada.getMinutes();
    document.getElementById('valLlegada').innerText = (h<10?'0':'')+h + ":" + (m<10?'0':'')+m;

    // Inicializar Mapa
    setTimeout(() => {
        if (mapa) mapa.remove();
        mapa = L.map('map', { zoomControl: false }).setView([datos.oLat, datos.oLon], 12);
        
        const isDark = document.documentElement.classList.contains('dark');
        const tiles = isDark 
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            
        L.tileLayer(tiles).addTo(mapa);

        const puntos = datos.coords.map(p => [p[1], p[0]]);
        const polyline = L.polyline(puntos, { color: '#2563eb', weight: 5 }).addTo(mapa);
        mapa.fitBounds(polyline.getBounds(), { padding: [20, 20] });
    }, 300);

    btn.innerText = "TRAZAR RUTA";
    btn.disabled = false;
}

function finalizarViaje() {
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla1').classList.remove('hidden');
}

function conectarOBD() {
    alert("Buscando vLinker...");
}