let mapa = null;
let obdConectado = false;
let grabacionActiva = false;
let datosCSV = [];
let watchID = null;

// Estados Globales
let curLat = 0, curLon = 0, curAlt = 0, curVel = 0;
let acumuladoVel = 0, muestras = 0;

function toggleModo() {
    document.documentElement.classList.toggle('dark');
}

async function conectarOBD() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'vLinker' }],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        obdConectado = true;
        document.getElementById('dotConexion').classList.replace('bg-red-500', 'bg-green-400');
    } catch (e) { console.log("BT: " + e); }
}

async function iniciarRuta() {
    const ori = document.getElementById('origen').value.trim();
    const dest = document.getElementById('destino').value.trim();
    if (!ori || !dest) return alert("Indica la ruta");

    const btn = document.getElementById('btnTrazar');
    btn.innerText = "LOCALIZANDO...";
    btn.disabled = true;

    try {
        const geo = async (q) => {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
            const d = await r.json(); return d[0];
        };
        const oData = await geo(ori);
        const dData = await geo(dest);

        const rRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${oData.lon},${oData.lat};${dData.lon},${dData.lat}?overview=full&geometries=geojson`);
        const rData = await rRes.json();

        document.getElementById('pantalla1').classList.add('hidden');
        document.getElementById('pantalla2').classList.remove('hidden');

        // INICIALIZACIÓN DE MAPA CON RETRESO
        setTimeout(() => {
            if (mapa) mapa.remove();
            mapa = L.map('map', { zoomControl: false, attributionControl: false }).setView([oData.lat, oData.lon], 13);
            
            const isDark = document.documentElement.classList.contains('dark');
            const tiles = isDark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            
            L.tileLayer(tiles).addTo(mapa);
            const coords = rData.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
            const poly = L.polyline(coords, { color: '#3b82f6', weight: 8, opacity: 0.8 }).addTo(mapa);
            mapa.fitBounds(poly.getBounds(), { padding: [20, 20] });
            
            // Forzar redibujado cada vez que el mapa sea visible
            mapa.invalidateSize();
            
            let llegada = new Date();
            llegada.setMinutes(llegada.getMinutes() + Math.round(rData.routes[0].duration / 60));
            document.getElementById('valLlegada').innerText = llegada.getHours() + ":" + (llegada.getMinutes()<10?'0':'') + llegada.getMinutes();
        }, 300);

        // GPS Real del iPhone
        watchID = navigator.geolocation.watchPosition(p => {
            curLat = p.coords.latitude;
            curLon = p.coords.longitude;
            curAlt = p.coords.altitude || 0;
            if (!obdConectado) curVel = Math.round(p.coords.speed * 3.6) || 0;

            document.getElementById('valVelocidad').innerText = curVel;
            document.getElementById('valAltitud').innerText = Math.round(curAlt);

            if (grabacionActiva) {
                muestras++;
                acumuladoVel += curVel;
                datosCSV.push([new Date().toISOString(), curLat.toFixed(6), curLon.toFixed(6), curAlt.toFixed(1), curVel, (acumuladoVel/muestras).toFixed(1)]);
            }
        }, e => console.log(e), { enableHighAccuracy: true });

    } catch (e) { alert("Error de conexión"); }
    btn.innerText = "TRAZAR E INICIAR";
    btn.disabled = false;
}

function alternarGrabacion() {
    const btn = document.getElementById('btnStartRec');
    const dot = document.getElementById('dotRec');
    const label = document.getElementById('labelRec');

    if (!grabacionActiva) {
        datosCSV = [["Timestamp", "Lat", "Lon", "Altitud_m", "Vel_KmH", "Vel_Media"]];
        grabacionActiva = true;
        btn.innerText = "PARAR Y ENVIAR";
        dot.classList.replace('bg-slate-400', 'bg-red-500');
        dot.classList.add('animate-rec');
        label.innerText = "REC ACTIVO";
        label.classList.add('text-red-500');
    } else {
        grabacionActiva = false;
        exportarCSV();
        btn.innerText = "Iniciar REC";
        dot.classList.remove('bg-red-500', 'animate-rec');
        dot.classList.add('bg-slate-400');
        label.innerText = "Datalogger Ready";
        label.classList.remove('text-red-500');
    }
}

async function exportarCSV() {
    if (datosCSV.length < 2) return;
    let csv = datosCSV.map(e => e.join(",")).join("\n");
    let blob = new Blob([csv], { type: 'text/csv' });
    let file = new File([blob], `SkodaLog_${Date.now()}.csv`, { type: 'text/csv' });
    if (navigator.share) await navigator.share({ files: [file], title: 'Telemetría Octavia' });
}

function finalizarViaje() {
    if (watchID) navigator.geolocation.clearWatch(watchID);
    location.reload();
}