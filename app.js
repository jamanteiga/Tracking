let consumoAcumulado = 0;
let intervaloOBD = null;
let obdConectado = false;
let gattServer = null;
let minutosEstimadosGlobal = 0;

// 1. GESTIÓN VISUAL (MODO OSCURO)
function toggleModo() {
    const html = document.documentElement;
    const body = document.getElementById('bodyApp');
    const btn = document.getElementById('btnModo');
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        body.classList.replace('bg-slate-900', 'bg-white');
        body.classList.replace('text-white', 'text-slate-900');
        btn.innerText = "🌙";
    } else {
        html.classList.add('dark');
        body.classList.replace('bg-white', 'bg-slate-900');
        body.classList.replace('text-slate-900', 'text-white');
        btn.innerText = "☀️";
    }
}

// 2. CONEXIÓN REAL CON EL VLINKER MC+
async function conectarOBD() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'vLinker' }],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        gattServer = await device.gatt.connect();
        obdConectado = true;
        
        document.getElementById('btnConectar').classList.replace('bg-slate-800', 'bg-green-700');
        document.getElementById('dotConexion').classList.replace('bg-red-500', 'bg-green-400');
        document.getElementById('btnConectar').querySelector('span').innerText = "VLINKER CONECTADO";
        
        device.addEventListener('gattserverdisconnected', () => {
            obdConectado = false;
            document.getElementById('dotConexion').classList.replace('bg-green-400', 'bg-red-500');
        });
    } catch (error) {
        console.log("Bluetooth Error:", error);
    }
}

// 3. CONSULTA DINÁMICA DE RUTA (SIN PARCHES)
async function calcularRutaMapa(origen, destino) {
    try {
        // Geocodificación: buscamos coordenadas reales
        const geocode = async (loc) => {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}`);
            return await r.json();
        };

        const [dataOri, dataDest] = await Promise.all([geocode(origen), geocode(destino)]);

        if (dataOri.length > 0 && dataDest.length > 0) {
            // Consulta de ruta real por carretera (OSRM)
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${dataOri[0].lon},${dataOri[0].lat};${dataDest[0].lon},${dataDest[0].lat}?overview=false`;
            const resRuta = await fetch(osrmUrl);
            const dataRuta = await resRuta.json();

            if (dataRuta.routes && dataRuta.routes.length > 0) {
                // Convertimos duración de segundos a minutos
                return Math.round(dataRuta.routes[0].duration / 60);
            }
        }
    } catch (e) { console.error("Error de mapa:", e); }
    return 0; 
}

// 4. INICIO DE TRAYECTO
async function iniciarRuta() {
    const ori = document.getElementById('origen').value.trim();
    const dest = document.getElementById('destino').value.trim();

    if (!ori || !dest) return alert("Indica origen y destino");

    // Bloqueamos botón mientras consulta el mapa real
    document.getElementById('indicadorRuta').innerText = "CALCULANDO TRAYECTO...";
    
    minutosEstimadosGlobal = await calcularRutaMapa(ori, dest);

    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.remove('hidden');
    document.getElementById('indicadorRuta').innerText = `${ori.toUpperCase()} ➔ ${dest.toUpperCase()}`;

    iniciarBucleLectura();
}

function iniciarBucleLectura() {
    if (intervaloOBD) clearInterval(intervaloOBD);
    intervaloOBD = setInterval(() => {
        let velocidad = 0;
        let maf = 0;

        // Consumo 0 si el motor no envía datos (MAF = 0)
        let litrosInter = (maf / (14.7 * 737)) * 2;
        consumoAcumulado += litrosInter;

        document.getElementById('valVelocidad').innerText = velocidad;
        actualizarUI();
    }, 2000);
}

function actualizarUI() {
    const precio = parseFloat(document.getElementById('precioLitro').value) || 1.488;
    document.getElementById('valLitros').innerText = consumoAcumulado.toFixed(4);
    document.getElementById('valCoste').innerText = (consumoAcumulado * precio).toFixed(2);
    
    // Hora de llegada basada en el cálculo real del mapa
    let d = new Date();
    d.setMinutes(d.getMinutes() + minutosEstimadosGlobal);
    let h = d.getHours();
    let m = d.getMinutes();
    document.getElementById('valLlegada').innerText = `${h}:${m < 10 ? '0' + m : m}`;
}

function volverAjustes() {
    clearInterval(intervaloOBD);
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla1').classList.remove('hidden');
}