let consumoAcumulado = 0;
let intervaloOBD = null;
let obdConectado = false;
let gattServer = null;

// MODO OSCURO
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

// CONEXIÓN VLINKER
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
            console.log("Octavia desconectado.");
        });

    } catch (error) {
        console.log("Bluetooth Error:", error);
    }
}

// INICIAR RUTA
function iniciarRuta() {
    const origen = document.getElementById('origen').value.trim();
    const destino = document.getElementById('destino').value.trim();

    if (!origen || !destino) {
        alert("Introduce los lugares de ruta.");
        return;
    }

    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.remove('hidden');
    document.getElementById('indicadorRuta').innerText = `${origen} ➔ ${destino}`;

    iniciarBucleLectura();
}

function iniciarBucleLectura() {
    if (intervaloOBD) clearInterval(intervaloOBD);

    intervaloOBD = setInterval(() => {
        let velocidad = 0;
        let maf = 0;

        // Si hay conexión, los ceros se sustituyen por datos reales del OBD
        if (obdConectado) {
            // Lógica interna: Aquí irían los comandos 010D y 0110
            // Por defecto, si el coche está parado/apagado, velocidad y maf son 0
        }

        // Si MAF es 0, el consumo es 0.
        let litrosConsumidos = (maf / (14.7 * 737)) * 2;
        consumoAcumulado += litrosConsumidos;

        document.getElementById('valVelocidad').innerText = velocidad;
        actualizarUI();
    }, 2000);
}

function actualizarUI() {
    const precio = parseFloat(document.getElementById('precioLitro').value) || 1.488;
    document.getElementById('valLitros').innerText = consumoAcumulado.toFixed(4);
    document.getElementById('valCoste').innerText = (consumoAcumulado * precio).toFixed(2);
    
    // ETA Estándar
    let d = new Date();
    d.setMinutes(d.getMinutes() + 35);
    document.getElementById('valLlegada').innerText = d.getHours() + ":" + (d.getMinutes()<10?'0':'') + d.getMinutes();
    
    if(obdConectado) {
        document.getElementById('statusConexion').innerText = "Motor Conectado";
        document.getElementById('statusConexion').classList.replace('bg-red-500', 'bg-green-600');
    }
}

function volverAjustes() {
    clearInterval(intervaloOBD);
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla1').classList.remove('hidden');
}