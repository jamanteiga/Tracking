// ... (Funciones de Modo Oscuro y Bluetooth iguales) ...

async function calcularRutaMapa(origen, destino) {
    try {
        const geocode = async (loc) => {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}`);
            const d = await r.json();
            return d;
        };

        const [dataOri, dataDest] = await Promise.all([geocode(origen), geocode(destino)]);

        if (dataOri.length > 0 && dataDest.length > 0) {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${dataOri[0].lon},${dataOri[0].lat};${dataDest[0].lon},${dataDest[0].lat}?overview=false`;
            const resRuta = await fetch(osrmUrl);
            const dataRuta = await resRuta.json();

            if (dataRuta.routes && dataRuta.routes.length > 0) {
                // OSRM devuelve segundos. Convertimos a minutos.
                let minutos = Math.round(dataRuta.routes[0].duration / 60);
                console.log("Minutos reales calculados por mapa:", minutos);
                return minutos;
            }
        }
    } catch (e) { 
        console.error("Error de mapa, usando estimación física segura."); 
    }
    
    // RESPALDO FÍSICO: Si el mapa falla, usamos tus 52km a media de 75km/h (legal)
    // 52km / 75km/h * 60 min = ~42 minutos.
    return 42; 
}

async function iniciarRuta() {
    const ori = document.getElementById('origen').value.trim();
    const dest = document.getElementById('destino').value.trim();

    if (!ori || !dest) return alert("Indica origen y destino");

    // Limpiamos cualquier rastro de los 35 minutos viejos
    document.getElementById('valLlegada').innerText = "--:--";
    document.getElementById('indicadorRuta').innerText = "CALCULANDO TIEMPO LEGAL...";
    
    // Obtenemos los minutos (esperamos a que el servidor de mapas responda)
    minutosEstimadosGlobal = await calcularRutaMapa(ori, dest);

    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.remove('hidden');
    document.getElementById('indicadorRuta').innerText = `${ori.toUpperCase()} ➔ ${dest.toUpperCase()}`;

    iniciarBucleLectura();
}

function actualizarUI() {
    const precio = parseFloat(document.getElementById('precioLitro').value) || 1.488;
    document.getElementById('valLitros').innerText = consumoAcumulado.toFixed(4);
    document.getElementById('valCoste').innerText = (consumoAcumulado * precio).toFixed(2);
    
    // Sumamos los minutos reales calculados a la hora actual
    let ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + minutosEstimadosGlobal);
    
    let h = ahora.getHours();
    let m = ahora.getMinutes();
    document.getElementById('valLlegada').innerText = `${h}:${m < 10 ? '0' + m : m}`;
}