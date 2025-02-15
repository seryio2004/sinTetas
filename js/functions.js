let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let gainNode;
let freq = 440;
let volume = 0.3;
let waveform = 'sine'; // Forma de onda por defecto
let keyToNote = {};
let activeOscillators = {}; //Para manejar múltiples sonidos
let pressedKeys = {}; // Objeto para rastrear teclas presionadas

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

// Función para iniciar una nota
function startNote(note) {
    if (!activeOscillators[note]) {
        let oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = note;
        oscillator.type = waveform;
        gainNode.gain.value = volume;
        oscillator.start();
        activeOscillators[note] = oscillator;
    }
}

// Función para detener una nota
function stopNote(note) {
    if (activeOscillators[note]) {
        activeOscillators[note].stop();
        delete activeOscillators[note];
    }
}

// Función para resaltar una tecla
function highlightKey(key) {
    let keyElement = document.querySelector(`.key[data-key="${key}"]`);
    if (keyElement) {
        keyElement.classList.add('active');
    }
}

// Función para quitar el resaltado de una tecla
function unhighlightKey(key) {
    let keyElement = document.querySelector(`.key[data-key="${key}"]`);
    if (keyElement) {
        keyElement.classList.remove('active');
    }
}

// Evento keydown para capturar teclas presionadas
document.addEventListener('keydown', (event) => {
    if (!pressedKeys[event.key]) {
        pressedKeys[event.key] = true;
        if (keyToNote[event.key]) {
            startNote(keyToNote[event.key]);
            highlightKey(event.key);
        }
    }
});

// Evento keyup para capturar teclas liberadas
document.addEventListener('keyup', (event) => {
    if (pressedKeys[event.key]) {
        delete pressedKeys[event.key];
        if (keyToNote[event.key]) {
            stopNote(keyToNote[event.key]);
            unhighlightKey(event.key);
        }
    }
});

// Evento touchstart para capturar teclas en dispositivos móviles
document.addEventListener('touchstart', (event) => {
    let key = event.target.dataset.key;
    if (key && !pressedKeys[key]) {
        pressedKeys[key] = true;
        if (keyToNote[key]) {
            startNote(keyToNote[key]);
            highlightKey(key);
        }
    }
});

// Evento touchend para capturar teclas liberadas en dispositivos móviles
document.addEventListener('touchend', (event) => {
    let key = event.target.dataset.key;
    if (key && pressedKeys[key]) {
        delete pressedKeys[key];
        if (keyToNote[key]) {
            stopNote(keyToNote[key]);
            unhighlightKey(key);
        }
    }
});