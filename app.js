let mapa = null;
let obdConectado = false;

function toggleModo() {
    document.documentElement.classList.toggle('dark');
    const btn = document.getElementById('btnModo');
    btn.innerText = document.documentElement.classList.contains('dark') ? "☀️" : "🌙";
}

async function conectarOBD() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'vLinker' }],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        await device.gatt.connect();
        obdConectado = true;
        document.getElementById('dotConexion').classList.replace('bg-red-500', 'bg-green-400');
        document.getElementById('labelStatus').innerText = "OBD Conectado";
        document.getElementById('labelStatus').classList.replace('bg-slate-200', 'bg-green-600');
        document.getElementById('labelStatus').classList.add('text-white');
    } catch (e) {
        alert("Bluetooth: " + e.message);
    }
}

async function iniciarRuta() {
    const ori = document.getElementById('origen').value.trim();
    const dest = document.getElementById('destino').value.trim();
    if (!ori || !dest) return alert("Indica Origen y Destino");

    const btn = document.getElementById('btnTrazar');
    btn.innerText = "CALCULANDO...";

    try {
        const geo = async (l) => {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(l)}`);
            const d = await r.json();
            return d[0];
        };
        const oData = await geo(ori);
        const dData = await geo(dest);

        const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${oData.lon},${oData.lat};${dData.lon},${dData.lat}?overview=full&geometries=geojson`);
        const data = await r.json();

        document.getElementById('pantalla1').classList.add('hidden');
        document.getElementById('pantalla2').classList.remove('hidden');
        document.getElementById('indicadorRuta').innerText = ori + " > " + dest;

        setTimeout(() => {
            if (mapa) { mapa.remove(); mapa = null; }
            mapa = L.map('map', { zoomControl: false }).setView([oData.lat, oData.lon], 13);
            
            const isDark = document.documentElement.classList.contains('dark');
            const tiles = isDark 
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

            L.tileLayer(tiles).addTo(mapa);
            const coords = data.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
            const polyline = L.polyline(coords, { color: '#2563eb', weight: 6 }).addTo(mapa);
            mapa.fitBounds(polyline.getBounds(), { padding: [20, 20] });
            mapa.invalidateSize();

            let llegada = new Date();
            llegada.setMinutes(llegada.getMinutes() + Math.round(data.routes[0].duration / 60));
            document.getElementById('valLlegada').innerText = llegada.getHours() + ":" + (llegada.getMinutes()<10?'0':'') + llegada.getMinutes();
            btn.innerText = "TRAZAR RUTA";
        }, 400);

    } catch (e) {
        alert("Error de ruta");
        btn.innerText = "TRAZAR RUTA";
    }
}

function finalizarViaje() {
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla1').classList.remove('hidden');
    if(mapa) { mapa.remove(); mapa = null; }
}