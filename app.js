let mapa = null;
let obdConectado = false;
let grabacionActiva = false;
let datosCSV = [];
let intervalo1s = null;
let watchID = null;

// Telemetría
let curLat = 0, curLon = 0, curAlt = 0, curVel = 0;
let distTotalKm = 0;
let sumaVel10s = 0, cuentaVel10s = 0;

// EL BOTÓN OBD: Ahora llama a la función Bluetooth correctamente
async function conectarOBD() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'vLinker' }],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        const server = await device.gatt.connect();
        obdConectado = true;
        document.getElementById('dotConexion').style.backgroundColor = '#4ade80'; // Verde
        document.getElementById('dotConexion').style.boxShadow = '0 0 10px #4ade80';
        alert("vLinker Conectado!");
    } catch (e) {
        alert("Error Bluetooth: " + e.message);
    }
}

async function iniciarRuta() {
    const ori = document.getElementById('origen').value;
    const dest = document.getElementById('destino').value;
    if(!ori || !dest) return alert("Escribe origen y destino");

    try {
        const geo = async (q) => {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
            const d = await r.json(); return d[0];
        };
        const oData = await geo(ori);
        const dData = await geo(dest);

        document.getElementById('pantalla1').classList.add('hidden');
        document.getElementById('pantalla2').classList.remove('hidden');

        // MAPA: Forzado para que no salga negro
        setTimeout(() => {
            if (mapa) mapa.remove();
            mapa = L.map('map', { zoomControl: false }).setView([oData.lat, oData.lon], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);
            
            // Trazar línea de ruta
            fetch(`https://router.project-osrm.org/route/v1/driving/${oData.lon},${oData.lat};${dData.lon},${dData.lat}?overview=full&geometries=geojson`)
                .then(r => r.json())
                .then(data => {
                    const coords = data.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
                    L.polyline(coords, { color: '#3b82f6', weight: 6 }).addTo(mapa);
                    mapa.fitBounds(L.polyline(coords).getBounds());
                });

            mapa.invalidateSize(); // El truco para que se vea
        }, 400);

        // GPS Real
        watchID = navigator.geolocation.watchPosition(p => {
            curLat = p.coords.latitude;
            curLon = p.coords.longitude;
            curAlt = p.coords.altitude || 0;
            curVel = Math.round(p.coords.speed * 3.6) || 0;
            document.getElementById('valVelocidad').innerText = curVel;
        }, null, { enableHighAccuracy: true });

        // Intervalo de 10s para la media
        setInterval(() => {
            if(cuentaVel10s > 0) {
                document.getElementById('valMedia10s').innerText = Math.round(sumaVel10s / cuentaVel10s);
                sumaVel10s = 0; cuentaVel10s = 0;
            }
        }, 10000);

    } catch (e) { alert("Error al cargar ruta"); }
}

function alternarGrabacion() {
    const btn = document.getElementById('btnStartRec');
    const precio = parseFloat(document.getElementById('precioLitro').value);

    if (!grabacionActiva) {
        grabacionActiva = true;
        datosCSV = [["Timestamp", "Lat", "Lon", "Velocidad", "Altitud"]];
        btn.innerText = "DETENER Y EXPORTAR";
        
        intervalo1s = setInterval(() => {
            sumaVel10s += curVel; cuentaVel10s++;
            distTotalKm += (curVel / 3600);
            
            // Gasto aproximado (Consumo 5.8L/100km)
            let coste = ((distTotalKm * 5.8) / 100) * precio;
            document.getElementById('valDinero').innerText = coste.toFixed(2);

            datosCSV.push([new Date().toISOString(), curLat, curLon, curVel, curAlt]);
        }, 1000);
    } else {
        clearInterval(intervalo1s);
        exportarCSV();
        location.reload();
    }
}

async function exportarCSV() {
    let csv = datosCSV.map(e => e.join(",")).join("\n");
    let blob = new Blob([csv], { type: 'text/csv' });
    let file = new File([blob], `Log_${Date.now()}.csv`, { type: 'text/csv' });
    if (navigator.share) await navigator.share({ files: [file], title: 'Log Telemetría' });
}

function finalizarViaje() { location.reload(); }