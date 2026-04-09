let mapa = null;
let obdConectado = false;
let grabacionActiva = false;
let datosCSV = [];
let latActual = 0, lonActual = 0, velActual = 0, altActual = 0;
let distTotal = 0;
let sumaVel10s = 0, cuentaVel10s = 0;

async function conectarOBD() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'vLinker' }],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        await device.gatt.connect();
        obdConectado = true;
        document.getElementById('dotConexion').classList.replace('bg-red-500', 'bg-green-500');
        document.getElementById('btnConectar').innerText = "OBD OK";
    } catch (e) { alert("Error Bluetooth"); }
}

async function iniciarRuta() {
    const ori = document.getElementById('origen').value;
    const dest = document.getElementById('destino').value;
    if (!ori || !dest) return alert("Faltan datos");

    try {
        const geo = async (q) => {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
            const d = await r.json(); return d[0];
        };
        const p1 = await geo(ori);
        const p2 = await geo(dest);

        document.getElementById('pantalla1').classList.add('hidden');
        document.getElementById('pantalla2').classList.remove('hidden');

        // MAPA
        setTimeout(() => {
            if (mapa) mapa.remove();
            mapa = L.map('map', { zoomControl: false }).setView([p1.lat, p1.lon], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);

            // Trazado de ruta
            fetch(`https://router.project-osrm.org/route/v1/driving/${p1.lon},${p1.lat};${p2.lon},${p2.lat}?overview=full&geometries=geojson`)
                .then(r => r.json())
                .then(data => {
                    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    const linea = L.polyline(coords, { color: '#2563eb', weight: 6 }).addTo(mapa);
                    mapa.fitBounds(linea.getBounds(), { padding: [20, 20] });
                    mapa.invalidateSize();
                });
        }, 400);

        // Ubicación
        navigator.geolocation.watchPosition(p => {
            latActual = p.coords.latitude;
            lonActual = p.coords.longitude;
            altActual = p.coords.altitude || 0;
            velActual = Math.round(p.coords.speed * 3.6) || 0;
            document.getElementById('valVelocidad').innerText = velActual;
        }, null, { enableHighAccuracy: true });

        // Media 10s
        setInterval(() => {
            if (cuentaVel10s > 0) {
                document.getElementById('valMedia10s').innerText = Math.round(sumaVel10s / cuentaVel10s);
                sumaVel10s = 0; cuentaVel10s = 0;
            }
        }, 10000);

    } catch (e) { alert("Error cargando mapa"); }
}

function alternarGrabacion() {
    const btn = document.getElementById('btnStartRec');
    const precio = parseFloat(document.getElementById('precioLitro').value);

    if (!grabacionActiva) {
        grabacionActiva = true;
        datosCSV = [["Timestamp", "Lat", "Lon", "Altitud", "Velocidad"]];
        btn.innerText = "DETENER";
        
        window.timerCSV = setInterval(() => {
            sumaVel10s += velActual; cuentaVel10s++;
            distTotal += (velActual / 3600);
            
            let coste = ((distTotal * 5.8) / 100) * precio;
            document.getElementById('valDinero').innerText = coste.toFixed(2);

            datosCSV.push([new Date().toISOString(), latActual, lonActual, altActual, velActual]);
        }, 1000);
    } else {
        clearInterval(window.timerCSV);
        exportarCSV();
        location.reload();
    }
}

async function exportarCSV() {
    let csv = datosCSV.map(row => row.join(",")).join("\n");
    let blob = new Blob([csv], { type: 'text/csv' });
    let file = new File([blob], `Log_${Date.now()}.csv`, { type: 'text/csv' });
    if (navigator.share) await navigator.share({ files: [file], title: 'Log Telemetría' });
}