const {
    Renderer,
    Stave,
    StaveNote,
    Accidental,
    Formatter,
    Dot
} = Vex.Flow;

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('settings-form').addEventListener('submit', function (e) {
        e.preventDefault();
        generateRhythm();
    });

    document.getElementById('playback-button').addEventListener('click', function () {
        Tone.start().then(() => {
            playbackRhythm();
        }).catch(e => console.error(e));
    });

    document.getElementById('stop-button').addEventListener('click', function () {
        stopPlaybacknow();
    });
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
        if (note.symbol !== '16r' && note.symbol !== '8r') {
            count++;
        }
    }
    return count;
}

function createRhythmPattern(beats) {
    const syllables = [
        { symbol: 'q', syllable: 'ta' },
        { symbol: '8', syllable: 'ta-Di' },
        { symbol: '8r, 8', syllable: 'rest-Di' },
        { symbol: '16', syllable: 'ta-Ka-Di-Mi' },
        { symbol: '16r, 16', syllable: 'rest-Ka-Di-Mi' },
        { symbol: '16r, 16', syllable: 'rest-Rest-Di-Mi' },
        { symbol: '16r, 16', syllable: 'rest-Rest-Rest-Mi' },
        { symbol: '16', syllable: 'ta-Rest-Di-Mi' },
        { symbol: '8d, 16', syllable: 'ta-Mi' },
        { symbol: '16, 8', syllable: 'ta-Ka-Di-Rest' },
    ];

    let pattern = [];
    for (let i = 0; i < beats; i++) {
        const randomIndex = Math.floor(Math.random() * syllables.length);
        const chosenNote = syllables[randomIndex];
        if (chosenNote.syllable === 'ta') {
            pattern.push({ symbol: 'q', syllable: 'ta' });
        } else if (chosenNote.syllable === 'rest-Di') {
            pattern.push({ symbol: '8r', syllable: '' });
            pattern.push({ symbol: '8', syllable: 'Di' });
        } else if (chosenNote.syllable === 'ta-Di') {
            pattern.push({ symbol: '8', syllable: 'ta' });
            pattern.push({ symbol: '8', syllable: 'Di' });
        } else if (chosenNote.syllable === 'ta-Ka-Di-Mi') {
            pattern.push({ symbol: '16', syllable: 'ta' });
            pattern.push({ symbol: '16', syllable: 'Ka' });
            pattern.push({ symbol: '16', syllable: 'Di' });
            pattern.push({ symbol: '16', syllable: 'Mi' });
        } else if (chosenNote.syllable === 'rest-Ka-Di-Mi') {
            pattern.push({ symbol: '16r', syllable: '' });
            pattern.push({ symbol: '16', syllable: 'Ka' });
            pattern.push({ symbol: '16', syllable: 'Di' });
            pattern.push({ symbol: '16', syllable: 'Mi' });
        } else if (chosenNote.syllable === 'rest-Rest-Di-Mi') {
            pattern.push({ symbol: '8r', syllable: '' });
            pattern.push({ symbol: '16', syllable: 'Di' });
            pattern.push({ symbol: '16', syllable: 'Mi' });
        } else if (chosenNote.syllable === 'rest-Rest-Rest-Mi') {
            pattern.push({ symbol: '16r', syllable: '' });
            pattern.push({ symbol: '16r', syllable: '' });
            pattern.push({ symbol: '16r', syllable: '' });
            pattern.push({ symbol: '16', syllable: 'Mi' });
        } else if (chosenNote.syllable === 'ta-Rest-Di-Mi') {
            pattern.push({ symbol: '8', syllable: 'ta' });
            pattern.push({ symbol: '16', syllable: 'Di' });
            pattern.push({ symbol: '16', syllable: 'Mi' });
        } else if (chosenNote.syllable === 'ta-Rest-Rest-Mi') {
            pattern.push({ symbol: '8d', syllable: 'ta' });
            pattern.push({ symbol: '16', syllable: 'Mi' });
        } else if (chosenNote.syllable === 'ta-Ka-Di-Rest') {
            pattern.push({ symbol: '16', syllable: 'ta' });
            pattern.push({ symbol: '16', syllable: 'Ka' });
            pattern.push({ symbol: '8', syllable: 'Di' });
        }
    }
    return pattern;
}

function renderRhythm(rhythmPattern, timeSignature) {
    const container = document.getElementById('rhythm-grid');
    const renderer = new Vex.Flow.Renderer(container, Vex.Flow.Renderer.Backends.SVG);
    renderer.resize(800, 300);

    const context = renderer.getContext();
    const stave = new Vex.Flow.Stave(10, 40, 780);
    stave.addClef('treble').addTimeSignature(timeSignature).setContext(context).draw();

    const vexNotes = [];

    rhythmPattern.forEach(note => {
        let duration = note.symbol;

        if (duration === '8d') {
            duration = '8';  // Use '8' for duration and add a dot separately
        }

        const vexNote = new Vex.Flow.StaveNote({
            keys: ['c/4'],
            duration: duration
        });

        if (note.symbol === '8d') {
            vexNote.addDotToAll();
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

    const formatter = new Vex.Flow.Formatter().joinVoices([voice]).format([voice], 700);

    voice.draw(context, stave);
    beams.forEach(beam => beam.setContext(context).draw());
}

function playbackRhythm() {
    const rhythmPattern = currentRhythmPattern;

    if (!rhythmPattern || rhythmPattern.length === 0) {
        console.error("No rhythm pattern to play");
        return;
    }

    const rhythmSequence = [];

    const noteValueMap = {
        'q': { note: 'C4', duration: '4n' },
        '8': { note: 'C4', duration: '8n' },
        '16': { note: 'C4', duration: '16n' },
        '8r': { note: null, duration: '8n' },
        '16r': { note: null, duration: '16n' },
        '8d': { note: 'C4', duration: '8n + 16n' }
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
