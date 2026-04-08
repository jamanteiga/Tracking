let consumoAcumulado = 0;
let intervaloOBD = null;
let obdConectado = false;
let minutosEstimados = 45; // Valor por defecto para Abegondo-Ferrol

// 1. MODO OSCURO (CORREGIDO)
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

// 2. INICIAR RUTA
function iniciarRuta() {
    const ori = document.getElementById('origen').value.trim();
    const dest = document.getElementById('destino').value.trim();

    if (!ori || !dest) {
        alert("Introduce origen y destino");
        return;
    }

    // Si detecta que vas a Ferrol desde Abegondo, ponemos 45 min legales
    if (dest.toLowerCase().includes("ferrol")) {
        minutosEstimados = 45;
    } else {
        minutosEstimados = 30; // Para otras rutas cortas
    }

    document.getElementById('indicadorRuta').innerText = ori + " > " + dest;
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.remove('hidden');

    iniciarBucle();
}

// 3. BUCLE DE DATOS
function iniciarBucle() {
    if (intervaloOBD) clearInterval(intervaloOBD);
    
    intervaloOBD = setInterval(() => {
        let velocidad = obdConectado ? 90 : 0;
        let maf = obdConectado ? 15 : 0; 

        // Cálculo consumo
        let litros = (maf / (14.7 * 737)) * 2;
        consumoAcumulado += litros;

        // Actualizar UI
        document.getElementById('valVelocidad').innerText = velocidad;
        const precio = parseFloat(document.getElementById('precioLitro').value) || 1.488;
        document.getElementById('valCoste').innerText = (consumoAcumulado * precio).toFixed(2);
        document.getElementById('valLitros').innerText = consumoAcumulado.toFixed(4);

        // HORA DE LLEGADA
        let ahora = new Date();
        ahora.setMinutes(ahora.getMinutes() + minutosEstimados);
        let h = ahora.getHours();
        let m = ahora.getMinutes();
        document.getElementById('valLlegada').innerText = (h<10?'0':'')+h + ":" + (m<10?'0':'')+m;

        // MODO ACT
        const act = document.getElementById('modoACT');
        if (velocidad > 60 && maf < 10) {
            act.style.opacity = "1";
            act.style.backgroundColor = "#22c55e";
            act.style.color = "white";
        } else {
            act.style.opacity = "0.3";
            act.style.backgroundColor = "";
            act.style.color = "";
        }
    }, 2000);
}

// 4. VOLVER ATRÁS / FINALIZAR
function finalizarViaje() {
    clearInterval(intervaloOBD);
    consumoAcumulado = 0;
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla1').classList.remove('hidden');
}

// 5. BLUETOOTH
async function conectarOBD() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'vLinker' }],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        await device.gatt.connect();
        obdConectado = true;
        document.getElementById('dotConexion').style.backgroundColor = "#4ade80";
    } catch (e) { console.log("BT Error"); }
}