// Variables de estado de Tracking
let consumoAcumulado = 0;
let intervaloOBD = null;
let obdConectado = false;

// --- 1. GESTIÓN DE MODO OSCURO ---
// Corregido para usar la clase 'dark' en el documento
function toggleModo() {
    const htmlElement = document.documentElement;
    const body = document.getElementById('bodyApp');
    const btn = document.getElementById('btnModo');
    
    if (htmlElement.classList.contains('dark')) {
        // Pasar a MODO CLARO
        htmlElement.classList.remove('dark');
        body.classList.replace('bg-slate-900', 'bg-white');
        body.classList.replace('text-white', 'text-slate-900');
        btn.innerText = "🌙";
    } else {
        // Pasar a MODO OSCURO
        htmlElement.classList.add('dark');
        body.classList.replace('bg-white', 'bg-slate-900');
        body.classList.replace('text-slate-900', 'text-white');
        btn.innerText = "☀️";
    }
}

// --- 2. LÓGICA DE LOS BOTONES ---

async function conectarOBD() {
    try {
        const btn = document.getElementById('btnConectar');
        const dot = document.getElementById('dotConexion');
        
        // Simulación de conexión para el vLinker
        console.log("Conectando con vLinker en el Octavia...");
        
        obdConectado = true;
        btn.classList.replace('bg-slate-700', 'bg-green-700');
        dot.classList.replace('bg-red-500', 'bg-green-400');
        btn.querySelector('span').innerText = "VLINKER VINCULADO";
    } catch (error) {
        alert("Error de conexión: " + error);
    }
}

function iniciarRuta() {
    console.log("Intentando trazar ruta..."); // Para depurar en la consola
    
    const origenInput = document.getElementById('origen').value;
    const destinoInput = document.getElementById('destino').value;

    // Validación estricta
    if (origenInput.trim() === "" || destinoInput.trim() === "") {
        alert("Por favor, introduce origen y destino.");
        return;
    }

    // Cambiar visualmente las pantallas
    const p1 = document.getElementById('pantalla1');
    const p2 = document.getElementById('pantalla2');
    
    if (p1 && p2) {
        p1.classList.add('hidden');
        p2.classList.remove('hidden');
        
        // Escribir la ruta en el Dashboard
        document.getElementById('indicadorRuta').innerText = `${origenInput.toUpperCase()} ➔ ${destinoInput.toUpperCase()}`;
        
        // Actualizar estado de conexión en pantalla 2
        const status = document.getElementById('statusConexion');
        if (obdConectado) {
            status.innerText = "TRACKING ACTIVO (OBD)";
            status.classList.replace('bg-red-500', 'bg-green-500');
        }

        // Lanzar el bucle de datos
        iniciarBucleLectura();
    } else {
        console.error("No se han encontrado los IDs de las pantallas en el HTML");
    }
}

function volverAjustes() {
    if (intervaloOBD) clearInterval(intervaloOBD);
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla1').classList.remove('hidden');
}

// --- 3. MOTOR DE DATOS ---

function iniciarBucleLectura() {
    if (intervaloOBD) clearInterval(intervaloOBD);

    intervaloOBD = setInterval(() => {
        // Datos simulados para el Octavia 1.5 TSI
        let velocidad = Math.floor(Math.random() * (120 - 110 + 1) + 110);
        let maf = Math.random() * (30 - 20) + 20;

        // Cálculo de litros consumidos (cada 2 seg)
        let consumo = (maf / (14.7 * 737)) * 2;
        consumoAcumulado += consumo;

        // Actualizar visualmente
        document.getElementById('valVelocidad').innerText = velocidad;
        actualizarUI(velocidad);
    }, 2000);
}

function actualizarUI(vActual) {
    // Precio indicado por el usuario (ej: 1.488)
    const precio = parseFloat(document.getElementById('precioLitro').value) || 0;
    
    document.getElementById('valLitros').innerText = consumoAcumulado.toFixed(3);
    document.getElementById('valCoste').innerText = (consumoAcumulado * precio).toFixed(2);
    
    // Cálculo de hora de llegada aproximada
    let d = new Date();
    d.setMinutes(d.getMinutes() + 5); // Trayecto corto en Cabanas
    
    let h = d.getHours();
    let m = d.getMinutes();
    document.getElementById('valLlegada').innerText = `${h}:${m < 10 ? '0' + m : m}`;
}