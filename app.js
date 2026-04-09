// Forzamos versión v12 para evitar caché
console.log("Cargando Telemetría v12 - Mapa Real");

function toggleModo() {
    document.documentElement.classList.toggle('dark');
    const btn = document.getElementById('btnModo');
    btn.innerText = document.documentElement.classList.contains('dark') ? "☀️" : "🌙";
}

// Función para obtener coordenadas y tiempo real
async function obtenerDatosRuta(origen, destino) {
    try {
        const geo = async (l) => {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(l)}`);
            const d = await r.json();
            return d[0];
        };

        const o = await geo(origen);
        const d = await geo(destino);

        if (o && d) {
            const ruta = await fetch(`https://router.project-osrm.org/route/v1/driving/${o.lon},${o.lat};${d.lon},${d.lat}?overview=false`);
            const data = await ruta.json();
            if (data.routes) {
                return Math.round(data.routes[0].duration / 60);
            }
        }
    } catch (e) {
        console.error("Error de red, estimando por distancia física...");
    }
    return null; 
}

async function iniciarRuta() {
    const ori = document.getElementById('origen').value.trim();
    const dest = document.getElementById('destino').value.trim();

    if (!ori || !dest) return alert("Falta origen o destino");

    const btn = event.target;
    btn.innerText = "BUSCANDO MAPA...";
    btn.disabled = true;

    // CONSULTA REAL AL MAPA
    const minutos = await obtenerDatosRuta(ori, dest);

    if (!minutos) {
        alert("Error al conectar con el mapa. Comprueba tu conexión.");
        btn.innerText = "TRAZAR RUTA";
        btn.disabled = false;
        return;
    }

    // Si llega aquí, es que el mapa ha respondido con un tiempo real
    document.getElementById('pantalla1').style.display = 'none';
    document.getElementById('pantalla2').style.display = 'block';
    document.getElementById('indicadorRuta').innerText = ori + " > " + dest;

    let llegada = new Date();
    llegada.setMinutes(llegada.getMinutes() + minutos);
    
    const h = llegada.getHours();
    const m = llegada.getMinutes();
    document.getElementById('valLlegada').innerText = (h<10?'0':'')+h + ":" + (m<10?'0':'')+m;
    
    btn.innerText = "TRAZAR RUTA";
    btn.disabled = false;
}

function finalizarViaje() {
    document.getElementById('pantalla2').style.display = 'none';
    document.getElementById('pantalla1').style.display = 'block';
}