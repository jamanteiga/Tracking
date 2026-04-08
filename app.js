let consumoAcumulado = 0;
let intervaloOBD = null;

function toggleModo() {
    const body = document.getElementById('bodyApp');
    const btn = document.getElementById('btnModo');
    body.classList.toggle('dark');
    
    if (body.classList.contains('dark')) {
        body.classList.replace('bg-white', 'bg-slate-900');
        body.classList.replace('text-slate-900', 'text-white');
        btn.innerText = "☀️";
    } else {
        body.classList.replace('bg-slate-900', 'bg-white');
        body.classList.replace('text-white', 'text-slate-900');
        btn.innerText = "🌙";
    }
}

async function iniciarViaje() {
    const origen = document.getElementById('origen').value;
    const destino = document.getElementById('destino').value;
    
    if(!origen || !destino) return alert("Introduce los datos de Galicia.");

    document.getElementById('indicadorRuta').innerText = `${origen} ➔ ${destino}`;
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.remove('hidden');
    
    iniciarBucleLectura();
}

function volverAjustes() {
    clearInterval(intervaloOBD);
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla1').classList.remove('hidden');
}

function iniciarBucleLectura() {
    const status = document.getElementById('statusConexion');
    status.innerText = "Tracking Activo";
    status.classList.replace('bg-red-500', 'bg-green-500');

    intervaloOBD = setInterval(() => {
        let velocidad = Math.floor(Math.random() * (121 - 119) + 119); 
        let maf = Math.random() * (35 - 25) + 25; 

        // Cálculo cada 2 seg
        let consumoIntervalo = (maf / (14.7 * 737)) * 2;
        consumoAcumulado += consumoIntervalo;

        document.getElementById('valVelocidad').innerText = velocidad;
        actualizarUI();
    }, 2000);
}

function actualizarUI() {
    const precio = parseFloat(document.getElementById('precioLitro').value);
    document.getElementById('valLitros').innerText = consumoAcumulado.toFixed(3);
    document.getElementById('valCoste').innerText = (consumoAcumulado * precio).toFixed(2);
    
    let d = new Date();
    d.setMinutes(d.getMinutes() + 40); 
    document.getElementById('valLlegada').innerText = d.getHours() + ":" + (d.getMinutes()<10?'0':'') + d.getMinutes();
}