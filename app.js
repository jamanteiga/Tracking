let mapa = null;

function toggleModo() {
    document.documentElement.classList.toggle('dark');
    if(mapa) {
        // Cambiar el estilo del mapa al cambiar modo (opcional)
        finalizarViaje(); // Reiniciamos para refrescar tiles
    }
}

async function iniciarRuta() {
    const ori = document.getElementById('origen').value.trim();
    const dest = document.getElementById('destino').value.trim();
    if (!ori || !dest) return alert("Falta origen o destino");

    const btn = document.getElementById('btnTrazar');
    btn.innerText = "CARGANDO MAPA...";

    try {
        // 1. Geocodificación y Ruta
        const geo = async (l) => {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(l)}`);
            const d = await r.json();
            return d[0];
        };
        const oData = await geo(ori);
        const dData = await geo(dest);

        const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${oData.lon},${oData.lat};${dData.lon},${dData.lat}?overview=full&geometries=geojson`);
        const data = await r.json();

        // 2. Mostrar pantalla
        document.getElementById('pantalla1').classList.add('hidden');
        document.getElementById('pantalla2').classList.remove('hidden');

        // 3. Inicializar Mapa (Con retardo para que el div sea visible)
        setTimeout(() => {
            if (mapa) { mapa.remove(); }
            
            mapa = L.map('map').setView([oData.lat, oData.lon], 13);
            
            const isDark = document.documentElement.classList.contains('dark');
            const tiles = isDark 
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

            L.tileLayer(tiles, {
                attribution: '&copy; OpenStreetMap'
            }).addTo(mapa);

            const coords = data.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
            const polyline = L.polyline(coords, { color: '#2563eb', weight: 6 }).addTo(mapa);
            
            mapa.fitBounds(polyline.getBounds(), { padding: [30, 30] });
            
            // CRÍTICO PARA IPHONE: Forza el redibujado
            mapa.invalidateSize();

            // Hora llegada
            let llegada = new Date();
            llegada.setMinutes(llegada.getMinutes() + Math.round(data.routes[0].duration / 60));
            document.getElementById('valLlegada').innerText = llegada.getHours() + ":" + (llegada.getMinutes()<10?'0':'') + llegada.getMinutes();
            
            btn.innerText = "TRAZAR RUTA";
        }, 500);

    } catch (e) {
        alert("Error de conexión");
        btn.innerText = "TRAZAR RUTA";
    }
}

function finalizarViaje() {
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla1').classList.remove('hidden');
    if(mapa) { mapa.remove(); mapa = null; }
}