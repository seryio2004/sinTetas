let audioCtx = null;
let gainNode;
let freq = 440;
let volume = 0.3;
let waveform = 'sine'; // Forma de onda por defecto
let keyToNote = {};
let activeOscillators = {}; //Para manejar múltiples sonidos
let currentButtonNote = null;
let buttonTimeout = null;

let customWaves = {
    "custom1": null,
    "custom2": null,
    "custom3": null
};

//Crear la forma de onda personalizada
function createCustomWaves() {
  
  let real1 = new Float32Array([0, 1, 0.5, 0.25, 0.125, 0.0625, 0.03125]);
  let imag1 = new Float32Array([0, 0.3, 0.15, 0.075, 0.0375, 0.01875, 0.009375]);
  customWaves["custom1"] = audioCtx.createPeriodicWave(real1, imag1);

  
  let real2 = new Float32Array([0, 1, 0.8, 0.6, 0.4, 0.2, 0.1]);
  let imag2 = new Float32Array([0, 0.6, 0.3, 0.15, 0.075, 0.0375, 0.01875]);
  customWaves["custom2"] = audioCtx.createPeriodicWave(real2, imag2);

  
  let real3 = new Float32Array([0, 1, 0.7, 0.5, 0.3, 0.2, 0.1]);
  let imag3 = new Float32Array([0, 0.8, 0.4, 0.2, 0.1, 0.05, 0.025]);
  customWaves["custom3"] = audioCtx.createPeriodicWave(real3, imag3);
}


// Función para calcular notas en base a la frecuencia seleccionada
function actualizarNotas() {
    keyToNote = {
        "d": freq , // La (frecuencia base) Do
        "r": freq * (2 ** (1/ 12)),  // do#
        "f": freq * (2 ** (2 / 12)), // Re
        "t": freq * (2 ** (3 / 12)),  // re#
        "g": freq * (2 ** (4 / 12)), // Mi
        "h": freq * (2 ** (5 / 12)), // Fa
        "u": freq * (2 ** (6 / 12)),  // fa#
        "j": freq * (2 ** (7 / 12)), // Solº
        "i": freq * (2 ** (8 / 12)),  // sol#
        "k": freq * (2 ** (9 / 12)), // La 
        "o": freq * (2 ** (10 / 12)),  // si#
        "l": freq * (2 ** (11 / 12)),  // si 

        //siguiente octava(no dan las teclas para toda la octava, solo notas naturales)
        "z": freq * 2, //Do
        "x": freq * 2 * (2 ** (2/ 12)), // Re
        "c": freq * 2 * (2 ** (4/ 12)), // Mi
        "v": freq * 2 * (2 ** (5/ 12)), // Fa
        "b": freq * 2 * (2 ** (7 / 12)), // sol
        "n": freq * 2 * (2 ** (9 / 12)), // La
        "m": freq * 2 * (2 ** (11/ 12)), // si
    };
}

// Inicializar notas al cargar la página
actualizarNotas();

//Slider de frecuencia
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
        createCustomWaves();
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
    let analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;

    // Asignar la forma de onda seleccionada
    if (waveform === "custom1"||waveform === "custom2"||waveform === "custom3") {
        oscillator.setPeriodicWave(customWaves[waveform]);
    } else {
        oscillator.type = waveform; 
    }

    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.connect(analyser);

    oscillator.start();

    activeOscillators[key] = { oscillator, gainNode, analyser };

    // Start drawing the waveform if it's the first note being played
    if (Object.keys(activeOscillators).length === 1) {
        let canvas = document.getElementById('waveform');
        let ctx = canvas.getContext('2d');
        isPlaying = true;
        drawWave(ctx);
    }
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

            // Stop drawing the waveform if no notes are being played
            if (Object.keys(activeOscillators).length === 0) {
                isPlaying = false;
            }
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




var isPlaying = false;

//draw function for canvas
function drawWave(ctx) {
    if (!isPlaying) return; // Only draw if a note is being played

    requestAnimationFrame(() => drawWave(ctx));

    let bufferLength = 2048;
    let dataArray = new Uint8Array(bufferLength);
    let combinedData = new Float32Array(bufferLength);

    for (let key in activeOscillators) {
        let analyser = activeOscillators[key].analyser;
        analyser.getByteTimeDomainData(dataArray);

        for (let i = 0; i < bufferLength; i++) {
            combinedData[i] += (dataArray[i] - 128) / 128.0; 
        }
    }

    ctx.fillStyle = 'rgb(200, 200, 200)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(0, 0, 0)';

    ctx.beginPath();

    let sliceWidth = ctx.canvas.width * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        let y = (combinedData[i] / Object.keys(activeOscillators).length) * ctx.canvas.height / 2 + ctx.canvas.height / 2;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    ctx.lineTo(ctx.canvas.width, ctx.canvas.height / 2);
    ctx.stroke();
}

document.addEventListener("DOMContentLoaded", function() {
    let context;

    function initializeContext() {
        if (!context) {
            context = new (window.AudioContext || window.webkitAudioContext)();
            let masterGain = context.createGain();
            masterGain.connect(context.destination);
            let analyser = context.createAnalyser();
            analyser.fftSize = 2048;
            masterGain.connect(analyser);

            let canvas = document.getElementById('waveform');
            let ctx = canvas.getContext('2d');

            // Set canvas dimensions explicitly for iOS
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            document.querySelectorAll('button').forEach(button => {
                button.addEventListener('mousedown', function() {
                    if (context.state === 'suspended') {
                        context.resume();
                    }

                    let osc = context.createOscillator();
                    // Oscillator settings
                    osc.frequency.value = 220;
                    let imag = new Float32Array([0, 0, 1, 0, 1]); // sine
                    let real = new Float32Array(imag.length); // cos
                    let customWave = context.createPeriodicWave(real, imag); // cos, sine
                    osc.setPeriodicWave(customWave);

                    osc.connect(masterGain);
                    osc.start();
                    isPlaying = true;

                    drawWave(ctx);
                });

                button.addEventListener('mouseup', function() {
                    isPlaying = false;
                    osc.stop();
                });
            });
        }
    }

    document.body.addEventListener('click', initializeContext, { once: true });
});