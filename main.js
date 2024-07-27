const { Renderer, Stave, StaveNote, Accidental, Formatter, Dot } = Vex.Flow;

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('settings-form').addEventListener('submit', function (e) {
        e.preventDefault();
        generateRhythm();
    });

    const tempoSlider = document.getElementById('tempo-slider');
    const tempoValue = document.getElementById('tempo-value');

    tempoSlider.addEventListener('input', function () {
        const tempo = parseInt(tempoSlider.value);
        tempoValue.textContent = tempo + ' BPM';
        updateTempo(tempo);
    });

    function updateTempo(tempo) {
        Tone.Transport.bpm.value = tempo;
    }

    document.getElementById('playback-button').addEventListener('click', function () {
        Tone.start().then(() => {
            playbackRhythm();
        }).catch(e => console.error(e));
    });

    document.getElementById('stop-button').addEventListener('click', function () {
        stopPlaybacknow();
    });

    // Initial render
    generateRhythm();
    window.addEventListener('resize', generateRhythm); // Re-render on window resize
});

let currentRhythmPattern = [];
let metronomeIntervalId = null;

const customMetronomeSound = new Tone.Player("Perc_MetronomeQuartz_lo.wav").toDestination();

function generateRhythm() {
    const timeSignature = document.getElementById('time-signature').value;
    const rhythmGrid = document.getElementById('rhythm-grid');
    rhythmGrid.innerHTML = '';

    let totalBeats;
    switch (timeSignature) {
        case '4/4':
            totalBeats = 4;
            break;
        case '3/4':
            totalBeats = 3;
            break;
        case '2/4':
            totalBeats = 2;
            break;
        default:
            totalBeats = 4;
            break;
    }

    let rhythmPattern;
    do {
        rhythmPattern = createRhythmPattern(totalBeats);
    } while (countNotesInPattern(rhythmPattern) < totalBeats);

    currentRhythmPattern = rhythmPattern;
    renderRhythm(rhythmPattern, timeSignature);
}

function countNotesInPattern(rhythmPattern) {
    let count = 0;
    for (const note of rhythmPattern) {
        count++;
    }
    return count;
}

function createRhythmPattern(beats) {
    const noteDurations = {
        'q': 1,
        '8': 0.5,
        '16': 0.25,
        'qd': 1.5,
        '8d': 0.75,
        '8r': 0.5,
        '16r': 0.25,
    };

    const syllables = [
        { symbol: 'q', syllable: 'ta' },
        { symbol: '8', syllable: 'ta-Di' },
        { symbol: '8r, 8', syllable: 'rest-Di' },
        { symbol: '16', syllable: 'ta-Ka-Di-Mi' },
        { symbol: '16r, 16', syllable: 'rest-Ka-Di-Mi' },
        { symbol: '16r, 16', syllable: 'rest-Rest-Di-Mi' },
        { symbol: '16r, 16', syllable: 'rest-Rest-Rest-Mi' },
        { symbol: '8, 16', syllable: 'ta-Rest-Di-Mi' },
        { symbol: '8d, 16', syllable: 'ta-Rest-Rest-Mi' },
        { symbol: '16, 8', syllable: 'ta-Ka-Di-Rest' },
        { symbol: '16, 8r', syllable: 'ta-Ka-Rest-Rest' },
    ];

    let pattern = [];
    let totalDuration = 0;

    while (totalDuration < beats) {
        const randomIndex = Math.floor(Math.random() * syllables.length);
        const chosenNote = syllables[randomIndex];

        let notePattern = [];
        let noteDuration = 0;

        if (chosenNote.syllable === 'ta') {
            notePattern = [{ symbol: 'q', syllable: 'Ta' }];
            noteDuration = noteDurations['q'];
        } else if (chosenNote.syllable === 'rest-Di') {
            notePattern = [{ symbol: '8r', syllable: '' }, { symbol: '8', syllable: 'Di' }];
            noteDuration = noteDurations['8r'] + noteDurations['8'];
        } else if (chosenNote.syllable === 'ta-Di') {
            notePattern = [{ symbol: '8', syllable: 'Ta' }, { symbol: '8', syllable: 'Di' }];
            noteDuration = noteDurations['8'] + noteDurations['8'];
        } else if (chosenNote.syllable === 'ta-Ka-Di-Mi') {
            notePattern = [
                { symbol: '16', syllable: 'Ta' },
                { symbol: '16', syllable: 'Ka' },
                { symbol: '16', syllable: 'Di' },
                { symbol: '16', syllable: 'Mi' }
            ];
            noteDuration = noteDurations['16'] * 4;
        } else if (chosenNote.syllable === 'rest-Ka-Di-Mi') {
            notePattern = [
                { symbol: '16r', syllable: '' },
                { symbol: '16', syllable: 'Ka' },
                { symbol: '16', syllable: 'Di' },
                { symbol: '16', syllable: 'Mi' }
            ];
            noteDuration = noteDurations['16r'] + noteDurations['16'] * 3;
        } else if (chosenNote.syllable === 'rest-Rest-Di-Mi') {
            notePattern = [
                { symbol: '8r', syllable: '' },
                { symbol: '16', syllable: 'Di' },
                { symbol: '16', syllable: 'Mi' }
            ];
            noteDuration = noteDurations['8r'] + noteDurations['16'] * 2;
        } else if (chosenNote.syllable === 'rest-Rest-Rest-Mi') {
            notePattern = [
                { symbol: '16r', syllable: '' },
                { symbol: '16r', syllable: '' },
                { symbol: '16r', syllable: '' },
                { symbol: '16', syllable: 'Mi' }
            ];
            noteDuration = noteDurations['16r'] * 3 + noteDurations['16'];
        } else if (chosenNote.syllable === 'ta-Rest-Di-Mi') {
            notePattern = [
                { symbol: '8', syllable: 'Ta' },
                { symbol: '16', syllable: 'Di' },
                { symbol: '16', syllable: 'Mi' }
            ];
            noteDuration = noteDurations['8'] + noteDurations['16'] * 2;
        } else if (chosenNote.syllable === 'ta-Rest-Rest-Mi') {
            notePattern = [
                { symbol: '8d', syllable: 'Ta' },
                { symbol: '16', syllable: 'Mi' }
            ];
            noteDuration = noteDurations['8d'] + noteDurations['16'];
        } else if (chosenNote.syllable === 'ta-Ka-Rest-Rest') {
            notePattern = [
                { symbol: '16', syllable: 'Ta' },
                { symbol: '16', syllable: 'Ka' },
                { symbol: '8r', syllable: '' }
            ];
            noteDuration = noteDurations['8d'] + noteDurations['16'];
        }

        if (totalDuration + noteDuration <= beats) {
            pattern = pattern.concat(notePattern);
            totalDuration += noteDuration;
        } else {
            const remainingBeats = beats - totalDuration;
            if (remainingBeats >= 1) {
                pattern.push({ symbol: 'q', syllable: 'ta' });
                totalDuration += 1;
            } else if (remainingBeats >= 0.5) {
                pattern.push({ symbol: '8', syllable: 'ta' });
                totalDuration += 0.5;
            } else if (remainingBeats >= 0.25) {
                pattern.push({ symbol: '16', syllable: 'ta' });
                totalDuration += 0.25;
            }
        }
    }
    return pattern;
}

