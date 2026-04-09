let mapa = null;

function toggleModo() {
    document.documentElement.classList.toggle('dark');
    // Al cambiar de modo, si el mapa existe, lo refrescamos
    if (mapa) {
        finalizarViaje();
        alert("Modo cambiado, traza la ruta de nuevo.");
    }
}

async function iniciarRuta() {
    const ori = document.getElementById('origen').value.trim();
    const dest = document.getElementById('destino').value.trim();
    if (!ori || !dest) return alert("Falta origen o destino");

    const btn = document.getElementById('btnTrazar');
    btn.innerText = "BUSCANDO RUTA...";
    btn.disabled = true;

    try {
        // 1. Obtener coordenadas
        const geo = async (l) => {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(l)}`);
            const d = await r.json();
            return d[0];
        };
        const oData = await geo(ori);
        const dData = await geo(dest);

        if(!oData || !dData) throw new Error("Localización no encontrada");

        // 2. Obtener ruta
        const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${oData.lon},${oData.lat};${dData.lon},${dData.lat}?overview=full&geometries=geojson`);
        const data = await r.json();

        // 3. Cambiar Pantalla
        document.getElementById('pantalla1').classList.add('hidden');
        document.getElementById('pantalla2').classList.remove('hidden');

        // 4. INICIALIZAR MAPA (Con triple seguridad)
        setTimeout(() => {
            if (mapa) { mapa.remove(); mapa = null; }
            
            // Creamos el mapa apuntando al div 'map'
            mapa = L.map('map', {
                zoomControl: false,
                attributionControl: false
            }).setView([oData.lat, oData.lon], 13);
            
            const isDark = document.documentElement.classList.contains('dark');
            const tiles = isDark 
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

            L.tileLayer(tiles).addTo(mapa);

            const coords = data.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
            const polyline = L.polyline(coords, { color: '#2563eb', weight: 6, opacity: 0.8 }).addTo(mapa);
            
            // Ajustar vista
            mapa.fitBounds(polyline.getBounds(), { padding: [30, 30] });

            // Forzar renderizado
            mapa.invalidateSize();

            // Tiempo de llegada
            let llegada = new Date();
            llegada.setMinutes(llegada.getMinutes() + Math.round(data.routes[0].duration / 60));
            document.getElementById('valLlegada').innerText = llegada.getHours() + ":" + (llegada.getMinutes()<10?'0':'') + llegada.getMinutes();
            
            btn.innerText = "TRAZAR RUTA";
            btn.disabled = false;
        }, 400);

    } catch (e) {
        alert("Error: " + e.message);
        btn.innerText = "TRAZAR RUTA";
        btn.disabled = false;
    }
}

function finalizarViaje() {
    if (mapa) {
        mapa.remove();
        mapa = null;
    }
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla1').classList.remove('hidden');
}