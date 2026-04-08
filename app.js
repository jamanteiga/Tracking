// --- VARIABLES GLOBALES ---
let consumoAcumulado = 0;
let intervaloOBD = null;
let obdConectado = false;
let minutosEstimadosGlobal = 0;
let ultimaAlertaVoz = 0;

// --- 1. MODO OSCURO (CORREGIDO Y SEPARADO) ---
function toggleModo() {
    const html = document.documentElement;
    const btn = document.getElementById('btnModo');
    
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        btn.innerText = "🌙";
    } else {
        html.classList.add('dark');
        btn.innerText = "☀️";
    }
}

// --- 2. HISTORIAL (LOCAL STORAGE) ---
function actualizarListaHistorial() {
    try {
        const historial = JSON.parse(localStorage.getItem('historial')) || [];
        const contenedor = document.getElementById('listaHistorial');
        if (!contenedor) return;
        
        contenedor.innerHTML = historial.length === 0 ? '<p class="text-slate-400">No hay viajes guardados.</p>' : '';
        
        historial.slice().reverse().slice(0, 5).forEach(viaje => {
            const item = document.createElement('div');
            item.className = "p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex justify-between dark:text-white border dark:border-slate-700 mb-2";
            item.innerHTML = `<span>${viaje.fecha} - ${viaje.ruta.substring(0,20)}...</span><b>${viaje.coste}€</b>`;
            contenedor.appendChild(item);
        });
    } catch (e) { console.error("Error historial:", e); }
}

// --- 3. CÁLCULO DE RUTA REAL (OSRM) ---
async function calcularRutaMapa(origen, destino) {
    try {
        const resOri = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(origen)}`);
        const dataOri = await resOri.json();
        const resDest = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destino)}`);
        const dataDest = await resDest.json();

        if (dataOri.length > 0 && dataDest.length > 0) {
            const resRuta = await fetch(`https://router.project-osrm.org/route/v1/driving/${dataOri[0].lon},${dataOri[0].lat};${dataDest[0].lon},${dataDest[0].lat}?overview=false`);
            const dataRuta = await resRuta.json();
            if (dataRuta.routes) return Math.round(dataRuta.routes[0].duration / 60);
        }
    } catch (e) { console.error("Error mapa:", e); }
    return 45; // Respaldo legal para Abegondo-Ferrol
}

// --- 4. INICIAR RUTA (BOTÓN PRINCIPAL) ---
async function iniciarRuta() {
    const ori = document.getElementById('origen').value.trim();
    const dest = document.getElementById('destino').value.trim();

    if (!ori || !dest) {
        alert("Por favor, introduce origen y destino.");
        return;
    }

    // Respuesta visual inmediata
    const btnRuta = event.target;
    btnRuta.innerText = "CALCULANDO...";
    btnRuta.disabled = true;

    // Calculamos tiempo real
    minutosEstimadosGlobal = await calcularRutaMapa(ori, dest);

    // Cambio de pantalla
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.remove('hidden');
    document.getElementById('indicadorRuta').innerText = `${ori.toUpperCase()} ➔ ${dest.toUpperCase()}`;

    iniciarBucleLectura();
}

// --- 5. BUCLE DE DATOS ---
function iniciarBucleLectura() {
    if (intervaloOBD) clearInterval(intervaloOBD);
    
    intervaloOBD = setInterval(() => {
        let velocidad = obdConectado ? 95 : 0; // Ejemplo
        let maf = obdConectado ? 12 : 0; 

        // Lógica ACT y Barra Eco
        const modoACT = document.getElementById('modoACT');
        if (velocidad > 70 && maf < 10) {
            modoACT.classList.replace('opacity-30', 'opacity-100');
            modoACT.classList.add('bg-green-500', 'text-white');
        } else {
            modoACT.classList.replace('opacity-100', 'opacity-30');
            modoACT.classList.remove('bg-green-500', 'text-white');
        }

        // Consumo
        let litros = (maf / (14.7 * 737)) * 2;
        consumoAcumulado += litros;

        document.getElementById('valVelocidad').innerText = velocidad;
        actualizarUI();
    }, 2000);
}

function actualizarUI() {
    const precio = parseFloat(document.getElementById('precioLitro').value) || 1.488;
    document.getElementById('valLitros').innerText = consumoAcumulado.toFixed(4);
    document.getElementById('valCoste').innerText = (consumoAcumulado * precio).toFixed(2);
    
    // Calcular hora de llegada
    let ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + minutosEstimadosGlobal);
    document.getElementById('valLlegada').innerText = ahora.getHours() + ":" + (ahora.getMinutes()<10?'0':'') + ahora.getMinutes();
}

// --- 6. BLUETOOTH Y CIERRE ---
async function conectarOBD() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'vLinker' }],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        const server = await device.gatt.connect();
        obdConectado = true;
        document.getElementById('dotConexion').classList.replace('bg-red-500', 'bg-green-400');
    } catch (e) { console.log(e); }
}

function finalizarViaje() {
    // Guardar en historial antes de salir
    if (consumoAcumulado > 0) {
        const viaje = {
            ruta: document.getElementById('indicadorRuta').innerText,
            coste: (consumoAcumulado * (parseFloat(document.getElementById('precioLitro').value) || 1.488)).toFixed(2),
            fecha: new Date().toLocaleDateString()
        };
        const historial = JSON.parse(localStorage.getItem('historial')) || [];
        historial.push(viaje);
        localStorage.setItem('historial', JSON.stringify(historial));
    }

    clearInterval(intervaloOBD);
    location.reload(); // Recarga para limpiar todo y volver a pantalla 1
}

window.onload = actualizarListaHistorial;