function renderRhythm(rhythmPattern, timeSignature) {
    const container = document.getElementById('rhythm-grid');
    const width = container.clientWidth;
    const height = 300;
    
    const renderer = new Vex.Flow.Renderer(container, Vex.Flow.Renderer.Backends.SVG);
    renderer.resize(width, height);

    const context = renderer.getContext();
    const stave = new Vex.Flow.Stave(10, 40, width - 20);
    stave.addClef('treble').addTimeSignature(timeSignature).setContext(context).draw();

    const vexNotes = [];

    rhythmPattern.forEach(note => {
        let duration = note.symbol;

        const vexNote = new Vex.Flow.StaveNote({
            keys: ['c/4'],
            duration: duration
        });

        if (duration === '8d') {
            vexNote.addModifier(new Vex.Flow.Dot(), 0); // Add a dot to the note
        }

        if (note.syllable) {
            const syllable = new Vex.Flow.Annotation(note.syllable)
                .setVerticalJustification(Vex.Flow.Annotation.VerticalJustify.BOTTOM)
                .setFont('Arial', 12, 'bold');
            vexNote.addModifier(syllable, 0);  // Correctly add the modifier at index 0
        }

        vexNotes.push(vexNote);
    });

    const beams = Vex.Flow.Beam.generateBeams(vexNotes);

    const [num_beats, beat_value] = timeSignature.split('/').map(Number);
    const voice = new Vex.Flow.Voice({ num_beats, beat_value });
    voice.addTickables(vexNotes);

    const formatter = new Vex.Flow.Formatter().joinVoices([voice]).format([voice], width - 100);

    voice.draw(context, stave);
    beams.forEach(beam => beam.setContext(context).draw());
}

function playbackRhythm() {
    const rhythmPattern = currentRhythmPattern;

    if (!rhythmPattern || rhythmPattern.length === 0) {
        console.error("No rhythm pattern to play");
        return;
    }

    const noteValueMap = {
        'q': { note: 'C4', duration: '4n' },
        '8': { note: 'C4', duration: '8n' },
        '16': { note: 'C4', duration: '16n' },
        '8r': { note: null, duration: '8n' },
        '16r': { note: null, duration: '16n' },
        '8d': { note: 'C4', duration: '8n.' } // Adjust the duration for the dotted eighth note
    };

    const rhythmDuration = rhythmPattern.reduce((acc, note) => {
        return acc + (noteValueMap[note.symbol] ? Tone.Time(noteValueMap[note.symbol].duration).toSeconds() : 0);
    }, 0);

    const synth = new Tone.Synth().toDestination();
    Tone.Transport.start();

    metronomeIntervalId = Tone.Transport.scheduleRepeat(time => {
        customMetronomeSound.start(time);
    }, '4n');

    let rhythmStartTime = Tone.now();
    rhythmPattern.forEach(note => {
        const noteValue = noteValueMap[note.symbol];
        if (noteValue && noteValue.note) {
            synth.triggerAttackRelease(noteValue.note, noteValue.duration, rhythmStartTime);
        }
        rhythmStartTime += Tone.Time(noteValue.duration).toSeconds();
    });

    Tone.Transport.scheduleOnce(() => {
        stopPlayback();
    }, `+${rhythmDuration}`);
}

function stopPlayback() {
    if (metronomeIntervalId) {
        Tone.Transport.clear(metronomeIntervalId);
        metronomeIntervalId = null;
    }
    Tone.Transport.stop();
}

function stopPlaybacknow() {
    if (metronomeIntervalId) {
        Tone.Transport.clear(metronomeIntervalId);
        metronomeIntervalId = null;
    }
    Tone.Transport.stop();
}
