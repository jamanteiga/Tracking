// Aseguramos que el script cargue correctamente
console.log("Script cargado v11");

// 1. MODO OSCURO (Nivel básico)
function toggleModo() {
    document.documentElement.classList.toggle('dark');
    const btn = document.getElementById('btnModo');
    btn.innerText = document.documentElement.classList.contains('dark') ? "☀️" : "🌙";
}

// 2. INICIAR RUTA (Sin llamadas a mapas externos para evitar bloqueos)
function iniciarRuta() {
    const ori = document.getElementById('origen').value;
    const dest = document.getElementById('destino').value;

    if (!ori || !dest) {
        alert("Falta origen o destino");
        return;
    }

    // Cambiar pantallas
    document.getElementById('pantalla1').style.display = 'none';
    document.getElementById('pantalla2').style.display = 'block';
    document.getElementById('indicadorRuta').innerText = ori + " > " + dest;

    // Calcular llegada (45 min fijos para no fallar ahora)
    let ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + 45);
    let h = ahora.getHours();
    let m = ahora.getMinutes();
    document.getElementById('valLlegada').innerText = (h<10?'0':'')+h + ":" + (m<10?'0':'')+m;
}

// 3. FINALIZAR (Para volver atrás)
function finalizarViaje() {
    document.getElementById('pantalla2').style.display = 'none';
    document.getElementById('pantalla1').style.display = 'block';
}

// 4. CONECTAR (Básico)
function conectarOBD() {
    alert("Intentando conectar con vLinker...");
    document.getElementById('dotConexion').style.backgroundColor = "#4ade80";
}