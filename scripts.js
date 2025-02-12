
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let oscillator, gainNode;
let freq = 440;


document.querySelector("#freq-slider").addEventListener("input", (e) => {
    freq = e.target.value;
    document.querySelector("#freq-label").textContent = freq;

});


function playNote(frequency) {
    stopNote();
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    
    oscillator.type = 'sawtooth'; // Tipo de onda
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.3;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
}
function calcularHercios(nota){
    switch(nota){
        case "do":
            return freq;
        case "re":
            return freq * (2 **(2/12));
        case "mi":
            return freq * (2 **(4/12));
        case "fa":
            return freq * (2 **(5/12));
        case "sol":
            return freq * (2 **(7/12));
        case "la":
            return freq * (2 **(9/12));
        case "si":
            return freq * (2 **(11/12));
        case "do2":
            return freq * (2 **(12/12));
    }
}

function stopNote() {
    if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
    }
}



document.body.addEventListener("mouseup", stopNote);
