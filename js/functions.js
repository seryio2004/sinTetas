let audioCtx = null;
let gainNode;
let freq = 440;
let volume = 0.3;
let waveform = 'sine'; // Forma de onda por defecto
let keyToNote = {};
let activeOscillators = {}; //Para manejar múltiples sonidos
let currentButtonNote = null;
let buttonTimeout = null;
let customWave; // Guardaremos la onda personalizada

// 🎛 Crear la forma de onda personalizada
function createCustomWave() {
    let real = new Float32Array([0, 1, 0.5, 0.25, 0.125]);  // Armónicos decrecientes
    let imag = new Float32Array(real.length); // Sin desfase
    customWave = audioCtx.createPeriodicWave(real, imag, { disableNormalization: false });
}



// Función para calcular notas en base a la frecuencia seleccionada
function actualizarNotas() {
    keyToNote = {
        "k": freq * (2 ** (9 / 12)), // La 
        "o": freq * (2 ** (10 / 12)),  // si#
        "l": freq * (2 ** (11 / 12)),  // si 
        "d": freq , // La (frecuencia base) Do
        "r": freq * (2 ** (1/ 12)),  // do#
        "f": freq * (2 ** (2 / 12)), // Re
        "t": freq * (2 ** (3 / 12)),  // re#
        "g": freq * (2 ** (4 / 12)), // Mi
        "h": freq * (2 ** (5 / 12)), // Fa
        "u": freq * (2 ** (6 / 12)),  // fa#
        "j": freq * (2 ** (7 / 12)), // Solº
        "i": freq * (2 ** (8 / 12)),  // sol#
    };
}

// Inicializar notas al cargar la página
actualizarNotas();

// 🎛 Slider de frecuencia
document.querySelector("#freq-slider").addEventListener("input", (e) => {
    freq = parseFloat(e.target.value);
    document.querySelector("#freq-label").textContent = freq;
    actualizarNotas();
});

// 🎚 Slider de volumen
document.querySelector("#volume-slider").addEventListener("input", (e) => {
    volume = parseFloat(e.target.value);
    document.querySelector("#volume-label").textContent = volume.toFixed(2);
    for (let key in activeOscillators) {
        activeOscillators[key].gainNode.gain.value = volume;
    }
});

// 🎚 Selector de forma de onda
document.querySelector("#waveform-selector").addEventListener("change", (e) => {
    waveform = e.target.value;
});

// Detectar teclas presionadas en PC
document.addEventListener("keydown", (event) => {
    initializeAudioContext();
    let key = event.key.toLowerCase();
    if (keyToNote[key] && !activeOscillators[key]) { // Si no está ya sonando
        playNote(key, keyToNote[key]);
        highlightKey(key, true);
    }
});

//Detectar teclas soltadas en PC
document.addEventListener("keyup", (event) => {
    let key = event.key.toLowerCase();
    if (activeOscillators[key]) {
        stopNote(key);
        highlightKey(key, false);
    }
});

function initializeAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        createCustomWave();
    }
}

// Agregar eventos táctiles a las teclas en dispositivos móviles
document.querySelectorAll(".key, .key.sharp").forEach((keyElement) => {
    keyElement.addEventListener("touchstart", (event) => {
        event.preventDefault(); // Prevenir el evento de doble toque en móviles
        initializeAudioContext(); // Asegurar que el contexto de audio esté iniciado
        let key = keyElement.getAttribute("data-key");
        if (keyToNote[key] && !activeOscillators[key]) {
            playNote(key, keyToNote[key]);
            highlightKey(key, true);
        }
    });

    keyElement.addEventListener("touchend", (event) => {
        event.preventDefault();
        let key = keyElement.getAttribute("data-key");
        if (activeOscillators[key]) {
            stopNote(key);
            highlightKey(key, false);
        }
    });
});

function playNote(key, frequency) {
    let oscillator = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();

    // Asignar la forma de onda seleccionada
    if (waveform === "custom") {
        oscillator.setPeriodicWave(customWave);
    } else {
        oscillator.type = waveform; 
    }

    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();

    activeOscillators[key] = { oscillator, gainNode };
}

// Detener sonido de una tecla
function stopNote(key) {
    if (activeOscillators[key]) {
        let { oscillator, gainNode } = activeOscillators[key];

        //  Suavizar el apagado para evitar cortes bruscos
        gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

        setTimeout(() => {
            oscillator.stop();
            oscillator.disconnect();
            delete activeOscillators[key];
        }, 100);
    }
}

//Resaltar teclas en pantalla
function highlightKey(key, active) {
    let keyElement = document.querySelector(`[data-key="${key}"]`);
    if (keyElement) {
        keyElement.classList.toggle("active", active);
    }
}