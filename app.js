let mapa = null;
let grabacionActiva = false;
let datosCSV = [];
let intervalo1s = null;
let intervalo10s = null;

// Variables de Telemetría
let curLat = 0, curLon = 0, curAlt = 0, curVel = 0;
let distTotalKm = 0; // Para calcular consumo y coste
let sumaVel10s = 0, cuentaVel10s = 0;
let sumaVelTotal = 0, cuentaVelTotal = 0;
let precioCombustible = 1.65;
const CONSUMO_BASE = 5.8; // l/100km (ajusta al consumo real de tu Octavia)

async function iniciarRuta() {
    const ori = document.getElementById('origen').value;
    const dest = document.getElementById('destino').value;
    precioCombustible = parseFloat(document.getElementById('precioLitro').value) || 1.65;

    try {
        const resOri = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${ori}`);
        const dOri = await resOri.json();
        const resDest = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${dest}`);
        const dDest = await resDest.json();

        document.getElementById('pantalla1').classList.add('hidden');
        document.getElementById('pantalla2').classList.remove('hidden');

        // REPARACIÓN MAPA: Usar OpenStreetMap estándar (evita fondos negros)
        setTimeout(() => {
            if (mapa) { mapa.remove(); mapa = null; }
            mapa = L.map('map', { zoomControl: false }).setView([dOri[0].lat, dOri[0].lon], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(mapa);

            L.marker([dOri[0].lat, dOri[0].lon]).addTo(mapa).bindPopup('Origen');
            L.marker([dDest[0].lat, dDest[0].lon]).addTo(mapa).bindPopup('Destino');
            
            // Forzar actualización de tamaño para evitar cuadros negros
            mapa.invalidateSize();
        }, 500);

        // GPS Activo
        navigator.geolocation.watchPosition(p => {
            curLat = p.coords.latitude;
            curLon = p.coords.longitude;
            curAlt = p.coords.altitude || 0;
            curVel = Math.round(p.coords.speed * 3.6) || 0;
            
            document.getElementById('valVelocidad').innerText = curVel;
            document.getElementById('valAltitud').innerText = Math.round(curAlt);
        }, null, { enableHighAccuracy: true });

        // Lógica de Media cada 10 segundos
        intervalo10s = setInterval(() => {
            if (cuentaVel10s > 0) {
                let media10 = Math.round(sumaVel10s / cuentaVel10s);
                document.getElementById('valMedia10s').innerText = media10;
                sumaVel10s = 0; cuentaVel10s = 0;
            }
        }, 10000);

    } catch (e) { alert("Error al localizar puntos"); }
}

function alternarGrabacion() {
    const btn = document.getElementById('btnStartRec');
    if (!grabacionActiva) {
        grabacionActiva = true;
        datosCSV = [["Timestamp", "Lat", "Lon", "Velocidad", "Altitud"]];
        btn.innerText = "DETENER Y EXPORTAR";
        btn.classList.replace('bg-red-600', 'bg-slate-800');
        
        // Registro cada 1 segundo
        intervalo1s = setInterval(() => {
            // Acumular para la media de 10s
            sumaVel10s += curVel;
            cuentaVel10s++;
            
            // Acumular para cálculos de distancia/coste
            // 1 km/h durante 1 seg = 0.0002777 km
            let distTramo = (curVel / 3600);
            distTotalKm += distTramo;

            // Cálculos dinámicos
            let litrosGastados = (distTotalKm * CONSUMO_BASE) / 100;
            let costeActual = litrosGastados * precioCombustible;

            document.getElementById('valDinero').innerText = costeActual.toFixed(2);
            document.getElementById('valConsumo').innerText = CONSUMO_BASE.toFixed(1);

            datosCSV.push([new Date().toISOString(), curLat, curLon, curVel, curAlt]);
        }, 1000);
    } else {
        grabacionActiva = false;
        clearInterval(intervalo1s);
        exportarCSV();
        location.reload();
    }
}

async function exportarCSV() {
    let csvContent = datosCSV.map(e => e.join(",")).join("\n");
    let blob = new Blob([csvContent], { type: 'text/csv' });
    let file = new File([blob], `Viaje_Octavia_${Date.now()}.csv`, { type: 'text/csv' });
    if (navigator.share) await navigator.share({ files: [file], title: 'Log de Viaje' });
}

function finalizarViaje() { location.reload(); }