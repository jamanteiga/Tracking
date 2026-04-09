let mapa = null;
let obdConectado = false;
let grabacionActiva = false;
let datosCSV = [];
let acumuladoVel = 0;
let contadorMuestras = 0;
let watchID = null;

// Datos actuales para el log
let curLat = 0, curLon = 0, curAlt = 0, curVel = 0, curMAF = 0;

function toggleModo() {
    document.documentElement.classList.toggle('dark');
}

// 1. CONECTAR OBD (Simulado si no hay dispositivo)
async function conectarOBD() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'vLinker' }],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        obdConectado = true;
        document.getElementById('dotConexion').classList.replace('bg-red-500', 'bg-green-400');
    } catch (e) { alert("Bluetooth: " + e.message); }
}

// 2. INICIAR RUTA Y SENSORES
async function iniciarRuta() {
    const ori = document.getElementById('origen').value;
    const dest = document.getElementById('destino').value;
    if (!ori || !dest) return alert("Falta ruta");

    // Activar GPS Real del iPhone
    if ("geolocation" in navigator) {
        watchID = navigator.geolocation.watchPosition(p => {
            curLat = p.coords.latitude;
            curLon = p.coords.longitude;
            curAlt = p.coords.altitude || 0;
            // Si el OBD no está, usamos velocidad GPS
            if (!obdConectado) curVel = Math.round(p.coords.speed * 3.6) || 0;
        }, null, { enableHighAccuracy: true });
    }

    // Dibujar Mapa (OSRM)
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/...`); // (Lógica de mapa abreviada por espacio, manten la anterior)
    
    // Cambiar Pantalla
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.remove('hidden');

    // Bucle de Telemetría (1 segundo)
    setInterval(bucleTelemetria, 1000);
}

function bucleTelemetria() {
    if (obdConectado) {
        // Aquí irían las llamadas reales al vLinker (MAF, Speed)
        curVel = 95; // Ejemplo
        curMAF = 15.5; 
    }

    // Calcular Consumo L/100 (Aprox para 1.5 TSI)
    let consumoInst = curVel > 5 ? (curMAF / (14.7 * 737)) * 360000 / curVel : 0.7;

    // Actualizar UI
    document.getElementById('valVelocidad').innerText = curVel;
    document.getElementById('valConsumo').innerText = consumoInst.toFixed(1);

    // GRABAR EN CSV SI ESTÁ ACTIVO
    if (grabacionActiva) {
        contadorMuestras++;
        acumuladoVel += curVel;
        let vMed = (acumuladoVel / contadorMuestras).toFixed(1);
        
        datosCSV.push([
            new Date().toLocaleTimeString(),
            curLat.toFixed(6),
            curLon.toFixed(6),
            curAlt.toFixed(1),
            curVel,
            consumoInst.toFixed(2),
            vMed,
            "TRAMO_A"
        ]);
    }
}

// 3. GESTIÓN DE GRABACIÓN
function alternarGrabacion() {
    const btn = document.getElementById('btnStartRec');
    const dot = document.getElementById('dotRec');
    
    if (!grabacionActiva) {
        datosCSV = [["Hora", "Latitud", "Longitud", "Altitud_m", "Vel_KmH", "Consumo_L100", "Vel_Media", "Tramo"]];
        grabacionActiva = true;
        btn.innerText = "PARAR Y ENVIAR";
        dot.classList.add('bg-red-500', 'animate-rec');
        document.getElementById('labelRec').innerText = "Grabando...";
    } else {
        grabacionActiva = false;
        exportarCSV();
        btn.innerText = "Iniciar REC";
        dot.classList.remove('bg-red-500', 'animate-rec');
    }
}

async function exportarCSV() {
    let csvContent = datosCSV.map(e => e.join(",")).join("\n");
    let blob = new Blob([csvContent], { type: 'text/csv' });
    let file = new File([blob], `Log_Skoda_${Date.now()}.csv`, { type: 'text/csv' });

    if (navigator.share) {
        await navigator.share({ files: [file], title: 'Telemetría Skoda' });
    } else {
        let link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "log.csv";
        link.click();
    }
}

function finalizarViaje() {
    if(watchID) navigator.geolocation.clearWatch(watchID);
    location.reload();
}