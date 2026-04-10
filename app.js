let mapa = null;
let obdConectado = false;
let grabacionActiva = false;
let datosCSV = [];
let latActual = 0, lonActual = 0, velActual = 0;
let distTotal = 0;
let sumaVel10s = 0, cuentaVel10s = 0;

// REPARACIÓN BLUETOOTH
async function conectarOBD() {
    try {
        // En iOS, el navegador DEBE estar en HTTPS
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        
        await device.gatt.connect();
        obdConectado = true;
        document.getElementById('btnConectar').innerText = "OBD OK";
        document.getElementById('btnConectar').className = "bg-green-600 px-4 py-2 rounded-lg text-xs font-black";
    } catch (e) {
        alert("Error: Asegúrate de usar HTTPS y activar Bluetooth en ajustes de Safari.");
        console.error(e);
    }
}

async function iniciarRuta() {
    const ori = document.getElementById('origen').value;
    const dest = document.getElementById('destino').value;
    if (!ori || !dest) return alert("Indica la ruta");

    try {
        const geo = async (q) => {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
            const d = await r.json(); return d[0];
        };
        const p1 = await geo(ori);
        const p2 = await geo(dest);

        // Llamada a OSRM para ruta y TIEMPO
        const rRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${p1.lon},${p1.lat};${p2.lon},${p2.lat}?overview=full&geometries=geojson`);
        const rData = await rRes.json();

        if (rData.routes && rData.routes[0]) {
            const segundos = rData.routes[0].duration;
            let llegada = new Date();
            llegada.setSeconds(llegada.getSeconds() + segundos);
            document.getElementById('valLlegada').innerText = llegada.getHours() + ":" + (llegada.getMinutes() < 10 ? '0' : '') + llegada.getMinutes();
            
            document.getElementById('pantalla1').classList.add('hidden');
            document.getElementById('pantalla2').classList.remove('hidden');

            // MAPA
            setTimeout(() => {
                if (mapa) mapa.remove();
                mapa = L.map('map', { zoomControl: false }).setView([p1.lat, p1.lon], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);
                const coords = rData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                const poly = L.polyline(coords, { color: '#3b82f6', weight: 6 }).addTo(mapa);
                mapa.fitBounds(poly.getBounds());
                mapa.invalidateSize();
            }, 300);
        }

        navigator.geolocation.watchPosition(p => {
            latActual = p.coords.latitude;
            lonActual = p.coords.longitude;
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

    } catch (e) { alert("Error de red"); }
}

function alternarGrabacion() {
    const btn = document.getElementById('btnStartRec');
    const precio = parseFloat(document.getElementById('precioLitro').value);

    if (!grabacionActiva) {
        grabacionActiva = true;
        datosCSV = [["Timestamp", "Lat", "Lon", "KmH"]];
        btn.innerText = "DETENER Y COMPARTIR";
        
        window.loopCSV = setInterval(() => {
            sumaVel10s += velActual; cuentaVel10s++;
            distTotal += (velActual / 3600); // dist en 1 seg
            let coste = ((distTotal * 5.8) / 100) * precio;
            document.getElementById('valDinero').innerText = coste.toFixed(2);
            datosCSV.push([new Date().toISOString(), latActual, lonActual, velActual]);
        }, 1000);
    } else {
        clearInterval(window.loopCSV);
        exportarCSV();
        location.reload();
    }
}

async function exportarCSV() {
    let csv = datosCSV.map(r => r.join(",")).join("\n");
    let file = new File([csv], `Log_${Date.now()}.csv`, { type: 'text/csv' });
    if (navigator.share) await navigator.share({ files: [file], title: 'Telemetría' });
}