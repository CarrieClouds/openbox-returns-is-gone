var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var FFT;
(function (FFT) {
    function scaleElementsByFactor(array, factor) {
        for (var i = 0; i < array.length; i++) {
            array[i] *= factor;
        }
    }
    FFT.scaleElementsByFactor = scaleElementsByFactor;
    function isPowerOf2(n) {
        return !!n && !(n & (n - 1));
    }
    function countBits(n) {
        if (!isPowerOf2(n))
            throw new Error("FFT array length must be a power of 2.");
        return Math.round(Math.log(n) / Math.log(2));
    }
    function reverseIndexBits(array) {
        var fullArrayLength = array.length;
        var bitCount = countBits(fullArrayLength);
        if (bitCount > 16)
            throw new Error("FFT array length must not be greater than 2^16.");
        var finalShift = 16 - bitCount;
        for (var i = 0; i < fullArrayLength; i++) {
            var j = void 0;
            j = ((i & 0xaaaa) >> 1) | ((i & 0x5555) << 1);
            j = ((j & 0xcccc) >> 2) | ((j & 0x3333) << 2);
            j = ((j & 0xf0f0) >> 4) | ((j & 0x0f0f) << 4);
            j = ((j >> 8) | ((j & 0xff) << 8)) >> finalShift;
            if (j > i) {
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
        }
    }
    function inverseRealFourierTransform(array) {
        var fullArrayLength = array.length;
        var totalPasses = countBits(fullArrayLength);
        if (fullArrayLength < 4)
            throw new Error("FFT array length must be at least 4.");
        for (var pass = totalPasses - 1; pass >= 2; pass--) {
            var subStride = 1 << pass;
            var midSubStride = subStride >> 1;
            var stride = subStride << 1;
            var radiansIncrement = Math.PI * 2.0 / stride;
            var cosIncrement = Math.cos(radiansIncrement);
            var sinIncrement = Math.sin(radiansIncrement);
            var oscillatorMultiplier = 2.0 * cosIncrement;
            for (var startIndex = 0; startIndex < fullArrayLength; startIndex += stride) {
                var startIndexA = startIndex;
                var midIndexA = startIndexA + midSubStride;
                var startIndexB = startIndexA + subStride;
                var midIndexB = startIndexB + midSubStride;
                var stopIndex = startIndexB + subStride;
                var realStartA = array[startIndexA];
                var imagStartB = array[startIndexB];
                array[startIndexA] = realStartA + imagStartB;
                array[midIndexA] *= 2;
                array[startIndexB] = realStartA - imagStartB;
                array[midIndexB] *= 2;
                var c = cosIncrement;
                var s = -sinIncrement;
                var cPrev = 1.0;
                var sPrev = 0.0;
                for (var index = 1; index < midSubStride; index++) {
                    var indexA0 = startIndexA + index;
                    var indexA1 = startIndexB - index;
                    var indexB0 = startIndexB + index;
                    var indexB1 = stopIndex - index;
                    var real0 = array[indexA0];
                    var real1 = array[indexA1];
                    var imag0 = array[indexB0];
                    var imag1 = array[indexB1];
                    var tempA = real0 - real1;
                    var tempB = imag0 + imag1;
                    array[indexA0] = real0 + real1;
                    array[indexA1] = imag1 - imag0;
                    array[indexB0] = tempA * c - tempB * s;
                    array[indexB1] = tempB * c + tempA * s;
                    var cTemp = oscillatorMultiplier * c - cPrev;
                    var sTemp = oscillatorMultiplier * s - sPrev;
                    cPrev = c;
                    sPrev = s;
                    c = cTemp;
                    s = sTemp;
                }
            }
        }
        for (var index = 0; index < fullArrayLength; index += 4) {
            var index1 = index + 1;
            var index2 = index + 2;
            var index3 = index + 3;
            var real0 = array[index];
            var real1 = array[index1] * 2;
            var imag2 = array[index2];
            var imag3 = array[index3] * 2;
            var tempA = real0 + imag2;
            var tempB = real0 - imag2;
            array[index] = tempA + real1;
            array[index1] = tempA - real1;
            array[index2] = tempB + imag3;
            array[index3] = tempB - imag3;
        }
        reverseIndexBits(array);
    }
    FFT.inverseRealFourierTransform = inverseRealFourierTransform;
})(FFT || (FFT = {}));
var beepbox;
(function (beepbox) {
    var Config = (function () {
        function Config() {
        }
        Config._centerWave = function (wave) {
            var sum = 0.0;
            for (var i = 0; i < wave.length; i++)
                sum += wave[i];
            var average = sum / wave.length;
            for (var i = 0; i < wave.length; i++)
                wave[i] -= average;
            return new Float64Array(wave);
        };
        Config.getDrumWave = function (index) {
            var wave = Config._drumWaves[index];
            if (wave == null) {
                wave = new Float32Array(32768);
                Config._drumWaves[index] = wave;
                if (index == 0) {
                    var drumBuffer = 1;
                    for (var i = 0; i < 32768; i++) {
                        wave[i] = (drumBuffer & 1) * 2.0 - 1.0;
                        var newBuffer = drumBuffer >> 1;
                        if (((drumBuffer + newBuffer) & 1) == 1) {
                            newBuffer += 1 << 14;
                        }
                        drumBuffer = newBuffer;
                    }
                }
                else if (index == 1) {
                    for (var i = 0; i < 32768; i++) {
                        wave[i] = Math.random() * 2.0 - 1.0;
                    }
                }
                else if (index == 2) {
                    var drumBuffer = 1;
                    for (var i = 0; i < 32768; i++) {
                        wave[i] = (drumBuffer & 1) * 2.0 - 1.0;
                        var newBuffer = drumBuffer >> 1;
                        if (((drumBuffer + newBuffer) & 1) == 1) {
                            newBuffer += 2 << 14;
                        }
                        drumBuffer = newBuffer;
                    }
                }
				else if (index == 3) {
                    var drumBuffer = 1;
                    for (var i = 0; i < 32767; i++) {
                        wave[i] = (drumBuffer & 1) * 2.0 - 1.0;
                        var newBuffer = drumBuffer >> 2;
                        if (((drumBuffer + newBuffer) & 1) == 1) {
                            newBuffer += 4 << 14;
                        }
                        drumBuffer = newBuffer;
                    }
                }
                else if (index == 4) {
                    var drumBuffer = 1;
                    for (var i = 0; i < 32768; i++) {
                        wave[i] = (drumBuffer & 1) * 2.0 - 1.0;
                        var newBuffer = drumBuffer >> 1;
                        if (((drumBuffer + newBuffer) & 1) == 1) {
                            newBuffer += 10 << 2;
                        }
                        drumBuffer = newBuffer;
                    }
                }
                else if (index == 5) {
                    for (var i = 1 << 10; i < (1 << 11); i++) {
                        var amplitude = 2.0;
                        var radians = Math.random() * Math.PI * 2.0;
                        wave[i] = Math.cos(radians) * amplitude;
                        wave[32768 - i] = Math.sin(radians) * amplitude;
                    }
                    for (var i = 1 << 11; i < (1 << 14); i++) {
                        var amplitude = 0.25;
                        var radians = Math.random() * Math.PI * 2.0;
                        wave[i] = Math.cos(radians) * amplitude;
                        wave[32768 - i] = Math.sin(radians) * amplitude;
                    }
                    FFT.inverseRealFourierTransform(wave);
                    FFT.scaleElementsByFactor(wave, 1.0 / Math.sqrt(wave.length));
                }
				else if (index == 6) {
                    for (var i = 1 << 1; i < (1 << 10); i++) {
                        var amplitude = 2.0;
                        var radians = Math.random() * Math.PI * 2.0;
                        wave[i] = Math.cos(radians) * amplitude;
                        wave[32768 - i] = Math.sin(radians) * amplitude;
                    }
                    for (var i = 1 << 110; i < (0 << 14); i++) {
                        var amplitude = 0.5;
                        var radians = Math.random() * Math.PI * 2.0;
                        wave[i] = Math.cos(radians) * amplitude;
                        wave[32768 - i] = Math.sin(radians) * amplitude;
                    }

                    FFT.inverseRealFourierTransform(wave);
                    FFT.scaleElementsByFactor(wave, 1.0 / Math.sqrt(wave.length));
                }
                else if (index == 7) {
                    var drumBuffer = 1;
                    for (var i = 0; i < 32768; i++) {
                        wave[i] = (drumBuffer & 1) * 4.0 * Math.random(1, 15);
                        var newBuffer = drumBuffer >> 1;
                        if (((drumBuffer + newBuffer) & 1) == 1) {
                            newBuffer += 15 << 2;
                        }
                        drumBuffer = newBuffer;
                    }
				}
					else {
                    throw new Error("Unrecognized drum index: " + index);
                }
            }
            return wave;
        };
        return Config;
    }());
    Config.aSettingsNames = ["Basic", "Advanced"];
	aListHidden = ["hidden", "visible"]
	Config.scaleNames = ["easy :)", "easy :(", "island :)", "island :(", "blues :)", "blues :(", "normal :)", "normal :(", "dbl harmonic :)", "dbl harmonic :(", "enigma", "expert", "base note", "beep bishop", "challenge", "enigma+"];
    Config.scaleFlags = [
        [true, false, true, false, true, false, false, true, false, true, false, false],
        [true, false, false, true, false, true, false, true, false, false, true, false],
        [true, false, false, false, true, true, false, true, false, false, false, true],
        [true, true, false, true, false, false, false, true, true, false, false, false],
        [true, false, true, true, true, false, false, true, false, true, false, false],
        [true, false, false, true, false, true, true, true, false, false, true, false],
        [true, false, true, false, true, true, false, true, false, true, false, true],
        [true, false, true, true, false, true, false, true, true, false, true, false],
        [true, true, false, false, true, true, false, true, true, false, false, true],
        [true, false, true, true, false, false, true, true, true, false, false, true],
        [true, false, true, false, true, false, true, false, true, false, true, false],
        [true, true, true, true, true, true, true, true, true, true, true, true],
		[true, false, false, false, false, false, false, false, false, false, false, false],
		[true, true, false, true, true, true, true, true, true, false, true, false],
		[false, true, true, true, true, true, true, true, true, true, true, true],
		[true, true, false, true, true, false, true, true, false, true, true, false],
    ];
    Config.pianoScaleFlags = [true, false, true, false, true, true, false, true, false, true, false, true];
    Config.blackKeyNameParents = [-1, 1, -1, 1, -1, 1, -1, -1, 1, -1, 1, -1];
    Config.pitchNames = ["C", null, "D", null, "E", "F", null, "G", null, "A", null, "B"];
	
	Config.themeNames = ["Default", "Openbox", "Snowy", "Cinnamon Roll [!]", "Ocean", "Rainbow [!]", "Float [!]", "Windows", "Grassland", "Dessert", "Kahootiest", "Beam to the Bit [!]", "Pretty Egg", "Poniryoshka", "Gameboy [!]", "Woodkid", "Midnight", "Snedbox"];
	
	volumeColorPallet =            ["#777777", "#c4ffa3", "#42dcff", "#ba8418", "#090b3a", "#ff00cb", "#878787", "#15a0db", "#74bc21", "#ff0000", "#66bf39", "#fefe00", "#f01d7a", "#ffc100", "#8bac0f", "#ef3027", "#aa5599", "#a53a3d", "#ffffff"]
	sliderOneColorPallet =         ["#9900cc", "#00ff00", "#ffffff", "#ba8418", "#5982ff", "#ff0000", "#ffffff", "#2779c2", "#a0d168", "#ff6254", "#ff3355", "#fefe00", "#6b003a", "#4b4b4b", "#9bbc0f", "#e83c4e", "#445566", "#a53a3d", "#ffffff"]
	sliderOctaveColorPallet =      ["#444444", "#00ff00", "#a5eeff", "#e59900", "#4449a3", "#43ff00", "#ffffff", "#295294", "#74bc21", "#ff5e3a", "#eb670f", "#0001fc", "#ffb1f4", "#5f4c99", "#9bbc0f", "#ef3027", "#444444", "#444444", "#ffffff"]
	sliderOctaveNotchColorPallet = ["#886644", "#ffffff", "#cefffd", "#ffff25", "#3dffdb", "#0400ff", "#c9c9c9", "#fdd01d", "#20330a", "#fff570", "#ff3355", "#fa0103", "#b4001b", "#ff8291", "#8bac0f", "#ffedca", "#aa5599", "#a53a3d", "#ffffff"]
	buttonColorPallet =            ["#ffffff", "#00ff00", "#42dcff", "#ffff25", "#4449a3", "#f6ff00", "#000000", "#fdd01d", "#69c400", "#fffc5b", "#66bf39", "#fefe00", "#75093e", "#818383", "#8bac0f", "#ffedca", "#000000", "#ffffff", "#ffffff"]
	
	baseNoteColorPallet =           ["#886644", "#c4ffa3", "#eafffe", "#f5bb00", "#090b3a", "#ffaaaa", "#ffffff", "#da4e2a", "#20330a", "#fffc5b", "#45a3e5", "#ffffff", "#fffafa", "#1a2844", "#9bbc0f", "#fff6fe", "#222222", "#886644", "#ffffa0"]
	secondNoteColorPallet =         ["#444444", "#444444", "#444444", "#f5bb00", "#444444", "#ffceaa", "#ededed", "#444444", "#444444", "#444444", "#444444", "#ff9b9b", "#444444", "#444444", "#9bbc0f", "#41323b", "#222222", "#444444", "#ffffa0"]
	thirdNoteColorPallet =          ["#444444", "#444444", "#444444", "#f5bb00", "#444444", "#ffdfaa", "#cecece", "#444444", "#444444", "#444444", "#444444", "#ff9b9b", "#444444", "#444444", "#9bbc0f", "#41323b", "#222222", "#444444", "#ffffa0"]
	fourthNoteColorPallet =         ["#444444", "#444444", "#444444", "#f5bb00", "#444444", "#fff5aa", "#bababa", "#444444", "#444444", "#444444", "#444444", "#ff9b9b", "#444444", "#444444", "#8bac0f", "#41323b", "#222222", "#444444", "#ffffa0"]
	sixthNoteColorPallet =          ["#444444", "#444444", "#444444", "#f5bb00", "#444444", "#e8ffaa", "#afafaf", "#444444", "#444444", "#444444", "#444444", "#ffffff", "#444444", "#faf4c3", "#8bac0f", "#41323b", "#222222", "#10997e", "#ffffa0"]
	seventhNoteColorPallet =        ["#444444", "#444444", "#444444", "#f5bb00", "#444444", "#bfffb2", "#a5a5a5", "#444444", "#444444", "#444444", "#444444", "#fcff9b", "#444444", "#444444", "#8bac0f", "#41323b", "#222222", "#444444", "#ffffa0"]
	eigthNoteColorPallet =          ["#444444", "#444444", "#444444", "#f5bb00", "#444444", "#b2ffc8", "#999999", "#444444", "#444444", "#444444", "#444444", "#fcff9b", "#444444", "#444444", "#306230", "#41323b", "#222222", "#444444", "#ffffa0"]
	fifthNoteColorPallet =          ["#446688", "#96fffb", "#b7f1ff", "#f5bb00", "#3f669b", "#b2ffe4", "#8e8e8e", "#5d9511", "#74bc21", "#ff5e3a", "#864cbf", "#fcff9b", "#ff91ce", "#dabbe6", "#306230", "#fff6fe", "#444444", "#60389b", "#ffffa0"]
	ninthNoteColorPallet =          ["#444444", "#444444", "#444444", "#f5bb00", "#444444", "#b2f3ff", "#828282", "#444444", "#444444", "#444444", "#444444", "#ffffff", "#444444", "#444444", "#306230", "#41323b", "#222222", "#444444", "#ffffa0"]
	tenNoteColorPallet =            ["#444444", "#444444", "#444444", "#f5bb00", "#444444", "#b2b3ff", "#777777", "#444444", "#444444", "#444444", "#444444", "#aaafff", "#444444", "#444444", "#0f380f", "#41323b", "#222222", "#444444", "#ffffa0"]
	elevenNoteColorPallet =         ["#444444", "#444444", "#444444", "#f5bb00", "#444444", "#e0b2ff", "#565656", "#444444", "#444444", "#444444", "#444444", "#aaafff", "#444444", "#444444", "#0f380f", "#41323b", "#222222", "#444444", "#ffffa0"]
	twelveNoteColorPallet =         ["#444444", "#444444", "#444444", "#f5bb00", "#444444", "#ffafe9", "#282828", "#444444", "#444444", "#444444", "#444444", "#aaafff", "#444444", "#444444", "#0f380f", "#41323b", "#222222", "#444444", "#ffffa0"]
	
	Config.keyNames = ["B", "A#", "A", "G#", "G", "F#", "F", "E", "D#", "D", "C#", "C"];
    Config.keyTransposes = [23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12];
    Config.tempoNames = ["speed1", "speed2", "speed3", "speed4", "speed5", "speed6", "speed7", "speed8", "speed9", "speed10", "speed11", "speed12", "speed13", "speed14", "speed15", "speed16", "speed17", "speed18", "speed19", "speed20", "speed21", "speed22", "speed23", "speed24", "speed25", "speed26"];
    Config.reverbRange = 5;
	Config.blendRange = 4;
	Config.riffRange = 11;
	Config.decayslRange = 4;
    Config.beatsPerBarMin = 1;
    Config.beatsPerBarMax = 16;
    Config.barCountMin = 1;
    Config.barCountMax = 255;
    Config.patternsPerChannelMin = 1;
    Config.patternsPerChannelMax = 64;
    Config.instrumentsPerChannelMin = 1;
    Config.instrumentsPerChannelMax = 64;
    Config.partNames = ["÷·3 (triplets)", "÷·4 (standard)", "÷·6", "÷·8", "÷·16 (arpfest)", "÷·12 (smaller arpfest)", "÷·9 (ninths)", "÷·5 (fifths)", "÷·50 (fiftieths)", "÷·24 (larger arpfest)"];
    Config.partCounts = [3, 4, 6, 8, 16, 12, 9, 5, 50, 24];
    Config.waveNames = ["triangle", "square", "pulse wide", "pulse narrow", "sawtooth", "double saw", "double pulse", "spiky", "plateau", "glitch", "10% pulse", "sunsoft bass", "loud pulse", "sax", "guitar", "sine", "atari bass", "atari pulse", "1% pulse", "curved sawtooth", "viola", "brass", "acoustic bass", "lyre", "ramp pulse"];
    Config.waveVolumes = [1.0, 0.5, 0.5, 0.5, 0.65, 0.5, 0.4, 0.4, 0.94, 0.5, 0.5, 1.0, 0.6, 0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.2, 0.2];
    Config.drumNames = ["retro", "white", "periodic", "detuned periodic", "shine", "hollow", "deep", "cutter"];
    Config.drumVolumes = [0.25, 1.0, 0.4, 0.3, 0.3, 1.5, 1.5, 0.25];
    Config.drumPitchRoots = [69, 69, 69, 69, 69, 96, 120, 96];
    Config.drumPitchFilterMult = [100.0, 8.0, 100.0, 100.0, 100.0, 1.0, 100.0, 100.0];
    Config.drumWaveIsSoft = [false, true, false, false, false, true, true];
    Config.filterNames = ["sustain sharp", "sustain medium", "sustain soft", "decay sharp", "decay medium", "decay soft", "decay drawn", "fade sharp", "fade medium", "fade soft", "ring", "muffled", "submerged", "shift", "overtone", "woosh"];
    Config.filterBases = [2.0, 3.5, 5.0, 1.0, 2.5, 4.0, 1.0, 5.0, 7.5, 10.0, -1.0, 4.0, 6.0, 0.0, 1.0, 2.0];
    Config.filterDecays = [0.0, 0.0, 0.0, 10.0, 7.0, 4.0, 0.5, 0.0, 0.0, 0.0, 0.2, 0.2, 0.3, 0.0, 0.0, 0.0];
	Config.filterFades = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -3.0, 10.0, 7.0, 4.0, 0.0, 0.0, 0.0, 0.0, 0.0, 6.0];
    Config.filterVolumes = [0.4, 0.7, 1.0, 0.5, 0.75, 1.0, 0.5, 0.4, 0.7, 1.0, 0.5, 0.75, 0.4, 0.4, 1.0, 0.5];
    Config.envelopeNames = ["seamless", "sudden", "smooth", "slide", "trill", "click", "bow"];
    Config.effectNames = ["none", "vibrato light", "vibrato delayed", "vibrato heavy", "tremolo light", "tremolo heavy", "alien", "stutter", "strum"];
    Config.effectVibratos = [0.0, 0.15, 0.3, 0.45, 0.0, 0.0, 1.0, 0.0, 0.05];
    Config.effectTremolos = [0.0, 0.0, 0.0, 0.0, 0.25, 0.5, 0.0, 1.0, 0.025];
    Config.effectVibratoDelays = [0, 0, 3, 0, 0, 0, 0, 0];
    Config.chorusNames = ["union", "shimmer", "hum", "honky tonk", "dissonant", "fifths", "octaves", "spinner", "detune", "bowed", "rising", "vibrate", "fourths", "bass", "dirty", "stationary", "union harmony"];
    Config.chorusIntervals = [0.0, 0.02, 0.05, 0.1, 0.25, 3.5, 6, 0.02, 0.0, 0.02, 1.0, 3.5, 4, 0, 0.0, 3.5, 0.0];
    Config.chorusOffsets = [0.0, 0.0, 0.0, 0.0, 0.0, 3.5, 6, 0.0, 0.25, 0.0, 0.7, 7, 4, -7, 0.1, 0.0, 0.0];
    Config.chorusVolumes = [0.9, 0.9, 1.0, 1.0, 0.95, 0.95, 0.9, 1.0, 1.0, 1.0, 0.95, 0.975, 0.95, 1.0, 0.975, 0.9, 1.0];
    Config.chorusHarmonizes = [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true];
    Config.harmNames = [false, true];
	Config.offOneNames = ["none", "pitch 4",  "pitch 3",  "pitch 2",  "pitch 1", "bass 1", "bass 2", "bass 3", "bass 4"];
	Config.offOneValues = [0.0, 24.0, 18.0, 12.0, 6.0, -6.0, -12.0, -18.0, -24.0];
	Config.volumeNames = ["loudest", "loud", "medium", "quiet", "quietest", "mute"];
    Config.volumeValues = [0.0, 0.5, 1.0, 1.5, 2.0, -1.0];
    Config.pitchChannelColorsDim = ["#0099a1", "#439143", "#a1a100", "#c75000", "#d020d0", "#492184"];
    Config.pitchChannelColorsBright = ["#25f3ff", "#44ff44", "#ffff25", "#ff9752", "#ff90ff", "#7500c4"];
    Config.pitchNoteColorsDim = ["#0099a1", "#439143", "#a1a100", "#c75000", "#d020d0", "#492184"];
    Config.pitchNoteColorsBright = ["#25f3ff", "#44ff44", "#ffff25", "#ff9752", "#ff90ff", "#7500c4"];
    Config.drumChannelColorsDim = ["#991010", "#aaaaaa", "#5869BD"];
    Config.drumChannelColorsBright = ["#ff1616", "#ffffff", "#768DFC"];
    Config.drumNoteColorsDim = ["#991010", "#aaaaaa", "#5869BD"];
    Config.drumNoteColorsBright = ["#ff1616", "#ffffff", "#768DFC"];
    Config.drumInterval = 6;
    Config.drumCount = 12;
    Config.pitchCount = 37;
    Config.maxPitch = 84;
    Config.pitchChannelCountMin = 0;
    Config.pitchChannelCountMax = 6;
    Config.drumChannelCountMin = 0;
    Config.drumChannelCountMax = 3;
    
	Config.waves = [
        Config._centerWave([1.0 / 15.0, 3.0 / 15.0, 5.0 / 15.0, 7.0 / 15.0, 9.0 / 15.0, 11.0 / 15.0, 13.0 / 15.0, 15.0 / 15.0, 15.0 / 15.0, 13.0 / 15.0, 11.0 / 15.0, 9.0 / 15.0, 7.0 / 15.0, 5.0 / 15.0, 3.0 / 15.0, 1.0 / 15.0, -1.0 / 15.0, -3.0 / 15.0, -5.0 / 15.0, -7.0 / 15.0, -9.0 / 15.0, -11.0 / 15.0, -13.0 / 15.0, -15.0 / 15.0, -15.0 / 15.0, -13.0 / 15.0, -11.0 / 15.0, -9.0 / 15.0, -7.0 / 15.0, -5.0 / 15.0, -3.0 / 15.0, -1.0 / 15.0]),
        Config._centerWave([1.0, -1.0]),
        Config._centerWave([1.0, -1.0, -1.0, -1.0]),
        Config._centerWave([1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0]),
        Config._centerWave([1.0 / 31.0, 3.0 / 31.0, 5.0 / 31.0, 7.0 / 31.0, 9.0 / 31.0, 11.0 / 31.0, 13.0 / 31.0, 15.0 / 31.0, 17.0 / 31.0, 19.0 / 31.0, 21.0 / 31.0, 23.0 / 31.0, 25.0 / 31.0, 27.0 / 31.0, 29.0 / 31.0, 31.0 / 31.0, -31.0 / 31.0, -29.0 / 31.0, -27.0 / 31.0, -25.0 / 31.0, -23.0 / 31.0, -21.0 / 31.0, -19.0 / 31.0, -17.0 / 31.0, -15.0 / 31.0, -13.0 / 31.0, -11.0 / 31.0, -9.0 / 31.0, -7.0 / 31.0, -5.0 / 31.0, -3.0 / 31.0, -1.0 / 31.0]),
        Config._centerWave([0.0, -0.2, -0.4, -0.6, -0.8, -1.0, 1.0, -0.8, -0.6, -0.4, -0.2, 1.0, 0.8, 0.6, 0.4, 0.2]),
        Config._centerWave([1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0]),
        Config._centerWave([1.0, -1.0, 1.0, -1.0, 1.0, 0.0]),
        Config._centerWave([0.0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.95, 0.9, 0.85, 0.8, 0.7, 0.6, 0.5, 0.4, 0.2, 0.0, -0.2, -0.4, -0.5, -0.6, -0.7, -0.8, -0.85, -0.9, -0.95, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -0.95, -0.9, -0.85, -0.8, -0.7, -0.6, -0.5, -0.4, -0.2]),
		Config._centerWave([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0,1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0]),
		Config._centerWave([1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0]),
		Config._centerWave([0.0, 0.1875, 0.3125, 0.5625, 0.5, 0.75, 0.875, 1.0, 1.0, 0.6875, 0.5, 0.625, 0.625, 0.5, 0.375, 0.5625, 0.4375, 0.5625, 0.4375, 0.4375, 0.3125, 0.1875, 0.1875, 0.375, 0.5625, 0.5625, 0.5625, 0.5625, 0.5625, 0.4375, 0.25, 0.0]),
		Config._centerWave([1.0, 0.7, 0.1, 0.1, 0, 0, 0, 0, 0, 0.1, 0.2, 0.15, 0.25, 0.125, 0.215, 0.345, 4.0]),
		Config._centerWave([1.0 / 15.0, 3.0 / 15.0, 5.0 / 15.0, 9.0, 0.06]),
		Config._centerWave([-0.5, 3.5, 3.0, -0.5, -0.25, -1.0]),
		Config._centerWave([0.0, 0.05, 0.125, 0.2, 0.25, 0.3, 0.425, 0.475, 0.525, 0.625, 0.675, 0.725, 0.775, 0.8, 0.825, 0.875, 0.9, 0.925, 0.95, 0.975, 0.98, 0.99, 0.995, 1, 0.995, 0.99, 0.98, 0.975, 0.95, 0.925, 0.9, 0.875, 0.825, 0.8, 0.775, 0.725, 0.675, 0.625, 0.525, 0.475, 0.425, 0.3, 0.25, 0.2, 0.125, 0.05, 0.0, -0.05, -0.125, -0.2, -0.25, -0.3, -0.425, -0.475, -0.525, -0.625, -0.675, -0.725, -0.775, -0.8, -0.825, -0.875, -0.9, -0.925, -0.95, -0.975, -0.98, -0.99, -0.995, -1, -0.995, -0.99, -0.98, -0.975, -0.95, -0.925, -0.9, -0.875, -0.825, -0.8, -0.775, -0.725, -0.675, -0.625, -0.525, -0.475, -0.425, -0.3, -0.25, -0.2, -0.125, -0.05]),
		Config._centerWave([1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0]),
		Config._centerWave([0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]),
		Config._centerWave([1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0]),
		Config._centerWave([1.0, 1.0 / 2.0, 1.0 / 3.0, 1.0 / 4.0]),
		Config._centerWave([-0.9, -1.0, -0.85, -0.775, -0.7, -0.6, -0.5, -0.4, -0.325, -0.225, -0.2, -0.125, -0.1, -0.11, -0.125, -0.15, -0.175, -0.18, -0.2, -0.21, -0.22, -0.21, -0.2, -0.175, -0.15, -0.1, -0.5, 0.75, 0.11, 0.175, 0.2, 0.25, 0.26, 0.275, 0.26, 0.25, 0.225, 0.2, 0.19, 0.18, 0.19, 0.2, 0.21, 0.22, 0.23, 0.24, 0.25, 0.26, 0.275, 0.28, 0.29, 0.3, 0.29, 0.28, 0.27, 0.26, 0.25, 0.225, 0.2, 0.175, 0.15, 0.1, 0.075, 0.0, -0.01, -0.025, 0.025, 0.075, 0.2, 0.3, 0.475, 0.6, 0.75, 0.85, 0.85, 1.0, 0.99, 0.95, 0.8, 0.675, 0.475, 0.275, 0.01, -0.15, -0.3, -0.475, -0.5, -0.6, -0.71, -0.81, -0.9, -1.0, -0.9]),
		Config._centerWave([-1.0, -0.95, -0.975, -0.9, -0.85, -0.8, -0.775, -0.65, -0.6, -0.5, -0.475, -0.35, -0.275, -0.2, -0.125, -0.05, 0.0, 0.075, 0.125, 0.15, 0.20, 0.21, 0.225, 0.25, 0.225, 0.21, 0.20, 0.19, 0.175, 0.125, 0.10, 0.075, 0.06, 0.05, 0.04, 0.025, 0.04, 0.05, 0.10, 0.15, 0.225, 0.325, 0.425, 0.575, 0.70, 0.85, 0.95, 1.0, 0.9, 0.675, 0.375, 0.2, 0.275, 0.4, 0.5, 0.55, 0.6, 0.625, 0.65, 0.65, 0.65, 0.65, 0.64, 0.6, 0.55, 0.5, 0.4, 0.325, 0.25, 0.15, 0.05, -0.05, -0.15, -0.275, -0.35, -0.45, -0.55, -0.65, -0.7, -0.78, -0.825, -0.9, -0.925, -0.95, -0.975]),
		Config._centerWave([1.0, 0.0, 0.1, -0.1, -0.2, -0.4, -0.3, -1.0]),
		Config._centerWave([1.0, -1.0, 4.0, 2.15, 4.13, 5.15, 0.0, -0.05, 1.0]),
		Config._centerWave([6.1, -2.9, 1.4, -2.9]),


	];
    Config._drumWaves = [null, null, null, null, null];
    beepbox.Config = Config;
    var BitFieldReader = (function () {
        function BitFieldReader(base64CharCodeToInt, source, startIndex, stopIndex) {
            this._bits = [];
            this._readIndex = 0;
            for (var i = startIndex; i < stopIndex; i++) {
                var value = base64CharCodeToInt[source.charCodeAt(i)];
                this._bits.push((value >> 5) & 0x1);
                this._bits.push((value >> 4) & 0x1);
                this._bits.push((value >> 3) & 0x1);
                this._bits.push((value >> 2) & 0x1);
                this._bits.push((value >> 1) & 0x1);
                this._bits.push(value & 0x1);
            }
        }
        BitFieldReader.prototype.read = function (bitCount) {
            var result = 0;
            while (bitCount > 0) {
                result = result << 1;
                result += this._bits[this._readIndex++];
                bitCount--;
            }
            return result;
        };
        BitFieldReader.prototype.readLongTail = function (minValue, minBits) {
            var result = minValue;
            var numBits = minBits;
            while (this._bits[this._readIndex++]) {
                result += 1 << numBits;
                numBits++;
            }
            while (numBits > 0) {
                numBits--;
                if (this._bits[this._readIndex++]) {
                    result += 1 << numBits;
                }
            }
            return result;
        };
        BitFieldReader.prototype.readPartDuration = function () {
            return this.readLongTail(1, 2);
        };
        BitFieldReader.prototype.readPinCount = function () {
            return this.readLongTail(1, 0);
        };
        BitFieldReader.prototype.readPitchInterval = function () {
            if (this.read(1)) {
                return -this.readLongTail(1, 3);
            }
            else {
                return this.readLongTail(1, 3);
            }
        };
        return BitFieldReader;
    }());
    var BitFieldWriter = (function () {
        function BitFieldWriter() {
            this._bits = [];
        }
        BitFieldWriter.prototype.write = function (bitCount, value) {
            bitCount--;
            while (bitCount >= 0) {
                this._bits.push((value >>> bitCount) & 1);
                bitCount--;
            }
        };
        BitFieldWriter.prototype.writeLongTail = function (minValue, minBits, value) {
            if (value < minValue)
                throw new Error("value out of bounds");
            value -= minValue;
            var numBits = minBits;
            while (value >= (1 << numBits)) {
                this._bits.push(1);
                value -= 1 << numBits;
                numBits++;
            }
            this._bits.push(0);
            while (numBits > 0) {
                numBits--;
                this._bits.push((value >>> numBits) & 1);
            }
        };
        BitFieldWriter.prototype.writePartDuration = function (value) {
            this.writeLongTail(1, 2, value);
        };
        BitFieldWriter.prototype.writePinCount = function (value) {
            this.writeLongTail(1, 0, value);
        };
        BitFieldWriter.prototype.writePitchInterval = function (value) {
            if (value < 0) {
                this.write(1, 1);
                this.writeLongTail(1, 3, -value);
            }
            else {
                this.write(1, 0);
                this.writeLongTail(1, 3, value);
            }
        };
        BitFieldWriter.prototype.concat = function (other) {
            this._bits = this._bits.concat(other._bits);
        };
        BitFieldWriter.prototype.encodeBase64 = function (base64IntToCharCode, buffer) {
            for (var i = 0; i < this._bits.length; i += 6) {
                var value = (this._bits[i] << 5) | (this._bits[i + 1] << 4) | (this._bits[i + 2] << 3) | (this._bits[i + 3] << 2) | (this._bits[i + 4] << 1) | this._bits[i + 5];
                buffer.push(base64IntToCharCode[value]);
            }
            return buffer;
        };
        BitFieldWriter.prototype.lengthBase64 = function () {
            return Math.ceil(this._bits.length / 6);
        };
        return BitFieldWriter;
    }());
    function makeNotePin(interval, time, volume) {
        return { interval: interval, time: time, volume: volume };
    }
    beepbox.makeNotePin = makeNotePin;
    function makeNote(pitch, start, end, volume, fadeout) {
        if (fadeout === void 0) { fadeout = false; }
        return {
            pitches: [pitch],
            pins: [makeNotePin(0, 0, volume), makeNotePin(0, end - start, fadeout ? 0 : volume)],
            start: start,
            end: end,
        };
    }
    beepbox.makeNote = makeNote;
    function filledArray(count, value) {
        var array = [];
        for (var i = 0; i < count; i++)
            array[i] = value;
        return array;
    }
    beepbox.filledArray = filledArray;
    var BarPattern = (function () {
        function BarPattern() {
            this.notes = [];
            this.instrument = 0;
        }
        BarPattern.prototype.cloneNotes = function () {
            var result = [];
            for (var _i = 0, _a = this.notes; _i < _a.length; _i++) {
                var oldNote = _a[_i];
                var newNote = makeNote(-1, oldNote.start, oldNote.end, 3);
                newNote.pitches = oldNote.pitches.concat();
                newNote.pins = [];
                for (var _b = 0, _c = oldNote.pins; _b < _c.length; _b++) {
                    var oldPin = _c[_b];
                    newNote.pins.push(makeNotePin(oldPin.interval, oldPin.time, oldPin.volume));
                }
                result.push(newNote);
            }
            return result;
        };
        return BarPattern;
    }());
    beepbox.BarPattern = BarPattern;
    var Song = (function () {
        function Song(string) {
            if (string != undefined) {
                this.fromBase64String(string);
            }
            else {
                this.initToDefault();
            }
        }
        Song.prototype.getChannelCount = function () {
            return this.pitchChannelCount + this.drumChannelCount;
        };
        Song.prototype.getChannelIsDrum = function (channel) {
            return (channel >= this.pitchChannelCount);
        };
        Song.prototype.getChannelColorDim = function (channel) {
            return channel < this.pitchChannelCount ? Config.pitchChannelColorsDim[channel] : Config.drumChannelColorsDim[channel - this.pitchChannelCount];
        };
        Song.prototype.getChannelColorBright = function (channel) {
            return channel < this.pitchChannelCount ? Config.pitchChannelColorsBright[channel] : Config.drumChannelColorsBright[channel - this.pitchChannelCount];
        };
        Song.prototype.getNoteColorDim = function (channel) {
            return channel < this.pitchChannelCount ? Config.pitchNoteColorsDim[channel] : Config.drumNoteColorsDim[channel - this.pitchChannelCount];
        };
        Song.prototype.getNoteColorBright = function (channel) {
            return channel < this.pitchChannelCount ? Config.pitchNoteColorsBright[channel] : Config.drumNoteColorsBright[channel - this.pitchChannelCount];
        };
        Song.prototype.initToDefault = function () {
            this.channelPatterns = [
                [new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern()],
                [new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern()],
                [new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern()],
                [new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern()],
                [new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern(), new BarPattern()],
            ];
            this.channelBars = [
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            ];
            this.channelOctaves = [4, 3, 2, 1, 0];
            this.instrumentVolumes = [[0], [0], [0], [0], [0]];
            this.instrumentWaves = [[1], [1], [1], [1], [1]];
            this.instrumentFilters = [[0], [0], [0], [0], [1]];
            this.instrumentEnvelopes = [[1], [1], [1], [1], [1]];
            this.instrumentEffects = [[0], [0], [0], [0], [0]];
            this.instrumentChorus = [[0], [0], [0], [0], [0]];
			this.instrumentHarm = [[0], [0], [0], [0], [0]];
			this.instrumentOffOne = [[0], [0], [0], [0], [0]];
            this.scale = 0;
			this.aSettings = 0;
			this.theme = 0;
            this.key = Config.keyNames.length - 1;
            this.loopStart = 0;
            this.loopLength = 4;
            this.tempo = 7;
            this.reverb = 0;
			this.blend = 0;
			this.riff = 0;
			this.decaysl = 0;
			aValue = 0
            this.beatsPerBar = 8;
            this.barCount = 16;
            this.patternsPerChannel = 8;
            this.partsPerBeat = 4;
            this.instrumentsPerChannel = 1;
            this.pitchChannelCount = 4;
            this.drumChannelCount = 1;
			
        };
        Song.prototype.toBase64String = function () {
            var bits;
            var buffer = [];
            var base64IntToCharCode = Song._base64IntToCharCode;
            buffer.push(base64IntToCharCode[Song._latestVersion]);
            buffer.push(110, base64IntToCharCode[this.pitchChannelCount], base64IntToCharCode[this.drumChannelCount]);
            buffer.push(122, base64IntToCharCode[this.theme]);
			buffer.push(117, base64IntToCharCode[this.aSettings]);
			buffer.push(115, base64IntToCharCode[this.scale]);
            buffer.push(107, base64IntToCharCode[this.key]);
            buffer.push(108, base64IntToCharCode[this.loopStart >> 6], base64IntToCharCode[this.loopStart & 0x3f]);
            buffer.push(101, base64IntToCharCode[(this.loopLength - 1) >> 6], base64IntToCharCode[(this.loopLength - 1) & 0x3f]);
            buffer.push(116, base64IntToCharCode[this.tempo]);
            buffer.push(109, base64IntToCharCode[this.reverb]);
			buffer.push(120, base64IntToCharCode[this.blend]);
			buffer.push(121, base64IntToCharCode[this.riff]);
			buffer.push(67, base64IntToCharCode[this.decaysl]);
            buffer.push(97, base64IntToCharCode[this.beatsPerBar - 1]);
            buffer.push(103, base64IntToCharCode[(this.barCount - 1) >> 6], base64IntToCharCode[(this.barCount - 1) & 0x3f]);
            buffer.push(106, base64IntToCharCode[this.patternsPerChannel - 1]);
            buffer.push(105, base64IntToCharCode[this.instrumentsPerChannel - 1]);
            buffer.push(114, base64IntToCharCode[Config.partCounts.indexOf(this.partsPerBeat)]);
            buffer.push(119);
            for (var channel = 0; channel < this.getChannelCount(); channel++)
                for (var i = 0; i < this.instrumentsPerChannel; i++) {
                    buffer.push(base64IntToCharCode[this.instrumentWaves[channel][i]]);
                }
            buffer.push(102);
            for (var channel = 0; channel < this.getChannelCount(); channel++)
                for (var i = 0; i < this.instrumentsPerChannel; i++) {
                    buffer.push(base64IntToCharCode[this.instrumentFilters[channel][i]]);
                }
            buffer.push(100);
            for (var channel = 0; channel < this.getChannelCount(); channel++)
                for (var i = 0; i < this.instrumentsPerChannel; i++) {
                    buffer.push(base64IntToCharCode[this.instrumentEnvelopes[channel][i]]);
                }
            buffer.push(99);
            for (var channel = 0; channel < this.getChannelCount(); channel++)
                for (var i = 0; i < this.instrumentsPerChannel; i++) {
                    buffer.push(base64IntToCharCode[this.instrumentEffects[channel][i]]);
                }
            buffer.push(104);
            for (var channel = 0; channel < this.getChannelCount(); channel++)
                for (var i = 0; i < this.instrumentsPerChannel; i++) {
                    buffer.push(base64IntToCharCode[this.instrumentChorus[channel][i]]);
                }
			buffer.push(113);
            for (var channel = 0; channel < this.getChannelCount(); channel++)
                for (var i = 0; i < this.instrumentsPerChannel; i++) {
                    buffer.push(base64IntToCharCode[this.instrumentHarm[channel][i]]);
                }
			buffer.push(66);
            for (var channel = 0; channel < this.getChannelCount(); channel++)
                for (var i = 0; i < this.instrumentsPerChannel; i++) {
                    buffer.push(base64IntToCharCode[this.instrumentOffOne[channel][i]]);
                }
            buffer.push(118);
            for (var channel = 0; channel < this.getChannelCount(); channel++)
                for (var i = 0; i < this.instrumentsPerChannel; i++) {
                    buffer.push(base64IntToCharCode[this.instrumentVolumes[channel][i]]);
                }
            buffer.push(111);
            for (var channel = 0; channel < this.getChannelCount(); channel++) {
                buffer.push(base64IntToCharCode[this.channelOctaves[channel]]);
            }
            buffer.push(98);
            bits = new BitFieldWriter();
            var neededBits = 0;
            while ((1 << neededBits) < this.patternsPerChannel + 1)
                neededBits++;
            for (var channel = 0; channel < this.getChannelCount(); channel++)
                for (var i = 0; i < this.barCount; i++) {
                    bits.write(neededBits, this.channelBars[channel][i]);
                }
            bits.encodeBase64(base64IntToCharCode, buffer);
            buffer.push(112);
            bits = new BitFieldWriter();
            var neededInstrumentBits = 0;
            while ((1 << neededInstrumentBits) < this.instrumentsPerChannel)
                neededInstrumentBits++;
            for (var channel = 0; channel < this.getChannelCount(); channel++) {
                var isDrum = this.getChannelIsDrum(channel);
                var octaveOffset = isDrum ? 0 : this.channelOctaves[channel] * 12;
                var lastPitch = (isDrum ? 4 : 12) + octaveOffset;
                var recentPitches = isDrum ? [4, 6, 7, 2, 3, 8, 0, 10] : [12, 19, 24, 31, 36, 7, 0];
                var recentShapes = [];
                for (var i = 0; i < recentPitches.length; i++) {
                    recentPitches[i] += octaveOffset;
                }
                for (var _i = 0, _a = this.channelPatterns[channel]; _i < _a.length; _i++) {
                    var p = _a[_i];
                    bits.write(neededInstrumentBits, p.instrument);
                    if (p.notes.length > 0) {
                        bits.write(1, 1);
                        var curPart = 0;
                        for (var _b = 0, _c = p.notes; _b < _c.length; _b++) {
                            var t = _c[_b];
                            if (t.start > curPart) {
                                bits.write(2, 0);
                                bits.writePartDuration(t.start - curPart);
                            }
                            var shapeBits = new BitFieldWriter();
                            for (var i = 1; i < t.pitches.length; i++)
                                shapeBits.write(1, 1);
                            if (t.pitches.length < 4)
                                shapeBits.write(1, 0);
                            shapeBits.writePinCount(t.pins.length - 1);
                            shapeBits.write(2, t.pins[0].volume);
                            var shapePart = 0;
                            var startPitch = t.pitches[0];
                            var currentPitch = startPitch;
                            var pitchBends = [];
                            for (var i = 1; i < t.pins.length; i++) {
                                var pin = t.pins[i];
                                var nextPitch = startPitch + pin.interval;
                                if (currentPitch != nextPitch) {
                                    shapeBits.write(1, 1);
                                    pitchBends.push(nextPitch);
                                    currentPitch = nextPitch;
                                }
                                else {
                                    shapeBits.write(1, 0);
                                }
                                shapeBits.writePartDuration(pin.time - shapePart);
                                shapePart = pin.time;
                                shapeBits.write(2, pin.volume);
                            }
                            var shapeString = String.fromCharCode.apply(null, shapeBits.encodeBase64(base64IntToCharCode, []));
                            var shapeIndex = recentShapes.indexOf(shapeString);
                            if (shapeIndex == -1) {
                                bits.write(2, 1);
                                bits.concat(shapeBits);
                            }
                            else {
                                bits.write(1, 1);
                                bits.writeLongTail(0, 0, shapeIndex);
                                recentShapes.splice(shapeIndex, 1);
                            }
                            recentShapes.unshift(shapeString);
                            if (recentShapes.length > 10)
                                recentShapes.pop();
                            var allPitches = t.pitches.concat(pitchBends);
                            for (var i = 0; i < allPitches.length; i++) {
                                var pitch = allPitches[i];
                                var pitchIndex = recentPitches.indexOf(pitch);
                                if (pitchIndex == -1) {
                                    var interval = 0;
                                    var pitchIter = lastPitch;
                                    if (pitchIter < pitch) {
                                        while (pitchIter != pitch) {
                                            pitchIter++;
                                            if (recentPitches.indexOf(pitchIter) == -1)
                                                interval++;
                                        }
                                    }
                                    else {
                                        while (pitchIter != pitch) {
                                            pitchIter--;
                                            if (recentPitches.indexOf(pitchIter) == -1)
                                                interval--;
                                        }
                                    }
                                    bits.write(1, 0);
                                    bits.writePitchInterval(interval);
                                }
                                else {
                                    bits.write(1, 1);
                                    bits.write(3, pitchIndex);
                                    recentPitches.splice(pitchIndex, 1);
                                }
                                recentPitches.unshift(pitch);
                                if (recentPitches.length > 8)
                                    recentPitches.pop();
                                if (i == t.pitches.length - 1) {
                                    lastPitch = t.pitches[0];
                                }
                                else {
                                    lastPitch = pitch;
                                }
                            }
                            curPart = t.end;
                        }
                        if (curPart < this.beatsPerBar * this.partsPerBeat) {
                            bits.write(2, 0);
                            bits.writePartDuration(this.beatsPerBar * this.partsPerBeat - curPart);
                        }
                    }
                    else {
                        bits.write(1, 0);
                    }
                }
            }
            var stringLength = bits.lengthBase64();
            var digits = [];
            while (stringLength > 0) {
                digits.unshift(base64IntToCharCode[stringLength & 0x3f]);
                stringLength = stringLength >> 6;
            }
            buffer.push(base64IntToCharCode[digits.length]);
            Array.prototype.push.apply(buffer, digits);
            bits.encodeBase64(base64IntToCharCode, buffer);
            return String.fromCharCode.apply(null, buffer);
        };
        Song.prototype.fromBase64String = function (compressed) {
            if (compressed == null) {
                this.initToDefault();
                return;
            }
            var charIndex = 0;
            while (compressed.charCodeAt(charIndex) <= 32)
                charIndex++;
            if (compressed.charCodeAt(charIndex) == 35)
                charIndex++;
            if (compressed.charCodeAt(charIndex) == 123) {
                this.fromJsonObject(JSON.parse(charIndex == 0 ? compressed : compressed.substring(charIndex)));
                return;
            }
            this.initToDefault();
            var version = Song._base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
            if (version == -1 || version > Song._latestVersion || version < Song._oldestVersion)
                return;
            var beforeThree = version < 3;
            var beforeFour = version < 4;
            var beforeFive = version < 5;
            var base64CharCodeToInt = Song._base64CharCodeToInt;
            if (beforeThree)
                this.instrumentEnvelopes = [[0], [0], [0], [0]];
            if (beforeThree)
                this.instrumentFilters = [[0], [0], [0], [0]];
            if (beforeThree)
                this.instrumentHarm = [[0], [0], [0], [0]];
            if (beforeThree)
                this.instrumentWaves = [[1], [1], [1], [0]];
            while (charIndex < compressed.length) {
                var command = compressed.charCodeAt(charIndex++);
                var channel = void 0;
                if (command == 110) {
                    this.pitchChannelCount = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                    this.drumChannelCount = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                    this.pitchChannelCount = this._clip(Config.pitchChannelCountMin, Config.pitchChannelCountMax + 1, this.pitchChannelCount);
                    this.drumChannelCount = this._clip(Config.drumChannelCountMin, Config.drumChannelCountMax + 1, this.drumChannelCount);
                    var channelCount = this.pitchChannelCount + this.drumChannelCount;
                    for (var channel_1 = 0; channel_1 < channelCount; channel_1++) {
                        this.channelPatterns[channel_1] = [];
                        this.channelBars[channel_1] = [];
                        this.instrumentWaves[channel_1] = [];
                        this.instrumentFilters[channel_1] = [];
                        this.instrumentEnvelopes[channel_1] = [];
                        this.instrumentEffects[channel_1] = [];
                        this.instrumentChorus[channel_1] = [];
						this.instrumentHarm[channel_1] = [];
						this.instrumentOffOne[channel_1] = [];
                        this.instrumentVolumes[channel_1] = [];
                    }
                    this.channelPatterns.length = channelCount;
                    this.channelBars.length = channelCount;
                    this.channelOctaves.length = channelCount;
                    this.instrumentWaves.length = channelCount;
                    this.instrumentFilters.length = channelCount;
                    this.instrumentEnvelopes.length = channelCount;
                    this.instrumentEffects.length = channelCount;
                    this.instrumentChorus.length = channelCount;
					this.instrumentHarm.length = channelCount;
					this.instrumentOffOne.length = channelCount;
                    this.instrumentVolumes.length = channelCount;
                }
                else if (command == 122) {
                    this.theme = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                }
				else if (command == 117) {
                    this.aSettings = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                }
				else if (command == 115) {
                    this.scale = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                    if (beforeThree && this.scale == 10)
                        this.scale = 11;
                }
                else if (command == 107) {
                    this.key = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                }
                else if (command == 108) {
                    if (beforeFive) {
                        this.loopStart = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                    }
                    else {
                        this.loopStart = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                    }
                }
                else if (command == 101) {
                    if (beforeFive) {
                        this.loopLength = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                    }
                    else {
                        this.loopLength = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + 1;
                    }
                }
                else if (command == 116) {
                    if (beforeFour) {
                        this.tempo = [1, 4, 7, 10][base64CharCodeToInt[compressed.charCodeAt(charIndex++)]];
                    }
                    else {
                        this.tempo = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                    }
                    this.tempo = this._clip(0, Config.tempoNames.length, this.tempo);
                }
                else if (command == 109) {
                    this.reverb = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                    this.reverb = this._clip(0, Config.reverbRange, this.reverb);
                }
				else if (command == 120) {
                    this.blend = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                    this.blend = this._clip(0, Config.blendRange, this.blend);
                }
				else if (command == 121) {
                    this.riff = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                    this.riff = this._clip(0, Config.riffRange, this.riff);
                }
				else if (command == 67) {
                    this.decaysl = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                    this.decaysl = this._clip(0, Config.decayslRange, this.decaysl);
                }
                else if (command == 97) {
                    if (beforeThree) {
                        this.beatsPerBar = [6, 7, 8, 9, 10][base64CharCodeToInt[compressed.charCodeAt(charIndex++)]];
                    }
                    else {
                        this.beatsPerBar = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + 1;
                    }
                    this.beatsPerBar = Math.max(Config.beatsPerBarMin, Math.min(Config.beatsPerBarMax, this.beatsPerBar));
                }
                else if (command == 103) {
                    this.barCount = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + 1;
                    this.barCount = Math.max(Config.barCountMin, Math.min(Config.barCountMax, this.barCount));
                }
                else if (command == 106) {
                    this.patternsPerChannel = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + 1;
                    this.patternsPerChannel = Math.max(Config.patternsPerChannelMin, Math.min(Config.patternsPerChannelMax, this.patternsPerChannel));
                }
                else if (command == 105) {
                    this.instrumentsPerChannel = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + 1;
                    this.instrumentsPerChannel = Math.max(Config.instrumentsPerChannelMin, Math.min(Config.instrumentsPerChannelMax, this.instrumentsPerChannel));
                }
                else if (command == 114) {
                    this.partsPerBeat = Config.partCounts[base64CharCodeToInt[compressed.charCodeAt(charIndex++)]];
                }
                else if (command == 119) {
                    if (beforeThree) {
                        channel = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                        this.instrumentWaves[channel][0] = this._clip(0, Config.waveNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                    }
                    else {
                        for (channel = 0; channel < this.getChannelCount(); channel++) {
                            for (var i = 0; i < this.instrumentsPerChannel; i++) {
                                this.instrumentWaves[channel][i] = this._clip(0, i < this.pitchChannelCount ? Config.waveNames.length : Config.drumNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                            }
                        }
                    }
                }
                else if (command == 102) {
                    if (beforeThree) {
                        channel = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                        this.instrumentFilters[channel][0] = [0, 2, 3, 5][this._clip(0, Config.filterNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)])];
                    }
                    else {
                        for (channel = 0; channel < this.getChannelCount(); channel++) {
                            for (var i = 0; i < this.instrumentsPerChannel; i++) {
                                this.instrumentFilters[channel][i] = this._clip(0, Config.filterNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                            }
                        }
                    }
                }
                else if (command == 100) {
                    if (beforeThree) {
                        channel = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                        this.instrumentEnvelopes[channel][0] = this._clip(0, Config.envelopeNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                    }
                    else {
                        for (channel = 0; channel < this.getChannelCount(); channel++) {
                            for (var i = 0; i < this.instrumentsPerChannel; i++) {
                                this.instrumentEnvelopes[channel][i] = this._clip(0, Config.envelopeNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                            }
                        }
                    }
                }
                else if (command == 99) {
                    if (beforeThree) {
                        channel = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                        this.instrumentEffects[channel][0] = this._clip(0, Config.effectNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                        if (this.instrumentEffects[channel][0] == 1)
                            this.instrumentEffects[channel][0] = 3;
                        else if (this.instrumentEffects[channel][0] == 3)
                            this.instrumentEffects[channel][0] = 5;
                    }
                    else {
                        for (channel = 0; channel < this.getChannelCount(); channel++) {
                            for (var i = 0; i < this.instrumentsPerChannel; i++) {
                                this.instrumentEffects[channel][i] = this._clip(0, Config.effectNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                            }
                        }
                    }
                }
                else if (command == 104) {
                    if (beforeThree) {
                        channel = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                        this.instrumentChorus[channel][0] = this._clip(0, Config.chorusNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                    }
                    else {
                        for (channel = 0; channel < this.getChannelCount(); channel++) {
                            for (var i = 0; i < this.instrumentsPerChannel; i++) {
                                this.instrumentChorus[channel][i] = this._clip(0, Config.chorusNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                            }
                        }
                    }
                }
				
				else if (command == 113) {
                    if (beforeThree) {
                        channel = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                        this.instrumentHarm[channel][0] = [0, 2, 3, 5][this._clip(0, Config.harmNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)])];
                    }
                    else {
                        for (channel = 0; channel < this.getChannelCount(); channel++) {
                            for (var i = 0; i < this.instrumentsPerChannel; i++) {
                                this.instrumentHarm[channel][i] = this._clip(0, Config.harmNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                            }
                        }
                    }
                }
				
				else if (command == 66) {
                    if (beforeThree) {
                        channel = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                        this.instrumentOffOne[channel][0] = [0, 2, 3, 5][this._clip(0, Config.offOneNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)])];
                    }
                    else {
                        for (channel = 0; channel < this.getChannelCount(); channel++) {
                            for (var i = 0; i < this.instrumentsPerChannel; i++) {
                                this.instrumentOffOne[channel][i] = this._clip(0, Config.offOneNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                            }
                        }
                    }
                }
				
				
                else if (command == 118) {
                    if (beforeThree) {
                        channel = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                        this.instrumentVolumes[channel][0] = this._clip(0, Config.volumeNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                    }
                    else {
                        for (channel = 0; channel < this.getChannelCount(); channel++) {
                            for (var i = 0; i < this.instrumentsPerChannel; i++) {
                                this.instrumentVolumes[channel][i] = this._clip(0, Config.volumeNames.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                            }
                        }
                    }
                }
                else if (command == 111) {
                    if (beforeThree) {
                        channel = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                        this.channelOctaves[channel] = this._clip(0, 5, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                    }
                    else {
                        for (channel = 0; channel < this.getChannelCount(); channel++) {
                            this.channelOctaves[channel] = this._clip(0, 5, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                        }
                    }
                }
                else if (command == 98) {
                    var subStringLength = void 0;
                    if (beforeThree) {
                        channel = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                        var barCount = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                        subStringLength = Math.ceil(barCount * 0.5);
                        var bits = new BitFieldReader(base64CharCodeToInt, compressed, charIndex, charIndex + subStringLength);
                        for (var i = 0; i < barCount; i++) {
                            this.channelBars[channel][i] = bits.read(3) + 1;
                        }
                    }
                    else if (beforeFive) {
                        var neededBits = 0;
                        while ((1 << neededBits) < this.patternsPerChannel)
                            neededBits++;
                        subStringLength = Math.ceil(this.getChannelCount() * this.barCount * neededBits / 6);
                        var bits = new BitFieldReader(base64CharCodeToInt, compressed, charIndex, charIndex + subStringLength);
                        for (channel = 0; channel < this.getChannelCount(); channel++) {
                            this.channelBars[channel].length = this.barCount;
                            for (var i = 0; i < this.barCount; i++) {
                                this.channelBars[channel][i] = bits.read(neededBits) + 1;
                            }
                        }
                    }
                    else {
                        var neededBits2 = 0;
                        while ((1 << neededBits2) < this.patternsPerChannel + 1)
                            neededBits2++;
                        subStringLength = Math.ceil(this.getChannelCount() * this.barCount * neededBits2 / 6);
                        var bits = new BitFieldReader(base64CharCodeToInt, compressed, charIndex, charIndex + subStringLength);
                        for (channel = 0; channel < this.getChannelCount(); channel++) {
                            this.channelBars[channel].length = this.barCount;
                            for (var i = 0; i < this.barCount; i++) {
                                this.channelBars[channel][i] = bits.read(neededBits2);
                            }
                        }
                    }
                    charIndex += subStringLength;
                }
                else if (command == 112) {
                    var bitStringLength = 0;
                    if (beforeThree) {
                        channel = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                        charIndex++;
                        bitStringLength = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                        bitStringLength = bitStringLength << 6;
                        bitStringLength += base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                    }
                    else {
                        channel = 0;
                        var bitStringLengthLength = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                        while (bitStringLengthLength > 0) {
                            bitStringLength = bitStringLength << 6;
                            bitStringLength += base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                            bitStringLengthLength--;
                        }
                    }
                    var bits = new BitFieldReader(base64CharCodeToInt, compressed, charIndex, charIndex + bitStringLength);
                    charIndex += bitStringLength;
                    var neededInstrumentBits = 0;
                    while ((1 << neededInstrumentBits) < this.instrumentsPerChannel)
                        neededInstrumentBits++;
                    while (true) {
                        this.channelPatterns[channel] = [];
                        var isDrum = this.getChannelIsDrum(channel);
                        var octaveOffset = isDrum ? 0 : this.channelOctaves[channel] * 12;
                        var note = null;
                        var pin = null;
                        var lastPitch = (isDrum ? 4 : 12) + octaveOffset;
                        var recentPitches = isDrum ? [4, 6, 7, 2, 3, 8, 0, 10] : [12, 19, 24, 31, 36, 7, 0];
                        var recentShapes = [];
                        for (var i = 0; i < recentPitches.length; i++) {
                            recentPitches[i] += octaveOffset;
                        }
                        for (var i = 0; i < this.patternsPerChannel; i++) {
                            var newPattern = new BarPattern();
                            newPattern.instrument = bits.read(neededInstrumentBits);
                            this.channelPatterns[channel][i] = newPattern;
                            if (!beforeThree && bits.read(1) == 0)
                                continue;
                            var curPart = 0;
                            var newNotes = [];
                            while (curPart < this.beatsPerBar * this.partsPerBeat) {
                                var useOldShape = bits.read(1) == 1;
                                var newNote = false;
                                var shapeIndex = 0;
                                if (useOldShape) {
                                    shapeIndex = bits.readLongTail(0, 0);
                                }
                                else {
                                    newNote = bits.read(1) == 1;
                                }
                                if (!useOldShape && !newNote) {
                                    var restLength = bits.readPartDuration();
                                    curPart += restLength;
                                }
                                else {
                                    var shape = void 0;
                                    var pinObj = void 0;
                                    var pitch = void 0;
                                    if (useOldShape) {
                                        shape = recentShapes[shapeIndex];
                                        recentShapes.splice(shapeIndex, 1);
                                    }
                                    else {
                                        shape = {};
                                        shape.pitchCount = 1;
                                        while (shape.pitchCount < 4 && bits.read(1) == 1)
                                            shape.pitchCount++;
                                        shape.pinCount = bits.readPinCount();
                                        shape.initialVolume = bits.read(2);
                                        shape.pins = [];
                                        shape.length = 0;
                                        shape.bendCount = 0;
                                        for (var j = 0; j < shape.pinCount; j++) {
                                            pinObj = {};
                                            pinObj.pitchBend = bits.read(1) == 1;
                                            if (pinObj.pitchBend)
                                                shape.bendCount++;
                                            shape.length += bits.readPartDuration();
                                            pinObj.time = shape.length;
                                            pinObj.volume = bits.read(2);
                                            shape.pins.push(pinObj);
                                        }
                                    }
                                    recentShapes.unshift(shape);
                                    if (recentShapes.length > 10)
                                        recentShapes.pop();
                                    note = makeNote(0, curPart, curPart + shape.length, shape.initialVolume);
                                    note.pitches = [];
                                    note.pins.length = 1;
                                    var pitchBends = [];
                                    for (var j = 0; j < shape.pitchCount + shape.bendCount; j++) {
                                        var useOldPitch = bits.read(1) == 1;
                                        if (!useOldPitch) {
                                            var interval = bits.readPitchInterval();
                                            pitch = lastPitch;
                                            var intervalIter = interval;
                                            while (intervalIter > 0) {
                                                pitch++;
                                                while (recentPitches.indexOf(pitch) != -1)
                                                    pitch++;
                                                intervalIter--;
                                            }
                                            while (intervalIter < 0) {
                                                pitch--;
                                                while (recentPitches.indexOf(pitch) != -1)
                                                    pitch--;
                                                intervalIter++;
                                            }
                                        }
                                        else {
                                            var pitchIndex = bits.read(3);
                                            pitch = recentPitches[pitchIndex];
                                            recentPitches.splice(pitchIndex, 1);
                                        }
                                        recentPitches.unshift(pitch);
                                        if (recentPitches.length > 8)
                                            recentPitches.pop();
                                        if (j < shape.pitchCount) {
                                            note.pitches.push(pitch);
                                        }
                                        else {
                                            pitchBends.push(pitch);
                                        }
                                        if (j == shape.pitchCount - 1) {
                                            lastPitch = note.pitches[0];
                                        }
                                        else {
                                            lastPitch = pitch;
                                        }
                                    }
                                    pitchBends.unshift(note.pitches[0]);
                                    for (var _i = 0, _a = shape.pins; _i < _a.length; _i++) {
                                        var pinObj_1 = _a[_i];
                                        if (pinObj_1.pitchBend)
                                            pitchBends.shift();
                                        pin = makeNotePin(pitchBends[0] - note.pitches[0], pinObj_1.time, pinObj_1.volume);
                                        note.pins.push(pin);
                                    }
                                    curPart = note.end;
                                    newNotes.push(note);
                                }
                            }
                            newPattern.notes = newNotes;
                        }
                        if (beforeThree) {
                            break;
                        }
                        else {
                            channel++;
                            if (channel >= this.getChannelCount())
                                break;
                        }
                    }
                }
            }
        };
        Song.prototype.toJsonObject = function (enableIntro, loopCount, enableOutro) {
            if (enableIntro === void 0) { enableIntro = true; }
            if (loopCount === void 0) { loopCount = 1; }
            if (enableOutro === void 0) { enableOutro = true; }
            var channelArray = [];
            for (var channel = 0; channel < this.getChannelCount(); channel++) {
                var instrumentArray = [];
                var isDrum = this.getChannelIsDrum(channel);
                for (var i = 0; i < this.instrumentsPerChannel; i++) {
                    if (isDrum) {
                        instrumentArray.push({
                            volume: (5 - this.instrumentVolumes[channel][i]) * 20,
                            wave: Config.drumNames[this.instrumentWaves[channel][i]],
                            envelope: Config.envelopeNames[this.instrumentEnvelopes[channel][i]],
                            filter: Config.filterNames[this.instrumentFilters[channel][i]],
                            harm: Config.harmNames[this.instrumentHarm[channel][i]],
                        });
                    }
                    else {
                        instrumentArray.push({
                            volume: (5 - this.instrumentVolumes[channel][i]) * 20,
                            wave: Config.waveNames[this.instrumentWaves[channel][i]],
                            envelope: Config.envelopeNames[this.instrumentEnvelopes[channel][i]],
                            filter: Config.filterNames[this.instrumentFilters[channel][i]],
                            chorus: Config.chorusNames[this.instrumentChorus[channel][i]],
                            effect: Config.effectNames[this.instrumentEffects[channel][i]],
							harm: Config.harmNames[this.instrumentHarm[channel][i]],
							offOne: Config.offOneNames[this.instrumentOffOne[channel][i]],
                        });
                    }
                }
                var patternArray = [];
                for (var _i = 0, _a = this.channelPatterns[channel]; _i < _a.length; _i++) {
                    var pattern = _a[_i];
                    var noteArray = [];
                    for (var _b = 0, _c = pattern.notes; _b < _c.length; _b++) {
                        var note = _c[_b];
                        var pointArray = [];
                        for (var _d = 0, _e = note.pins; _d < _e.length; _d++) {
                            var pin = _e[_d];
                            pointArray.push({
                                tick: pin.time + note.start,
                                pitchBend: pin.interval,
                                volume: Math.round(pin.volume * 100 / 3),
                            });
                        }
                        noteArray.push({
                            pitches: note.pitches,
                            points: pointArray,
                        });
                    }
                    patternArray.push({
                        instrument: pattern.instrument + 1,
                        notes: noteArray,
                    });
                }
                var sequenceArray = [];
                if (enableIntro)
                    for (var i = 0; i < this.loopStart; i++) {
                        sequenceArray.push(this.channelBars[channel][i]);
                    }
                for (var l = 0; l < loopCount; l++)
                    for (var i = this.loopStart; i < this.loopStart + this.loopLength; i++) {
                        sequenceArray.push(this.channelBars[channel][i]);
                    }
                if (enableOutro)
                    for (var i = this.loopStart + this.loopLength; i < this.barCount; i++) {
                        sequenceArray.push(this.channelBars[channel][i]);
                    }
                channelArray.push({
                    octaveScrollBar: this.channelOctaves[channel],
                    instruments: instrumentArray,
                    patterns: patternArray,
                    sequence: sequenceArray,
                    type: isDrum ? "drum" : "pitch",
                });
            }
            return {
                version: Song._latestVersion,
				aSettings: Config.aSettingsNames[this.aSettings],
				theme: Config.themeNames[this.theme],
                scale: Config.scaleNames[this.scale],
                key: Config.keyNames[this.key],
                introBars: this.loopStart,
                loopBars: this.loopLength,
                beatsPerBar: this.beatsPerBar,
                ticksPerBeat: this.partsPerBeat,
                beatsPerMinute: this.getBeatsPerMinute(),
                reverb: this.reverb,
				blend: this.blend,
				riff: this.riff,
				decaysl: this.decaysl,
                channels: channelArray,
            };
        };
        Song.prototype.fromJsonObject = function (jsonObject) {
            this.initToDefault();
            if (!jsonObject)
                return;
            var version = jsonObject.version;
            if (version !== 5)
                return;
            this.scale = 11;
            if (jsonObject.scale != undefined) {
                var oldScaleNames = { "romani :)": 8, "romani :(": 9 };
                var scale = oldScaleNames[jsonObject.scale] != undefined ? oldScaleNames[jsonObject.scale] : Config.scaleNames.indexOf(jsonObject.scale);
                if (scale != -1)
                    this.scale = scale;
            }
            if (jsonObject.key != undefined) {
                if (typeof (jsonObject.key) == "number") {
                    this.key = Config.keyNames.length - 1 - (((jsonObject.key + 1200) >>> 0) % Config.keyNames.length);
                }
                else if (typeof (jsonObject.key) == "string") {
                    var key = jsonObject.key;
                    var letter = key.charAt(0).toUpperCase();
                    var symbol = key.charAt(1).toLowerCase();
                    var letterMap = { "C": 11, "D": 9, "E": 7, "F": 6, "G": 4, "A": 2, "B": 0 };
                    var accidentalMap = { "♭": -1, "♭": -1, "#": 1, "♭": 1 };
                    var index = letterMap[letter];
                    var offset = accidentalMap[symbol];
                    if (index != undefined) {
                        if (offset != undefined)
                            index += offset;
                        if (index < 0)
                            index += 12;
                        index = index % 12;
                        this.key = index;
                    }
                }
            }
            if (jsonObject.beatsPerMinute != undefined) {
                var bpm = jsonObject.beatsPerMinute | 0;
                this.tempo = Math.round(4.0 + 9.0 * Math.log(bpm / 120) / Math.LN2);
                this.tempo = this._clip(0, Config.tempoNames.length, this.tempo);
            }
            if (jsonObject.reverb != undefined) {
                this.reverb = this._clip(0, Config.reverbRange, jsonObject.reverb | 0);
            }
			if (jsonObject.blend != undefined) {
                this.blend = this._clip(0, Config.blendRange, jsonObject.blend | 0);
            }
			if (jsonObject.riff != undefined) {
                this.riff = this._clip(0, Config.riffRange, jsonObject.riff | 0);
            }
			if (jsonObject.decaysl != undefined) {
                this.decaysl = this._clip(0, Config.decayslRange, jsonObject.decaysl | 0);
            }
            if (jsonObject.beatsPerBar != undefined) {
                this.beatsPerBar = Math.max(Config.beatsPerBarMin, Math.min(Config.beatsPerBarMax, jsonObject.beatsPerBar | 0));
            }
            if (jsonObject.ticksPerBeat != undefined) {
                this.partsPerBeat = Math.max(3, Math.min(4, jsonObject.ticksPerBeat | 0));
            }
            var maxInstruments = 1;
            var maxPatterns = 1;
            var maxBars = 1;
            if (jsonObject.channels) {
                for (var _i = 0, _a = jsonObject.channels; _i < _a.length; _i++) {
                    var channelObject = _a[_i];
                    if (channelObject.instruments)
                        maxInstruments = Math.max(maxInstruments, channelObject.instruments.length | 0);
                    if (channelObject.patterns)
                        maxPatterns = Math.max(maxPatterns, channelObject.patterns.length | 0);
                    if (channelObject.sequence)
                        maxBars = Math.max(maxBars, channelObject.sequence.length | 0);
                }
            }
            this.instrumentsPerChannel = maxInstruments;
            this.patternsPerChannel = maxPatterns;
            this.barCount = maxBars;
            if (jsonObject.introBars != undefined) {
                this.loopStart = this._clip(0, this.barCount, jsonObject.introBars | 0);
            }
            if (jsonObject.loopBars != undefined) {
                this.loopLength = this._clip(1, this.barCount - this.loopStart + 1, jsonObject.loopBars | 0);
            }
            var pitchChannelCount = 0;
            var drumChannelCount = 0;
            if (jsonObject.channels) {
                this.instrumentVolumes.length = jsonObject.channels.length;
                this.instrumentWaves.length = jsonObject.channels.length;
                this.instrumentEnvelopes.length = jsonObject.channels.length;
                this.instrumentFilters.length = jsonObject.channels.length;
                this.instrumentChorus.length = jsonObject.channels.length;
                this.instrumentEffects.length = jsonObject.channels.length;
				this.instrumentHarm.length = jsonObject.channels.length;
				this.instrumentOffOne.length = jsonObject.channels.length;
                this.channelPatterns.length = jsonObject.channels.length;
                this.channelOctaves.length = jsonObject.channels.length;
                this.channelBars.length = jsonObject.channels.length;
                for (var channel = 0; channel < jsonObject.channels.length; channel++) {
                    var channelObject = jsonObject.channels[channel];
                    if (channelObject.octaveScrollBar != undefined) {
                        this.channelOctaves[channel] = this._clip(0, 5, channelObject.octaveScrollBar | 0);
                    }
                    this.instrumentVolumes[channel] = [];
                    this.instrumentWaves[channel] = [];
                    this.instrumentEnvelopes[channel] = [];
                    this.instrumentFilters[channel] = [];
                    this.instrumentChorus[channel] = [];
                    this.instrumentEffects[channel] = [];
					this.instrumentHarm[channel] = [];
					this.instrumentOffOne[channel] = [];
                    this.channelPatterns[channel] = [];
                    this.channelBars[channel] = [];
                    this.instrumentVolumes[channel].length = this.instrumentsPerChannel;
                    this.instrumentWaves[channel].length = this.instrumentsPerChannel;
                    this.instrumentEnvelopes[channel].length = this.instrumentsPerChannel;
                    this.instrumentFilters[channel].length = this.instrumentsPerChannel;
                    this.instrumentChorus[channel].length = this.instrumentsPerChannel;
                    this.instrumentEffects[channel].length = this.instrumentsPerChannel;
					this.instrumentHarm[channel].length = this.instrumentsPerChannel;
					this.instrumentOffOne[channel].length = this.instrumentsPerChannel;
                    this.channelPatterns[channel].length = this.patternsPerChannel;
                    this.channelBars[channel].length = this.barCount;
                    var isDrum = false;
                    if (channelObject.type) {
                        isDrum = (channelObject.type == "drum");
                    }
                    else {
                        isDrum = (channel >= 3);
                    }
                    if (isDrum)
                        drumChannelCount++;
                    else
                        pitchChannelCount++;
                    for (var i = 0; i < this.instrumentsPerChannel; i++) {
                        var instrumentObject = undefined;
                        if (channelObject.instruments)
                            instrumentObject = channelObject.instruments[i];
                        if (instrumentObject == undefined)
                            instrumentObject = {};
                        if (instrumentObject.volume != undefined) {
                            this.instrumentVolumes[channel][i] = this._clip(0, Config.volumeNames.length, Math.round(5 - (instrumentObject.volume | 0) / 20));
                        }
                        else {
                            this.instrumentVolumes[channel][i] = 0;
                        }
                        var oldEnvelopeNames = { "binary": 0 };
                        this.instrumentEnvelopes[channel][i] = oldEnvelopeNames[instrumentObject.envelope] != undefined ? oldEnvelopeNames[instrumentObject.envelope] : Config.envelopeNames.indexOf(instrumentObject.envelope);
                        if (this.instrumentEnvelopes[channel][i] == -1)
                            this.instrumentEnvelopes[channel][i] = 1;
                        if (isDrum) {
                            this.instrumentWaves[channel][i] = Config.drumNames.indexOf(instrumentObject.wave);
                            if (this.instrumentWaves[channel][i] == -1)
                                this.instrumentWaves[channel][i] = 1;
                            this.instrumentFilters[channel][i] = Config.filterNames.indexOf(instrumentObject.filter);
                            if (this.instrumentFilters[channel][i] == -1)
                                this.instrumentFilters[channel][i] = 1;
                            this.instrumentHarm[channel][i] = Config.harmNames.indexOf(instrumentObject.harm);
                            if (this.instrumentHarm[channel][i] == -1)
                                this.instrumentHarm[channel][i] = 1;
                            this.instrumentChorus[channel][i] = 0;
                            this.instrumentEffects[channel][i] = 0;
							this.instrumentOffOne[channel][i] = 0;
                        }
                        else {
                            this.instrumentWaves[channel][i] = Config.waveNames.indexOf(instrumentObject.wave);
                            if (this.instrumentWaves[channel][i] == -1)
                                this.instrumentWaves[channel][i] = 1;
                            this.instrumentFilters[channel][i] = Config.filterNames.indexOf(instrumentObject.filter);
                            if (this.instrumentFilters[channel][i] == -1)
                                this.instrumentFilters[channel][i] = 0;
                            this.instrumentChorus[channel][i] = Config.chorusNames.indexOf(instrumentObject.chorus);
                            if (this.instrumentChorus[channel][i] == -1)
                                this.instrumentChorus[channel][i] = 0;
                            this.instrumentEffects[channel][i] = Config.effectNames.indexOf(instrumentObject.effect);
                            if (this.instrumentEffects[channel][i] == -1)
                                this.instrumentEffects[channel][i] = 0;
							this.instrumentHarm[channel][i] = Config.harmNames.indexOf(instrumentObject.harm);
                            if (this.instrumentHarm[channel][i] == -1)
                                this.instrumentHarm[channel][i] = 0;
							this.instrumentOffOne[channel][i] = Config.offOneNames.indexOf(instrumentObject.offOne);
                            if (this.instrumentOffOne[channel][i] == -1)
                                this.instrumentOffOne[channel][i] = 0;
                        }
                    }
                    for (var i = 0; i < this.patternsPerChannel; i++) {
                        var pattern = new BarPattern();
                        this.channelPatterns[channel][i] = pattern;
                        var patternObject = undefined;
                        if (channelObject.patterns)
                            patternObject = channelObject.patterns[i];
                        if (patternObject == undefined)
                            continue;
                        pattern.instrument = this._clip(0, this.instrumentsPerChannel, (patternObject.instrument | 0) - 1);
                        if (patternObject.notes && patternObject.notes.length > 0) {
                            var maxNoteCount = Math.min(this.beatsPerBar * this.partsPerBeat, patternObject.notes.length >>> 0);
                            var tickClock = 0;
                            for (var j = 0; j < patternObject.notes.length; j++) {
                                if (j >= maxNoteCount)
                                    break;
                                var noteObject = patternObject.notes[j];
                                if (!noteObject || !noteObject.pitches || !(noteObject.pitches.length >= 1) || !noteObject.points || !(noteObject.points.length >= 2)) {
                                    continue;
                                }
                                var note = makeNote(0, 0, 0, 0);
                                note.pitches = [];
                                note.pins = [];
                                for (var k = 0; k < noteObject.pitches.length; k++) {
                                    var pitch = noteObject.pitches[k] | 0;
                                    if (note.pitches.indexOf(pitch) != -1)
                                        continue;
                                    note.pitches.push(pitch);
                                    if (note.pitches.length >= 4)
                                        break;
                                }
                                if (note.pitches.length < 1)
                                    continue;
                                var noteClock = tickClock;
                                var startInterval = 0;
                                for (var k = 0; k < noteObject.points.length; k++) {
                                    var pointObject = noteObject.points[k];
                                    if (pointObject == undefined || pointObject.tick == undefined)
                                        continue;
                                    var interval = (pointObject.pitchBend == undefined) ? 0 : (pointObject.pitchBend | 0);
                                    var time = pointObject.tick | 0;
                                    var volume = (pointObject.volume == undefined) ? 3 : Math.max(0, Math.min(3, Math.round((pointObject.volume | 0) * 3 / 100)));
                                    if (time > this.beatsPerBar * this.partsPerBeat)
                                        continue;
                                    if (note.pins.length == 0) {
                                        if (time < noteClock)
                                            continue;
                                        note.start = time;
                                        startInterval = interval;
                                    }
                                    else {
                                        if (time <= noteClock)
                                            continue;
                                    }
                                    noteClock = time;
                                    note.pins.push(makeNotePin(interval - startInterval, time - note.start, volume));
                                }
                                if (note.pins.length < 2)
                                    continue;
                                note.end = note.pins[note.pins.length - 1].time + note.start;
                                var maxPitch = isDrum ? Config.drumCount - 1 : Config.maxPitch;
                                var lowestPitch = maxPitch;
                                var highestPitch = 0;
                                for (var k = 0; k < note.pitches.length; k++) {
                                    note.pitches[k] += startInterval;
                                    if (note.pitches[k] < 0 || note.pitches[k] > maxPitch) {
                                        note.pitches.splice(k, 1);
                                        k--;
                                    }
                                    if (note.pitches[k] < lowestPitch)
                                        lowestPitch = note.pitches[k];
                                    if (note.pitches[k] > highestPitch)
                                        highestPitch = note.pitches[k];
                                }
                                if (note.pitches.length < 1)
                                    continue;
                                for (var k = 0; k < note.pins.length; k++) {
                                    var pin = note.pins[k];
                                    if (pin.interval + lowestPitch < 0)
                                        pin.interval = -lowestPitch;
                                    if (pin.interval + highestPitch > maxPitch)
                                        pin.interval = maxPitch - highestPitch;
                                    if (k >= 2) {
                                        if (pin.interval == note.pins[k - 1].interval &&
                                            pin.interval == note.pins[k - 2].interval &&
                                            pin.volume == note.pins[k - 1].volume &&
                                            pin.volume == note.pins[k - 2].volume) {
                                            note.pins.splice(k - 1, 1);
                                            k--;
                                        }
                                    }
                                }
                                pattern.notes.push(note);
                                tickClock = note.end;
                            }
                        }
                    }
                    for (var i = 0; i < this.barCount; i++) {
                        this.channelBars[channel][i] = channelObject.sequence ? Math.min(this.patternsPerChannel, channelObject.sequence[i] >>> 0) : 0;
                    }
                }
            }
            this.pitchChannelCount = pitchChannelCount;
            this.drumChannelCount = drumChannelCount;
        };
        Song.prototype._clip = function (min, max, val) {
            max = max - 1;
            if (val <= max) {
                if (val >= min)
                    return val;
                else
                    return min;
            }
            else {
                return max;
            }
        };
        Song.prototype.getPattern = function (channel, bar) {
            var patternIndex = this.channelBars[channel][bar];
            if (patternIndex == 0)
                return null;
            return this.channelPatterns[channel][patternIndex - 1];
        };
        Song.prototype.getPatternInstrument = function (channel, bar) {
            var pattern = this.getPattern(channel, bar);
            return pattern == null ? 0 : pattern.instrument;
        };
        Song.prototype.getBeatsPerMinute = function () {
            return Math.round(120.0 * Math.pow(2.0, (-4.0 + this.tempo) / 9.0));
        };
        return Song;
    }());
    Song._oldestVersion = 2;
    Song._latestVersion = 5;
    Song._base64CharCodeToInt = [151, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 62, 62, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 0, 0, 0, 0, 0, 0, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 0, 0, 0, 0, 63, 0, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 0, 0, 0, 0, 0];
    Song._base64IntToCharCode = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 45, 95, 0];
    beepbox.Song = Song;
    var Synth = (function () {
        function Synth(song) {
            if (song === void 0) { song = null; }
            var _this = this;
            this.samplesPerSecond = 44100;
            this.effectDuration = 0.14;
            this.effectAngle = Math.PI * 2.0 / (this.effectDuration * this.samplesPerSecond);
            this.effectYMult = 2.0 * Math.cos(this.effectAngle);
            this.limitDecay = 1.0 / (2.0 * this.samplesPerSecond);
            this.song = null;
            this.pianoPressed = false;
            this.pianoPitch = 0;
            this.pianoChannel = 0;
            this.enableIntro = true;
            this.enableOutro = false;
            this.loopCount = -1;
            this.volume = 1.0;
            this.playheadInternal = 0.0;
            this.bar = 0;
            this.beat = 0;
            this.part = 0;
            this.arpeggio = 0;
            this.arpeggioSampleCountdown = 0;
            this.paused = true;
            this.channelPlayheadA = [0.0, 0.0, 0.0, 0.0];
            this.channelPlayheadB = [0.0, 0.0, 0.0, 0.0];
            this.channelSample = [0.0, 0.0, 0.0, 0.0];
            this.drumPlayhead = 0.0;
            this.drumSample = 0.0;
            this.stillGoing = false;
            this.effectPlayhead = 0.0;
            this.limit = 0.0;
            this.delayLine = new Float32Array(16384);
            this.delayPos = 0;
            this.delayFeedback0 = 0.0;
            this.delayFeedback1 = 0.0;
            this.delayFeedback2 = 0.0;
            this.delayFeedback3 = 0.0;
            this.audioProcessCallback = function (audioProcessingEvent) {
                var outputBuffer = audioProcessingEvent.outputBuffer;
                var outputData = outputBuffer.getChannelData(0);
                _this.synthesize(outputData, outputBuffer.length);
            };
            if (song != null)
                this.setSong(song);
        }
        Synth.ensureGeneratedSynthesizerAndDrumWavesExist = function (song) {
            if (song != null) {
                for (var i = 0; i < song.instrumentsPerChannel; i++) {
                    for (var j = song.pitchChannelCount; j < song.pitchChannelCount + song.drumChannelCount; j++) {
                        Config.getDrumWave(song.instrumentWaves[j][i]);
                    }
                }
                Synth.getGeneratedSynthesizer(song.pitchChannelCount, song.drumChannelCount);
            }
        };
        Object.defineProperty(Synth.prototype, "playing", {
            get: function () {
                return !this.paused;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Synth.prototype, "playhead", {
            get: function () {
                return this.playheadInternal;
            },
            set: function (value) {
                if (this.song != null) {
                    this.playheadInternal = Math.max(0, Math.min(this.song.barCount, value));
                    var remainder = this.playheadInternal;
                    this.bar = Math.floor(remainder);
                    remainder = this.song.beatsPerBar * (remainder - this.bar);
                    this.beat = Math.floor(remainder);
                    remainder = this.song.partsPerBeat * (remainder - this.beat);
                    this.part = Math.floor(remainder);
                    remainder = 4 * (remainder - this.part);
                    this.arpeggio = Math.floor(remainder);
                    var samplesPerArpeggio = this.getSamplesPerArpeggio();
                    remainder = samplesPerArpeggio * (remainder - this.arpeggio);
                    this.arpeggioSampleCountdown = Math.floor(samplesPerArpeggio - remainder);
                    if (this.bar < this.song.loopStart) {
                        this.enableIntro = true;
                    }
                    if (this.bar > this.song.loopStart + this.song.loopLength) {
                        this.enableOutro = true;
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Synth.prototype, "totalSamples", {
            get: function () {
                if (this.song == null)
                    return 0;
                var samplesPerBar = this.getSamplesPerArpeggio() * 4 * this.song.partsPerBeat * this.song.beatsPerBar;
                var loopMinCount = this.loopCount;
                if (loopMinCount < 0)
                    loopMinCount = 1;
                var bars = this.song.loopLength * loopMinCount;
                if (this.enableIntro)
                    bars += this.song.loopStart;
                if (this.enableOutro)
                    bars += this.song.barCount - (this.song.loopStart + this.song.loopLength);
                return bars * samplesPerBar;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Synth.prototype, "totalSeconds", {
            get: function () {
                return this.totalSamples / this.samplesPerSecond;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Synth.prototype, "totalBars", {
            get: function () {
                if (this.song == null)
                    return 0.0;
                return this.song.barCount;
            },
            enumerable: true,
            configurable: true
        });
        Synth.prototype.setSong = function (song) {
            if (typeof (song) == "string") {
                this.song = new Song(song);
            }
            else if (song instanceof Song) {
                this.song = song;
            }
        };
        Synth.prototype.play = function () {
            if (!this.paused)
                return;
            this.paused = false;
            Synth.ensureGeneratedSynthesizerAndDrumWavesExist(this.song);
            var contextClass = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext);
            this.audioCtx = this.audioCtx || new contextClass();
            this.scriptNode = this.audioCtx.createScriptProcessor ? this.audioCtx.createScriptProcessor(2048, 0, 1) : this.audioCtx.createJavaScriptNode(2048, 0, 1);
            this.scriptNode.onaudioprocess = this.audioProcessCallback;
            this.scriptNode.channelCountMode = 'explicit';
            this.scriptNode.channelInterpretation = 'speakers';
            this.scriptNode.connect(this.audioCtx.destination);
            this.samplesPerSecond = this.audioCtx.sampleRate;
            this.effectAngle = Math.PI * 2.0 / (this.effectDuration * this.samplesPerSecond);
            this.effectYMult = 2.0 * Math.cos(this.effectAngle);
            this.limitDecay = 1.0 / (2.0 * this.samplesPerSecond);
        };
        Synth.prototype.pause = function () {
            if (this.paused)
                return;
            this.paused = true;
            this.scriptNode.disconnect(this.audioCtx.destination);
            if (this.audioCtx.close) {
                this.audioCtx.close();
                this.audioCtx = null;
            }
            this.scriptNode = null;
        };
        Synth.prototype.snapToStart = function () {
            this.bar = 0;
            this.enableIntro = true;
            this.snapToBar();
        };
        Synth.prototype.snapToBar = function () {
            this.playheadInternal = this.bar;
            this.beat = 0;
            this.part = 0;
            this.arpeggio = 0;
            this.arpeggioSampleCountdown = 0;
            this.effectPlayhead = 0.0;
            this.channelSample[0] = 0.0;
            this.channelSample[1] = 0.0;
            this.channelSample[2] = 0.0;
            this.drumSample = 0.0;
            this.delayPos = 0;
            this.delayFeedback0 = 0.0;
            this.delayFeedback1 = 0.0;
            this.delayFeedback2 = 0.0;
            this.delayFeedback3 = 0.0;
            for (var i = 0; i < this.delayLine.length; i++)
                this.delayLine[i] = 0.0;
        };
        Synth.prototype.nextBar = function () {
            if (!this.song)
                return;
            var oldBar = this.bar;
            this.bar++;
            if (this.enableOutro) {
                if (this.bar >= this.song.barCount) {
                    this.bar = this.enableIntro ? 0 : this.song.loopStart;
                }
            }
            else {
                if (this.bar >= this.song.loopStart + this.song.loopLength || this.bar >= this.song.barCount) {
                    this.bar = this.song.loopStart;
                }
            }
            this.playheadInternal += this.bar - oldBar;
        };
        Synth.prototype.prevBar = function () {
            if (!this.song)
                return;
            var oldBar = this.bar;
            this.bar--;
            if (this.bar < 0) {
                this.bar = this.song.loopStart + this.song.loopLength - 1;
            }
            if (this.bar >= this.song.barCount) {
                this.bar = this.song.barCount - 1;
            }
            if (this.bar < this.song.loopStart) {
                this.enableIntro = true;
            }
            if (!this.enableOutro && this.bar >= this.song.loopStart + this.song.loopLength) {
                this.bar = this.song.loopStart + this.song.loopLength - 1;
            }
            this.playheadInternal += this.bar - oldBar;
        };
        Synth.prototype.synthesize = function (data, totalSamples) {
            if (this.song == null) {
                for (var i = 0; i < totalSamples; i++) {
                    data[i] = 0.0;
                }
                return;
            }
            var channelCount = this.song.getChannelCount();
            if (this.channelPlayheadA.length != channelCount) {
                for (var i = 0; i < channelCount; i++)
                    this.channelPlayheadA[i] = 0.0;
                this.channelPlayheadA.length = channelCount;
            }
            if (this.channelPlayheadB.length != channelCount) {
                for (var i = 0; i < channelCount; i++)
                    this.channelPlayheadB[i] = 0.0;
                this.channelPlayheadB.length = channelCount;
            }
            if (this.channelSample.length != channelCount) {
                for (var i = 0; i < channelCount; i++)
                    this.channelSample[i] = 0.0;
                this.channelSample.length = channelCount;
            }
            var generatedSynthesizer = Synth.getGeneratedSynthesizer(this.song.pitchChannelCount, this.song.drumChannelCount);
            generatedSynthesizer(this, this.song, data, totalSamples);
        };
        Synth.computeChannelInstrument = function (synth, song, channel, time, sampleTime, samplesPerArpeggio, samples, isDrum) {
            var pattern = song.getPattern(channel, synth.bar);
            var envelope = pattern == null ? 0 : song.instrumentEnvelopes[channel][pattern.instrument];
            var channelRoot = isDrum ? Config.drumPitchRoots[song.instrumentWaves[channel][pattern == null ? 0 : pattern.instrument]] : Config.keyTransposes[song.key];
            var intervalScale = isDrum ? Config.drumInterval : 1;
            var note = null;
            var prevNote = null;
            var nextNote = null;
            if (pattern != null) {
                for (var i = 0; i < pattern.notes.length; i++) {
                    if (pattern.notes[i].end <= time) {
                        prevNote = pattern.notes[i];
                    }
                    else if (pattern.notes[i].start <= time && pattern.notes[i].end > time) {
                        note = pattern.notes[i];
                    }
                    else if (pattern.notes[i].start > time) {
                        nextNote = pattern.notes[i];
                        break;
                    }
                }
            }
            if (note != null && prevNote != null && prevNote.end != note.start)
                prevNote = null;
            if (note != null && nextNote != null && nextNote.start != note.end)
                nextNote = null;
            var periodDelta;
            var periodDeltaScale = 1.0;
            var noteVolume;
            var volumeDelta = 0.0;
            var filter = 1.0;
            var filterScale = 1.0;
            var vibratoScale;
            var harmonyMult = 1.0;
            var resetPlayheads = false;
            if (synth.pianoPressed && channel == synth.pianoChannel) {
                var pianoFreq = synth.frequencyFromPitch(channelRoot + synth.pianoPitch * intervalScale);
                var instrument = pattern ? pattern.instrument : 0;
                var pianoPitchDamping = void 0;
                if (isDrum) {
                    if (Config.drumWaveIsSoft[song.instrumentWaves[channel][instrument]]) {
                        filter = Math.min(1.0, pianoFreq * sampleTime * Config.drumPitchFilterMult[song.instrumentWaves[channel][pattern.instrument]]);
                        pianoPitchDamping = 24.0;
                    }
                    else {
                        pianoPitchDamping = 60.0;
                    }
                }
                else {
                    pianoPitchDamping = 48.0;
                }
                periodDelta = pianoFreq * sampleTime;
                noteVolume = Math.pow(2.0, -synth.pianoPitch * intervalScale / pianoPitchDamping);
                vibratoScale = Math.pow(2.0, Config.effectVibratos[song.instrumentEffects[channel][instrument]] / 12.0) - 1.0;
            }
            else if (note == null) {
                periodDelta = 0.0;
                periodDeltaScale = 0.0;
                noteVolume = 0.0;
                vibratoScale = 0.0;
                resetPlayheads = true;
            }
            else {
                var chorusHarmonizes = Config.harmNames[song.instrumentHarm[channel][pattern.instrument]];
                var pitch = note.pitches[0];
                if (chorusHarmonizes) {
                    var harmonyOffset = 0.0;
                    if (note.pitches.length == 2) {
                        harmonyOffset = note.pitches[1] - note.pitches[0];
                    }
                    else if (note.pitches.length == 3) {
                        harmonyOffset = note.pitches[(synth.arpeggio >> 1) + 1] - note.pitches[0];
                    }
                    else if (note.pitches.length == 4) {
                        harmonyOffset = note.pitches[(synth.arpeggio == 3 ? 1 : synth.arpeggio) + 1] - note.pitches[0];
                    }
                    harmonyMult = Math.pow(2.0, harmonyOffset / 12.0);
                }
                else {
                    if (note.pitches.length == 2) {
                        pitch = note.pitches[synth.arpeggio >> 1];
                    }
                    else if (note.pitches.length == 3) {
                        pitch = note.pitches[synth.arpeggio == 3 ? 1 : synth.arpeggio];
                    }
                    else if (note.pitches.length == 4) {
                        pitch = note.pitches[synth.arpeggio];
                    }
                }
                var endPinIndex = void 0;
                for (endPinIndex = 1; endPinIndex < note.pins.length - 1; endPinIndex++) {
                    if (note.pins[endPinIndex].time + note.start > time)
                        break;
                }
                var startPin = note.pins[endPinIndex - 1];
                var endPin = note.pins[endPinIndex];
                var noteStart = note.start * 4;
                var noteEnd = note.end * 4;
                var pinStart = (note.start + startPin.time) * 4;
                var pinEnd = (note.start + endPin.time) * 4;
                var arpeggioStart = time * 4 + synth.arpeggio;
                var arpeggioEnd = time * 4 + synth.arpeggio + 1;
                var arpeggioRatioStart = (arpeggioStart - pinStart) / (pinEnd - pinStart);
                var arpeggioRatioEnd = (arpeggioEnd - pinStart) / (pinEnd - pinStart);
                var arpeggioVolumeStart = startPin.volume * (1.0 - arpeggioRatioStart) + endPin.volume * arpeggioRatioStart;
                var arpeggioVolumeEnd = startPin.volume * (1.0 - arpeggioRatioEnd) + endPin.volume * arpeggioRatioEnd;
                var arpeggioIntervalStart = startPin.interval * (1.0 - arpeggioRatioStart) + endPin.interval * arpeggioRatioStart;
                var arpeggioIntervalEnd = startPin.interval * (1.0 - arpeggioRatioEnd) + endPin.interval * arpeggioRatioEnd;
                var arpeggioFilterTimeStart = startPin.time * (1.0 - arpeggioRatioStart) + endPin.time * arpeggioRatioStart;
                var arpeggioFilterTimeEnd = startPin.time * (1.0 - arpeggioRatioEnd) + endPin.time * arpeggioRatioEnd;
                var inhibitRestart = false;
                if (arpeggioStart == noteStart) {
                    if (envelope == 0) {
                        inhibitRestart = true;
                    }
                    else if (envelope == 2) {
                        arpeggioVolumeStart = 0.0;
                    }
					else if (envelope == 4) {
                        arpeggioVolumeEnd = 0.0
					}
                    else if (envelope == 5) {
                        arpeggioIntervalStart = 100.0
					}
                    else if (envelope == 6) {
                        arpeggioIntervalStart = -1.0
					}
                    else if (envelope == 3) {
                        if (prevNote == null) {
                            arpeggioVolumeStart = 0.0;
                        }
                        else if (prevNote.pins[prevNote.pins.length - 1].volume == 0 || note.pins[0].volume == 0) {
                            arpeggioVolumeStart = 0.0;
                        }
                        else {
                            arpeggioIntervalStart = (prevNote.pitches[0] + prevNote.pins[prevNote.pins.length - 1].interval - pitch) * 0.5;
                            arpeggioFilterTimeStart = prevNote.pins[prevNote.pins.length - 1].time * 0.5;
                            inhibitRestart = true;
                        }
                    }
                }
                if (arpeggioEnd == noteEnd) {
                    if (envelope == 1 || envelope == 2) {
                        arpeggioVolumeEnd = 0.0;
                    }
                    else if (envelope == 3) {
                        if (nextNote == null) {
                            arpeggioVolumeEnd = 0.0;
                        }
                        else if (note.pins[note.pins.length - 1].volume == 0 || nextNote.pins[0].volume == 0) {
                            arpeggioVolumeEnd = 0.0;
                        }
                        else {
                            arpeggioIntervalEnd = (nextNote.pitches[0] + note.pins[note.pins.length - 1].interval - pitch) * 0.5;
                            arpeggioFilterTimeEnd *= 0.5;
                        }
                    }
                }
			    var startRatio = 1.0 - (synth.arpeggioSampleCountdown + samples) / samplesPerArpeggio;
                var endRatio = 1.0 - (synth.arpeggioSampleCountdown) / samplesPerArpeggio;
                var startInterval = arpeggioIntervalStart * (1.0 - startRatio) + arpeggioIntervalEnd * startRatio;
                var endInterval = arpeggioIntervalStart * (1.0 - endRatio) + arpeggioIntervalEnd * endRatio;
                var startFilterTime = arpeggioFilterTimeStart * (1.0 - startRatio) + arpeggioFilterTimeEnd * startRatio;
                var endFilterTime = arpeggioFilterTimeStart * (1.0 - endRatio) + arpeggioFilterTimeEnd * endRatio;
                var startFreq = synth.frequencyFromPitch(channelRoot + (pitch + startInterval) * intervalScale);
                var endFreq = synth.frequencyFromPitch(channelRoot + (pitch + endInterval) * intervalScale);
                var pitchDamping = void 0;
                if (isDrum) {
                    if (Config.drumWaveIsSoft[song.instrumentWaves[channel][pattern.instrument]]) {
                        filter = Math.min(1.0, startFreq * sampleTime * Config.drumPitchFilterMult[song.instrumentWaves[channel][pattern.instrument]]);
                        pitchDamping = 24.0;
                    }
                    else {
                        pitchDamping = 60.0;
                    }
                }
                else {
                    pitchDamping = 48.0;
                }
                var startVol = Math.pow(2.0, -(pitch + startInterval) * intervalScale / pitchDamping);
                var endVol = Math.pow(2.0, -(pitch + endInterval) * intervalScale / pitchDamping);
                startVol *= synth.volumeConversion(arpeggioVolumeStart * (1.0 - startRatio) + arpeggioVolumeEnd * startRatio);
                endVol *= synth.volumeConversion(arpeggioVolumeStart * (1.0 - endRatio) + arpeggioVolumeEnd * endRatio);
                var freqScale = endFreq / startFreq;
                periodDelta = startFreq * sampleTime;
                periodDeltaScale = Math.pow(freqScale, 1.0 / samples);
                noteVolume = startVol;
                volumeDelta = (endVol - startVol) / samples;
                var timeSinceStart = (arpeggioStart + startRatio - noteStart) * samplesPerArpeggio / synth.samplesPerSecond;
                if (timeSinceStart == 0.0 && !inhibitRestart)
                    resetPlayheads = true;
                if (!isDrum) {
                    var filterDecayScaleRate = Config.filterDecays[song.instrumentFilters[channel][pattern.instrument]];
                    var filterFadeScaleRate = Config.filterFades[song.instrumentFilters[channel][pattern.instrument]];
					filter = Math.pow(2, (-filterDecayScaleRate + filterFadeScaleRate) * startFilterTime * 4.0 * samplesPerArpeggio / synth.samplesPerSecond);
                    var endFilter = Math.pow(2, (-filterDecayScaleRate + filterFadeScaleRate) * endFilterTime * 4.0 * samplesPerArpeggio / synth.samplesPerSecond);
                    filterScale = Math.pow(endFilter / filter, 1.0 / samples);
                }
                var vibratoDelay = Config.effectVibratoDelays[song.instrumentEffects[channel][pattern.instrument]];
                vibratoScale = (time - note.start < vibratoDelay) ? 0.0 : Math.pow(2.0, Config.effectVibratos[song.instrumentEffects[channel][pattern.instrument]] / 12.0) - 1.0;
            }
            return {
                periodDelta: periodDelta,
                periodDeltaScale: periodDeltaScale,
                noteVolume: noteVolume,
                volumeDelta: volumeDelta,
                filter: filter,
                filterScale: filterScale,
                vibratoScale: vibratoScale,
                harmonyMult: harmonyMult,
                resetPlayheads: resetPlayheads,
            };
        };
        Synth.getGeneratedSynthesizer = function (pitchChannelCount, drumChannelCount) {
            if (Synth.generatedSynthesizers[pitchChannelCount] == undefined) {
                Synth.generatedSynthesizers[pitchChannelCount] = [];
            }
            if (Synth.generatedSynthesizers[pitchChannelCount][drumChannelCount] == undefined) {
                var synthSource = [];
                for (var _i = 0, _a = Synth.synthSourceTemplate; _i < _a.length; _i++) {
                    var line = _a[_i];
                    if (line.indexOf("#") != -1) {
                        if (line.indexOf("// PITCH") != -1) {
                            for (var i = 0; i < pitchChannelCount; i++) {
                                synthSource.push(line.replace(/#/g, i + ""));
                            }
                        }
                        else if (line.indexOf("// DRUM") != -1) {
                            for (var i = pitchChannelCount; i < pitchChannelCount + drumChannelCount; i++) {
                                synthSource.push(line.replace(/#/g, i + ""));
                            }
                        }
                        else if (line.indexOf("// ALL") != -1) {
                            for (var i = 0; i < pitchChannelCount + drumChannelCount; i++) {
                                synthSource.push(line.replace(/#/g, i + ""));
                            }
                        }
                        else {
                            throw new Error("Missing channel type annotation for line: " + line);
                        }
                    }
                    else {
                        synthSource.push(line);
                    }
                }
                Synth.generatedSynthesizers[pitchChannelCount][drumChannelCount] = new Function("synth", "song", "data", "totalSamples", synthSource.join("\n"));
            }
            return Synth.generatedSynthesizers[pitchChannelCount][drumChannelCount];
        };
        Synth.prototype.frequencyFromPitch = function (pitch) {
            return 440.0 * Math.pow(2.0, (pitch - 69.0) / 12.0);
        };
        Synth.prototype.volumeConversion = function (noteVolume) {
            return Math.pow(noteVolume / 3.0, 1.5);
        };
        Synth.prototype.getSamplesPerArpeggio = function () {
            if (this.song == null)
                return 0;
            var beatsPerMinute = this.song.getBeatsPerMinute();
            var beatsPerSecond = beatsPerMinute / 60.0;
            var partsPerSecond = beatsPerSecond * this.song.partsPerBeat;
            var arpeggioPerSecond = partsPerSecond * 4.0;
            return Math.floor(this.samplesPerSecond / arpeggioPerSecond);
        };
        return Synth;
    }());
    Synth.generatedSynthesizers = [];
	Synth.synthSourceTemplate = "\n\t\t\t\n\t\t\t var bufferIndex = 0;\n\t\t\t\n\t\t\t var sampleTime = 1.0 / synth.samplesPerSecond;\n\t\t\t var samplesPerArpeggio = synth.getSamplesPerArpeggio();\n\t\t\t var effectYMult = synth.effectYMult;\n\t\t\t var limitDecay = synth.limitDecay;\n\t\t\t var volume = synth.volume;\n\t\t\t var delayLine = synth.delayLine;\n\t\t\t var reverb = Math.pow(song.reverb / beepbox.Config.reverbRange, 0.667) * 0.425; \n\t\t\t var blend = Math.pow(song.blend / beepbox.Config.blendRange, 0.667) * 0.425; \n\t\t\t var riff = Math.pow(song.riff / beepbox.Config.riffRange, 0.667) * 0.425; \n\t\t\t var decaysl = Math.pow(song.decaysl / beepbox.Config.decayslRange, 0.667) * 0.425; \n\t\t\t var ended = false; \n\t\t\t\n\t\t\t // Check the bounds of the playhead:\n\t\t\t if (synth.arpeggioSampleCountdown == synth.arpeggioSampleCountdown > samplesPerArpeggio) {\n\t\t\t\t synth.arpeggioSampleCountdown = samplesPerArpeggio;\n\t\t\t }\n\t\t\t if (synth.part >= song.partsPerBeat) {\n\t\t\t\t synth.beat++;\n\t\t\t\t synth.part = 0;\n\t\t\t\t synth.arpeggio = 0;\n\t\t\t\t synth.arpeggioSampleCountdown = samplesPerArpeggio;\n\t\t\t }\n\t\t\t if (synth.beat >= song.beatsPerBar) {\n\t\t\t\t synth.bar++;\n\t\t\t\t synth.beat = 0;\n\t\t\t\t synth.part = 0;\n\t\t\t\t synth.arpeggio = 0;\n\t\t\t\t synth.arpeggioSampleCountdown = samplesPerArpeggio;\n\t\t\t\t\n\t\t\t\t if (synth.loopCount == -1) {\n\t\t\t\t\t if (synth.bar < song.loopStart && !synth.enableIntro) synth.bar = song.loopStart;\n\t\t\t\t\t if (synth.bar >= song.loopStart + song.loopLength && !synth.enableOutro) synth.bar = song.loopStart;\n\t\t\t\t }\n\t\t\t }\n\t\t\t if (synth.bar >= song.barCount) {\n\t\t\t\t if (synth.enableOutro) {\n\t\t\t\t\t synth.bar = 0;\n\t\t\t\t\t synth.enableIntro = true;\n\t\t\t\t\t ended = true;\n\t\t\t\t\t synth.pause();\n\t\t\t\t } else {\n\t\t\t\t\t synth.bar = song.loopStart;\n\t\t\t\t }\n\t\t\t }\n\t\t\t if (synth.bar >= song.loopStart) {\n\t\t\t\t synth.enableIntro = false;\n\t\t\t }\n\t\t\t\n\t\t\t while (totalSamples > 0) {\n\t\t\t\t if (ended) {\n\t\t\t\t\t while (totalSamples-- > 0) {\n\t\t\t\t\t\t data[bufferIndex] = 0.0;\n\t\t\t\t\t\t bufferIndex++;\n\t\t\t\t\t }\n\t\t\t\t\t break;\n\t\t\t\t }\n\t\t\t\t\n\t\t\t\t // Initialize instruments based on current pattern.\n\t\t\t\t var instrumentChannel# = song.getPatternInstrument(#, synth.bar); // ALL\n\t\t\t\t var maxChannel#Volume = 0.27 * (song.instrumentVolumes[#][instrumentChannel#] == 5 ? 0.0 : Math.pow(2, -beepbox.Config.volumeValues[song.instrumentVolumes[#][instrumentChannel#]])) * beepbox.Config.waveVolumes[song.instrumentWaves[#][instrumentChannel#]] * beepbox.Config.filterVolumes[song.instrumentFilters[#][instrumentChannel#]]  + (decaysl) * beepbox.Config.chorusVolumes[song.instrumentChorus[#][instrumentChannel#]] * 0.5; // PITCH\n\t\t\t\t var maxChannel#Volume = 0.19 * (song.instrumentVolumes[#][instrumentChannel#] == 5 ? 0.0 : Math.pow(2, -beepbox.Config.volumeValues[song.instrumentVolumes[#][instrumentChannel#]])) * beepbox.Config.drumVolumes[song.instrumentWaves[#][instrumentChannel#]]; // DRUM\n\t\t\t\t var channel#Wave = beepbox.Config.waves[song.instrumentWaves[#][instrumentChannel#]]; // PITCH\n\t\t\t\t var channel#Wave = beepbox.Config.getDrumWave(song.instrumentWaves[#][instrumentChannel#]); // DRUM\n\t\t\t\t var channel#WaveLength = channel#Wave.length; // PITCH\n\t\t\t\t var channel#FilterBase = Math.pow(2, -beepbox.Config.filterBases[song.instrumentFilters[#][instrumentChannel#]] + (blend * 4)); // PITCH\n\t\t\t\t var channel#TremoloScale = beepbox.Config.effectTremolos[song.instrumentEffects[#][instrumentChannel#]]; // PITCH\n\t\t\t\t\n\t\t\t\t // Reuse initialized instruments until getting to the end of the sample period or the end of the current bar.\n\t\t\t\t while (totalSamples > 0) {\n\t\t\t\t\t var samples;\n\t\t\t\t\t if (synth.arpeggioSampleCountdown <= totalSamples) {\n\t\t\t\t\t\t samples = synth.arpeggioSampleCountdown;\n\t\t\t\t\t } else {\n\t\t\t\t\t\t samples = totalSamples;\n\t\t\t\t\t }\n\t\t\t\t\t totalSamples -= samples;\n\t\t\t\t\t synth.arpeggioSampleCountdown -= samples;\n\t\t\t\t\t\n\t\t\t\t\t var time = synth.part + synth.beat * song.partsPerBeat;\n\t\t\t\t\n\t\t\t\t\t var channel#ChorusA = Math.pow(2.0, (beepbox.Config.chorusOffsets[song.instrumentChorus[#][instrumentChannel#]] + beepbox.Config.chorusIntervals[song.instrumentChorus[#][instrumentChannel#]] + beepbox.Config.offOneValues[song.instrumentOffOne[#][instrumentChannel#]] * (riff + 1)) / 12.0); // PITCH\n\t\t\t\t\t var channel#ChorusB = Math.pow(2.0, (beepbox.Config.chorusOffsets[song.instrumentChorus[#][instrumentChannel#]] - beepbox.Config.chorusIntervals[song.instrumentChorus[#][instrumentChannel#]] + beepbox.Config.offOneValues[song.instrumentOffOne[#][instrumentChannel#]] * (riff + 1)) / 12.0); // PITCH\n\t\t\t\t\t var channel#ChorusSign = (song.instrumentChorus[#][instrumentChannel#] == 7) ? -1.0 : 1.0; // PITCH\n\t\t\t\t\t if (song.instrumentChorus[#][instrumentChannel#] == 0) synth.channelPlayheadB[#] = synth.channelPlayheadA[#]; // PITCH\n\t\t\t\t\t\n\t\t\t\t\t var channel#PlayheadDelta = 0; // ALL\n\t\t\t\t\t var channel#PlayheadDeltaScale = 0; // ALL\n\t\t\t\t\t var channel#Volume = 0; // ALL\n\t\t\t\t\t var channel#VolumeDelta = 0; // ALL\n\t\t\t\t\t var channel#Filter = 0; // ALL\n\t\t\t\t\t var channel#FilterScale = 0; // PITCH\n\t\t\t\t\t var channel#VibratoScale = 0; // PITCH\n\t\t\t\t\t\n\t\t\t\t\t var instrument# = beepbox.Synth.computeChannelInstrument(synth, song, #, time, sampleTime, samplesPerArpeggio, samples, false); // PITCH\n\t\t\t\t\t var instrument# = beepbox.Synth.computeChannelInstrument(synth, song, #, time, sampleTime, samplesPerArpeggio, samples, true); // DRUM\n\t\t\t\t\t\n\t\t\t\t\t channel#PlayheadDelta = instrument#.periodDelta; // PITCH\n\t\t\t\t\t channel#PlayheadDelta = instrument#.periodDelta / 32768.0; // DRUM\n\t\t\t\t\t channel#PlayheadDeltaScale = instrument#.periodDeltaScale; // ALL\n\t\t\t\t\t channel#Volume = instrument#.noteVolume * maxChannel#Volume; // ALL\n\t\t\t\t\t channel#VolumeDelta = instrument#.volumeDelta * maxChannel#Volume; // ALL\n\t\t\t\t\t channel#Filter = instrument#.filter * channel#FilterBase; // PITCH\n\t\t\t\t\t channel#Filter = instrument#.filter; // DRUM\n\t\t\t\t\t channel#FilterScale = instrument#.filterScale; // PITCH\n\t\t\t\t\t channel#VibratoScale = instrument#.vibratoScale; // PITCH\n\t\t\t\t\t channel#ChorusB *= instrument#.harmonyMult; // PITCH\n\t\t\t\t\t if (instrument#.resetPlayheads) { synth.channelSample[#] = 0.0; synth.channelPlayheadA[#] = 0.0; synth.channelPlayheadB[#] = 0.0; } // PITCH\n\t\t\t\t\t\n\t\t\t\t\t var effectY = Math.sin(synth.effectPlayhead);\n\t\t\t\t\t var prevEffectY = Math.sin(synth.effectPlayhead - synth.effectAngle);\n\t\t\t\t\t\n\t\t\t\t\t var channel#PlayheadA = +synth.channelPlayheadA[#]; // PITCH\n\t\t\t\t\t var channel#PlayheadB = +synth.channelPlayheadB[#]; // PITCH\n\t\t\t\t\t var channel#Playhead  = +synth.channelPlayheadA[#]; // DRUM\n\t\t\t\t\t\n\t\t\t\t\t var channel#Sample = +synth.channelSample[#]; // ALL\n\t\t\t\t\t\n\t\t\t\t\t var delayPos = 0|synth.delayPos;\n\t\t\t\t\t var delayFeedback0 = +synth.delayFeedback0;\n\t\t\t\t\t var delayFeedback1 = +synth.delayFeedback1;\n\t\t\t\t\t var delayFeedback2 = +synth.delayFeedback2;\n\t\t\t\t\t var delayFeedback3 = +synth.delayFeedback3;\n\t\t\t\t\t var limit = +synth.limit;\n\t\t\t\t\t\n\t\t\t\t\t while (samples) {\n\t\t\t\t\t\t var channel#Vibrato = 1.0 + channel#VibratoScale * effectY; // PITCH\n\t\t\t\t\t\t var channel#Tremolo = 1.0 + channel#TremoloScale * (effectY - 1.0); // PITCH\n\t\t\t\t\t\t var temp = effectY;\n\t\t\t\t\t\t effectY = effectYMult * effectY - prevEffectY;\n\t\t\t\t\t\t prevEffectY = temp;\n\t\t\t\t\t\t\n\t\t\t\t\t\t channel#Sample += ((channel#Wave[0|(channel#PlayheadA * channel#WaveLength)] + channel#Wave[0|(channel#PlayheadB * channel#WaveLength)] * channel#ChorusSign) * channel#Volume * channel#Tremolo - channel#Sample) * channel#Filter; // PITCH\n\t\t\t\t\t\t channel#Sample += (channel#Wave[0|(channel#Playhead * 32768.0)] * channel#Volume - channel#Sample) * channel#Filter; // DRUM\n\t\t\t\t\t\t channel#Volume += channel#VolumeDelta; // ALL\n\t\t\t\t\t\t channel#PlayheadA += channel#PlayheadDelta * channel#Vibrato * channel#ChorusA; // PITCH\n\t\t\t\t\t\t channel#PlayheadB += channel#PlayheadDelta * channel#Vibrato * channel#ChorusB; // PITCH\n\t\t\t\t\t\t channel#Playhead += channel#PlayheadDelta; // DRUM\n\t\t\t\t\t\t channel#PlayheadDelta *= channel#PlayheadDeltaScale; // ALL\n\t\t\t\t\t\t channel#Filter *= channel#FilterScale; // PITCH\n\t\t\t\t\t\t channel#PlayheadA -= 0|channel#PlayheadA; // PITCH\n\t\t\t\t\t\t channel#PlayheadB -= 0|channel#PlayheadB; // PITCH\n\t\t\t\t\t\t channel#Playhead -= 0|channel#Playhead; // DRUM\n\t\t\t\t\t\t\n\t\t\t\t\t\t // Reverb, implemented using a feedback delay network with a Hadamard matrix and lowpass filters.\n\t\t\t\t\t\t // good ratios:    0.555235 + 0.618033 + 0.818 +   1.0 = 2.991268\n\t\t\t\t\t\t // Delay lengths:  3041     + 3385     + 4481  +  5477 = 16384 = 2^14\n\t\t\t\t\t\t // Buffer offsets: 3041    -> 6426   -> 10907 -> 16384\n\t\t\t\t\t\t var delayPos1 = (delayPos +  3041) & 0x3FFF;\n\t\t\t\t\t\t var delayPos2 = (delayPos +  6426) & 0x3FFF;\n\t\t\t\t\t\t var delayPos3 = (delayPos + 10907) & 0x3FFF;\n\t\t\t\t\t\t var delaySample0 = delayLine[delayPos]\n\t\t\t\t\t\t\t + channel#Sample // PITCH\n\t\t\t\t\t\t ;\n\t\t\t\t\t\t var delaySample1 = delayLine[delayPos1];\n\t\t\t\t\t\t var delaySample2 = delayLine[delayPos2];\n\t\t\t\t\t\t var delaySample3 = delayLine[delayPos3];\n\t\t\t\t\t\t var delayTemp0 = -delaySample0 + delaySample1;\n\t\t\t\t\t\t var delayTemp1 = -delaySample0 - delaySample1;\n\t\t\t\t\t\t var delayTemp2 = -delaySample2 + delaySample3;\n\t\t\t\t\t\t var delayTemp3 = -delaySample2 - delaySample3;\n\t\t\t\t\t\t delayFeedback0 += ((delayTemp0 + delayTemp2) * reverb - delayFeedback0) * 0.5;\n\t\t\t\t\t\t delayFeedback1 += ((delayTemp1 + delayTemp3) * reverb - delayFeedback1) * 0.5;\n\t\t\t\t\t\t delayFeedback2 += ((delayTemp0 - delayTemp2) * reverb - delayFeedback2) * 0.5;\n\t\t\t\t\t\t delayFeedback3 += ((delayTemp1 - delayTemp3) * reverb - delayFeedback3) * 0.5;\n\t\t\t\t\t\t delayLine[delayPos1] = delayFeedback0;\n\t\t\t\t\t\t delayLine[delayPos2] = delayFeedback1;\n\t\t\t\t\t\t delayLine[delayPos3] = delayFeedback2;\n\t\t\t\t\t\t delayLine[delayPos ] = delayFeedback3;\n\t\t\t\t\t\t delayPos = (delayPos + 1) & 0x3FFF;\n\t\t\t\t\t\t\n\t\t\t\t\t\t var sample = delaySample0 + delaySample1 + delaySample2 + delaySample3\n\t\t\t\t\t\t\t + channel#Sample // DRUM\n\t\t\t\t\t\t ;\n\t\t\t\t\t\t\n\t\t\t\t\t\t var abs = sample < 0.0 ? -sample : sample;\n\t\t\t\t\t\t limit -= limitDecay;\n\t\t\t\t\t\t if (limit < abs) limit = abs;\n\t\t\t\t\t\t sample /= limit * 0.75 + 0.25;\n\t\t\t\t\t\t sample *= volume;\n\t\t\t\t\t\t data[bufferIndex] = sample;\n\t\t\t\t\t\t bufferIndex = bufferIndex + 1;\n\t\t\t\t\t\t samples--;\n\t\t\t\t\t }\n\t\t\t\t\t\n\t\t\t\t\t synth.channelPlayheadA[#] = channel#PlayheadA; // PITCH\n\t\t\t\t\t synth.channelPlayheadB[#] = channel#PlayheadB; // PITCH\n\t\t\t\t\t synth.channelPlayheadA[#] = channel#Playhead; // DRUM\n\t\t\t\t\t synth.channelSample[#] = channel#Sample; // ALL\n\t\t\t\t\t\n\t\t\t\t\t synth.delayPos = delayPos;\n\t\t\t\t\t synth.delayFeedback0 = delayFeedback0;\n\t\t\t\t\t synth.delayFeedback1 = delayFeedback1;\n\t\t\t\t\t synth.delayFeedback2 = delayFeedback2;\n\t\t\t\t\t synth.delayFeedback3 = delayFeedback3;\n\t\t\t\t\t synth.limit = limit;\n\t\t\t\t\t\n\t\t\t\t\t if (effectYMult * effectY - prevEffectY > prevEffectY) {\n\t\t\t\t\t\t synth.effectPlayhead = Math.asin(effectY);\n\t\t\t\t\t } else {\n\t\t\t\t\t\t synth.effectPlayhead = Math.PI - Math.asin(effectY);\n\t\t\t\t\t }\n\t\t\t\t\t\n\t\t\t\t\t if (synth.arpeggioSampleCountdown == 0) {\n\t\t\t\t\t\t synth.arpeggio++;\n\t\t\t\t\t\t synth.arpeggioSampleCountdown = samplesPerArpeggio;\n\t\t\t\t\t\t if (synth.arpeggio == 4) {\n\t\t\t\t\t\t\t synth.arpeggio = 0;\n\t\t\t\t\t\t\t synth.part++;\n\t\t\t\t\t\t\t if (synth.part == song.partsPerBeat) {\n\t\t\t\t\t\t\t\t synth.part = 0;\n\t\t\t\t\t\t\t\t synth.beat++;\n\t\t\t\t\t\t\t\t if (synth.beat == song.beatsPerBar) {\n\t\t\t\t\t\t\t\t\t synth.beat = 0;\n\t\t\t\t\t\t\t\t\t synth.effectPlayhead = 0.0;\n\t\t\t\t\t\t\t\t\t synth.bar++;\n\t\t\t\t\t\t\t\t\t if (synth.bar < song.loopStart) {\n\t\t\t\t\t\t\t\t\t\t if (!synth.enableIntro) synth.bar = song.loopStart;\n\t\t\t\t\t\t\t\t\t } else {\n\t\t\t\t\t\t\t\t\t\t synth.enableIntro = false;\n\t\t\t\t\t\t\t\t\t }\n\t\t\t\t\t\t\t\t\t if (synth.bar >= song.loopStart + song.loopLength) {\n\t\t\t\t\t\t\t\t\t\t if (synth.loopCount > 0) synth.loopCount--;\n\t\t\t\t\t\t\t\t\t\t if (synth.loopCount > 0 || !synth.enableOutro) {\n\t\t\t\t\t\t\t\t\t\t\t synth.bar = song.loopStart;\n\t\t\t\t\t\t\t\t\t\t }\n\t\t\t\t\t\t\t\t\t }\n\t\t\t\t\t\t\t\t\t if (synth.bar >= song.barCount) {\n\t\t\t\t\t\t\t\t\t\t synth.bar = 0;\n\t\t\t\t\t\t\t\t\t\t synth.enableIntro = true;\n\t\t\t\t\t\t\t\t\t\t ended = true;\n\t\t\t\t\t\t\t\t\t\t synth.pause();\n\t\t\t\t\t\t\t\t\t }\n\t\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\t // The bar changed, may need to reinitialize instruments.\n\t\t\t\t\t\t\t\t\t break;\n\t\t\t\t\t\t\t\t }\n\t\t\t\t\t\t\t }\n\t\t\t\t\t\t }\n\t\t\t\t\t }\n\t\t\t\t }\n\t\t\t }\n\t\t\t\n\t\t\t synth.playheadInternal = (((synth.arpeggio + 1.0 - synth.arpeggioSampleCountdown / samplesPerArpeggio) / 4.0 + synth.part) / song.partsPerBeat + synth.beat) / song.beatsPerBar + synth.bar;\n\t\t ".split("\n");
    beepbox.Synth = Synth;
})(beepbox || (beepbox = {}));
var beepbox;
(function (beepbox) {
    var ChangeNotifier = (function () {
        function ChangeNotifier() {
            this._watchers = [];
            this._dirty = false;
        }
        ChangeNotifier.prototype.watch = function (watcher) {
            if (this._watchers.indexOf(watcher) == -1) {
                this._watchers.push(watcher);
            }
        };
        ChangeNotifier.prototype.unwatch = function (watcher) {
            var index = this._watchers.indexOf(watcher);
            if (index != -1) {
                this._watchers.splice(index, 1);
            }
        };
        ChangeNotifier.prototype.changed = function () {
            this._dirty = true;
        };
        ChangeNotifier.prototype.notifyWatchers = function () {
            if (!this._dirty)
                return;
            this._dirty = false;
            for (var _i = 0, _a = this._watchers.concat(); _i < _a.length; _i++) {
                var watcher = _a[_i];
                watcher();
            }
        };
        return ChangeNotifier;
    }());
    beepbox.ChangeNotifier = ChangeNotifier;
})(beepbox || (beepbox = {}));
var beepbox;
(function (beepbox) {
    var SongDocument = (function () {
        function SongDocument(string) {
            var _this = this;
            this.history = this;
            this.notifier = new beepbox.ChangeNotifier();
            this.channel = 0;
            this.bar = 0;
            this.volume = 75;
            this.barScrollPos = 0;
            this.prompt = null;
            this._recentChange = null;
            this._sequenceNumber = 0;
            this._barFromCurrentState = 0;
            this._channelFromCurrentState = 0;
            this._shouldPushState = false;
            this._waitingToUpdateState = false;
            this._whenHistoryStateChanged = function () {
                var state = window.history.state;
                if (state && state.sequenceNumber == _this._sequenceNumber)
                    return;
                if (state == null) {
                    _this._sequenceNumber++;
                    state = { canUndo: true, sequenceNumber: _this._sequenceNumber, bar: _this.bar, channel: _this.channel, prompt: _this.prompt };
                    new beepbox.ChangeSong(_this, location.hash);
                    window.history.replaceState(state, "", "#" + _this.song.toBase64String());
                }
                else {
                    if (state.sequenceNumber == _this._sequenceNumber - 1) {
                        _this.bar = _this._barFromCurrentState;
                        _this.channel = _this._channelFromCurrentState;
                    }
                    else if (state.sequenceNumber != _this._sequenceNumber) {
                        _this.bar = state.bar;
                        _this.channel = state.channel;
                    }
                    _this._sequenceNumber = state.sequenceNumber;
                    _this.prompt = state.prompt;
                    new beepbox.ChangeSong(_this, location.hash);
                }
                _this._barFromCurrentState = state.bar;
                _this._channelFromCurrentState = state.channel;
                _this.forgetLastChange();
                _this.notifier.notifyWatchers();
            };
            this._cleanDocument = function () {
                _this.notifier.notifyWatchers();
            };
            this._updateHistoryState = function () {
                _this._waitingToUpdateState = false;
                var hash = "#" + _this.song.toBase64String();
                var state;
                if (_this._shouldPushState) {
                    _this._sequenceNumber++;
                    state = { canUndo: true, sequenceNumber: _this._sequenceNumber, bar: _this.bar, channel: _this.channel, prompt: _this.prompt };
                    window.history.pushState(state, "", hash);
                }
                else {
                    state = { canUndo: true, sequenceNumber: _this._sequenceNumber, bar: _this.bar, channel: _this.channel, prompt: _this.prompt };
                    window.history.replaceState(state, "", hash);
                }
                _this._barFromCurrentState = state.bar;
                _this._channelFromCurrentState = state.channel;
                _this._shouldPushState = false;
            };
            this.song = new beepbox.Song(string);
            this.synth = new beepbox.Synth(this.song);
            this.showFifth = localStorage.getItem("showFifth") == "true";
			this.showMore = localStorage.getItem("showMore") == "true";
            this.showLetters = localStorage.getItem("showLetters") == "true";
            this.showChannels = localStorage.getItem("showChannels") == "true";
            this.showScrollBar = localStorage.getItem("showScrollBar") == "true";
            if (localStorage.getItem("volume") != null)
                this.volume = Number(localStorage.getItem("volume"));
            this.synth.volume = this._calcVolume();
            var state = window.history.state;
            if (state == null) {
                state = { canUndo: false, sequenceNumber: 0, bar: 0, channel: 0, prompt: this.prompt };
                window.history.replaceState(state, "", "#" + this.song.toBase64String());
            }
            window.addEventListener("hashchange", this._whenHistoryStateChanged);
            window.addEventListener("popstate", this._whenHistoryStateChanged);
            this.bar = state.bar;
            this.channel = state.channel;
            this._barFromCurrentState = state.bar;
            this._channelFromCurrentState = state.channel;
            this.barScrollPos = Math.max(0, this.bar - 15);
            for (var _i = 0, _a = ["input", "change", "click", "keyup", "keydown", "mousedown", "mousemove", "mouseup", "touchstart", "touchmove", "touchend", "touchcancel"]; _i < _a.length; _i++) {
                var eventName = _a[_i];
                window.addEventListener(eventName, this._cleanDocument);
            }
        }
        SongDocument.prototype.record = function (change, continuingChange) {
            if (continuingChange === void 0) { continuingChange = false; }
            if (change.isNoop()) {
                this._recentChange = null;
                if (continuingChange) {
                    window.history.back();
                }
            }
            else {
                this._recentChange = change;
                this._shouldPushState = this._shouldPushState || !continuingChange;
                if (!this._waitingToUpdateState) {
                    window.requestAnimationFrame(this._updateHistoryState);
                    this._waitingToUpdateState = true;
                }
            }
        };
        SongDocument.prototype.openPrompt = function (prompt) {
            this.prompt = prompt;
            var hash = "#" + this.song.toBase64String();
            this._sequenceNumber++;
            var state = { canUndo: true, sequenceNumber: this._sequenceNumber, bar: this.bar, channel: this.channel, prompt: this.prompt };
            window.history.pushState(state, "", hash);
        };
        SongDocument.prototype.undo = function () {
            var state = window.history.state;
            if (state.canUndo)
                window.history.back();
        };
        SongDocument.prototype.redo = function () {
            window.history.forward();
        };
        SongDocument.prototype.setProspectiveChange = function (change) {
            this._recentChange = change;
        };
        SongDocument.prototype.forgetLastChange = function () {
            this._recentChange = null;
        };
        SongDocument.prototype.lastChangeWas = function (change) {
            return change != null && change == this._recentChange;
        };
        SongDocument.prototype.savePreferences = function () {
            localStorage.setItem("showFifth", this.showFifth ? "true" : "false");
			localStorage.setItem("showMore", this.showMore ? "true" : "false");
            localStorage.setItem("showLetters", this.showLetters ? "true" : "false");
            localStorage.setItem("showChannels", this.showChannels ? "true" : "false");
            localStorage.setItem("showScrollBar", this.showScrollBar ? "true" : "false");
            localStorage.setItem("volume", String(this.volume));
        };
        SongDocument.prototype.setVolume = function (val) {
            this.volume = val;
            this.savePreferences();
            this.synth.volume = this._calcVolume();
        };
        SongDocument.prototype._calcVolume = function () {
            return Math.min(1.0, Math.pow(this.volume / 50.0, 0.5)) * Math.pow(2.0, (this.volume - 75.0) / 25.0);
        };
        SongDocument.prototype.getCurrentPattern = function () {
            return this.song.getPattern(this.channel, this.bar);
        };
        SongDocument.prototype.getCurrentInstrument = function () {
            var pattern = this.getCurrentPattern();
            return pattern == null ? 0 : pattern.instrument;
        };
        return SongDocument;
    }());
    SongDocument._latestVersion = 2;
    beepbox.SongDocument = SongDocument;
})(beepbox || (beepbox = {}));
var beepbox;
(function (beepbox) {
    var html;
    (function (html) {
        function element(type, attributes, children) {
            var elem = document.createElement(type);
            if (attributes)
                for (var _i = 0, _a = Object.keys(attributes); _i < _a.length; _i++) {
                    var key = _a[_i];
                    if (key == "style")
                        elem.setAttribute(key, attributes[key]);
                    else
                        elem[key] = attributes[key];
                }
            if (children)
                for (var _b = 0, children_1 = children; _b < children_1.length; _b++) {
                    var child = children_1[_b];
                    elem.appendChild(child);
                }
            return elem;
        }
        html.element = element;
        function button(attributes, children) {
            return element("button", attributes, children);
        }
        html.button = button;
        function div(attributes, children) {
            return element("div", attributes, children);
        }
        html.div = div;
        function span(attributes, children) {
            return element("span", attributes, children);
        }
        html.span = span;
        function select(attributes, children) {
            return element("select", attributes, children);
        }
        html.select = select;
        function option(value, display, selected, disabled) {
            if (selected === void 0) { selected = false; }
            if (disabled === void 0) { disabled = false; }
            var o = document.createElement("option");
            o.value = value;
            o.selected = selected;
            o.disabled = disabled;
            o.appendChild(text(display));
            return o;
        }
        html.option = option;
        function canvas(attributes) {
            return element("canvas", attributes);
        }
        html.canvas = canvas;
        function input(attributes) {
            return element("input", attributes);
        }
        html.input = input;
        function br() {
            return element("br");
        }
        html.br = br;
        function text(content) {
            return document.createTextNode(content);
        }
        html.text = text;
    })(html = beepbox.html || (beepbox.html = {}));
    var svgNS = "http://www.w3.org/2000/svg";
    function svgElement(type, attributes, children) {
        var elem = document.createElementNS(svgNS, type);
        if (attributes)
            for (var _i = 0, _a = Object.keys(attributes); _i < _a.length; _i++) {
                var key = _a[_i];
                elem.setAttribute(key, attributes[key]);
            }
        if (children)
            for (var _b = 0, children_2 = children; _b < children_2.length; _b++) {
                var child = children_2[_b];
                elem.appendChild(child);
            }
        return elem;
    }
    beepbox.svgElement = svgElement;
})(beepbox || (beepbox = {}));
var beepbox;
(function (beepbox) {
    var styleSheet = document.createElement('style');
    styleSheet.type = "text/css";
    styleSheet.appendChild(document.createTextNode("\n\n.beepboxEditor {\n\t/* For some reason the default focus outline effect causes the entire editor to get repainted when any part of it changes. Border doesn't do that. */\n\tmargin: -3px;\n\tborder: 3px solid transparent;\n\twidth: 887px;\n\tdisplay: flex;\n\tflex-direction: row;\n\t-webkit-touch-callout: none;\n\t-webkit-user-select: none;\n\t-khtml-user-select: none;\n\t-moz-user-select: none;\n\t-ms-user-select: none;\n\tuser-select: none;\n\tposition: relative;\n\ttouch-action: manipulation;\n\tcursor: default;\n\tfont-size: small;\n}\n.beepboxEditor:focus {\n\toutline: none;\n\tborder-color: #555;\n}\n\n.beepboxEditor div {\n\tmargin: 0;\n\tpadding: 0;\n}\n\n.beepboxEditor .promptContainer {\n\tposition: absolute;\n\ttop: 0;\n\tleft: 0;\n\twidth: 100%;\n\theight: 100%;\n\tbackground: rgba(0,0,0,0.5);\n\tdisplay: flex;\n\tjustify-content: center;\n\talign-items: center;\n}\n\n.beepboxEditor .prompt {\n\tmargin: auto;\n\ttext-align: center;\n\tbackground: #000;\n\tborder-radius: 15px;\n\tborder: 4px solid #444;\n\tcolor: #fff;\n\tpadding: 20px;\n\tdisplay: flex;\n\tflex-direction: column;\n}\n\n.beepboxEditor .prompt > *:not(:first-child) {\n\tmargin-top: 1.5em;\n}\n\n/* Use psuedo-elements to add cross-browser up & down arrows to select elements: */\n.beepboxEditor .selectContainer {\n\tposition: relative;\n}\n.beepboxEditor .selectContainer::before {\n\tcontent: \"\";\n\tposition: absolute;\n\tright: 0.5em;\n\ttop: 0.4em;\n\tborder-bottom: 0.4em solid currentColor;\n\tborder-left: 0.3em solid transparent;\n\tborder-right: 0.3em solid transparent;\n\tpointer-events: none;\n}\n.beepboxEditor .selectContainer::after {\n\tcontent: \"\";\n\tposition: absolute;\n\tright: 0.5em;\n\tbottom: 0.4em;\n\tborder-top: 0.4em solid currentColor;\n\tborder-left: 0.3em solid transparent;\n\tborder-right: 0.3em solid transparent;\n\tpointer-events: none;\n}\n.beepboxEditor select {\n\tmargin: 0;\n\tpadding: 0 0.5em;\n\tdisplay: block;\n\theight: 2em;\n\tborder: none;\n\tborder-radius: 0.4em;\n\tbackground: #444444;\n\tcolor: inherit;\n\tfont-size: inherit;\n\tcursor: pointer;\n\n\t-webkit-appearance:none;\n\t-moz-appearance: none;\n\tappearance: none;\n}\n.beepboxEditor select:focus {\n\tbackground: #777777;\n\toutline: none;\n}\n/* This makes it look better in firefox on my computer... What about others?\n@-moz-document url-prefix() {\n\t.beepboxEditor select { padding: 0 2px; }\n}\n*/\n.beepboxEditor button {\n\tmargin: 0;\n\tposition: relative;\n\theight: 2em;\n\tborder: none;\n\tborder-radius: 0.4em;\n\tbackground: #444;\n\tcolor: inherit;\n\tfont-size: inherit;\n\tcursor: pointer;\n}\n.beepboxEditor button:focus {\n\tbackground: #777;\n\toutline: none;\n}\n.beepboxEditor button.playButton::before {\n\tcontent: \"\";\n\tposition: absolute;\n\tleft: 50%;\n\ttop: 50%;\n\tmargin-left: -0.45em;\n\tmargin-top: -0.65em;\n\tborder-left: 1em solid currentColor;\n\tborder-top: 0.65em solid transparent;\n\tborder-bottom: 0.65em solid transparent;\n\tpointer-events: none;\n}\n.beepboxEditor button.pauseButton::before {\n\tcontent: \"\";\n\tposition: absolute;\n\tleft: 50%;\n\ttop: 50%;\n\tmargin-left: -0.5em;\n\tmargin-top: -0.65em;\n\twidth: 0.3em;\n\theight: 1.3em;\n\tbackground: currentColor;\n\tpointer-events: none;\n}\n.beepboxEditor button.pauseButton::after {\n\tcontent: \"\";\n\tposition: absolute;\n\tleft: 50%;\n\ttop: 50%;\n\tmargin-left: 0.2em;\n\tmargin-top: -0.65em;\n\twidth: 0.3em;\n\theight: 1.3em;\n\tbackground: currentColor;\n\tpointer-events: none;\n}\n\n.beepboxEditor canvas {\n\toverflow: hidden;\n\tposition: absolute;\n\tdisplay: block;\n}\n\n.beepboxEditor .selectRow {\n\tmargin: 0;\n\theight: 2.5em;\n\tdisplay: flex;\n\tflex-direction: row;\n\talign-items: center;\n\tjustify-content: space-between;\n}\n\n.beepboxEditor .selectRow > span {\n\tcolor: #999;\n}\n\n.beepboxEditor .editor-right-side {\n\tmargin-left: 6px;\n\twidth: 182px;\n\theight: 700px;\n\tdisplay: flex;\n\tflex-direction: column;\n}\n\n.beepboxEditor .editor-right-side > * {\n\tflex-shrink: 0;\n}\n\n.beepboxEditor .editor-right-most-side {\n\tmargin-left: 6px;\n\twidth: 182px;\n\theight: 700px;\n\tdisplay: flex;\n\tflex-direction: column;\n}\n\n.beepboxEditor .editor-right-most-side > * {\n\tflex-shrink: 0;\n}\n\n\n.beepboxEditor input[type=text], .beepboxEditor input[type=number] {\n\tfont-size: inherit;\n\tbackground: transparent;\n\tborder: 1px solid #777;\n\tcolor: white;\n}\n\n.beepboxEditor input[type=checkbox] {\n  transform: scale(1.5);\n}\n\n.beepboxEditor input[type=range] {\n\t-webkit-appearance: none;\n\tcolor: inherit;\n\twidth: 100%;\n\theight: 2em;\n\tfont-size: inherit;\n\tmargin: 0;\n\tcursor: pointer;\n\tbackground-color: black;\n}\n.beepboxEditor input[type=range]:focus {\n\toutline: none;\n}\n.beepboxEditor input[type=range]::-webkit-slider-runnable-track {\n\twidth: 100%;\n\theight: 0.5em;\n\tcursor: pointer;\n\tbackground: #444;\n}\n.beepboxEditor input[type=range]::-webkit-slider-thumb {\n\theight: 2em;\n\twidth: 0.5em;\n\tborder-radius: 0.25em;\n\tbackground: currentColor;\n\tcursor: pointer;\n\t-webkit-appearance: none;\n\tmargin-top: -0.75em;\n}\n.beepboxEditor input[type=range]:focus::-webkit-slider-runnable-track {\n\tbackground: #777;\n}\n.beepboxEditor input[type=range]::-moz-range-track {\n\twidth: 100%;\n\theight: 0.5em;\n\tcursor: pointer;\n\tbackground: #444;\n}\n.beepboxEditor input[type=range]:focus::-moz-range-track {\n\tbackground: #777;\n}\n.beepboxEditor input[type=range]::-moz-range-thumb {\n\theight: 2em;\n\twidth: 0.5em;\n\tborder-radius: 0.25em;\n\tborder: none;\n\tbackground: currentColor;\n\tcursor: pointer;\n}\n.beepboxEditor input[type=range]::-ms-track {\n\twidth: 100%;\n\theight: 0.5em;\n\tcursor: pointer;\n\tbackground: #444;\n\tborder-color: transparent;\n}\n.beepboxEditor input[type=range]:focus::-ms-track {\n\tbackground: #777;\n}\n.beepboxEditor input[type=range]::-ms-thumb {\n\theight: 2em;\n\twidth: 0.5em;\n\tborder-radius: 0.25em;\n\tbackground: currentColor;\n\tcursor: pointer;\n}\n\n"));
    document.head.appendChild(styleSheet);
})(beepbox || (beepbox = {}));
var beepbox;
(function (beepbox) {
    function prettyNumber(value) {
        return value.toFixed(2).replace(/\.?0*$/, "");
    }
    function makeEmptyReplacementElement(node) {
        var clone = node.cloneNode(false);
        node.parentNode.replaceChild(clone, node);
        return clone;
    }
    var PatternCursor = (function () {
        function PatternCursor() {
            this.valid = false;
            this.prevNote = null;
            this.curNote = null;
            this.nextNote = null;
            this.pitch = 0;
            this.pitchIndex = -1;
            this.curIndex = 0;
            this.start = 0;
            this.end = 0;
            this.part = 0;
            this.notePart = 0;
            this.nearPinIndex = 0;
            this.pins = [];
        }
        return PatternCursor;
    }());
    var PatternEditor = (function () {
        function PatternEditor(_doc) {
            var _this = this;
            this._doc = _doc;
            this._svgNoteBackground = beepbox.svgElement("pattern", { id: "patternEditorNoteBackground", x: "0", y: "0", width: "64", height: "156", patternUnits: "userSpaceOnUse" });
            this._svgDrumBackground = beepbox.svgElement("pattern", { id: "patternEditorDrumBackground", x: "0", y: "0", width: "64", height: "40", patternUnits: "userSpaceOnUse" });
            this._svgBackground = beepbox.svgElement("rect", { x: "0", y: "0", width: "512", height: "481", "pointer-events": "none", fill: "url(#patternEditorNoteBackground)" });
            this._svgNoteContainer = beepbox.svgElement("svg");
            this._svgPlayhead = beepbox.svgElement("rect", { id: "", x: "0", y: "0", width: "4", height: "481", fill: "white", "pointer-events": "none" });
            this._svgPreview = beepbox.svgElement("path", { fill: "none", stroke: "white", "stroke-width": "2", "pointer-events": "none" });
            this._svg = beepbox.svgElement("svg", { style: "background-color: #000000; touch-action: none; position: absolute;", width: "512", height: "481" }, [
                beepbox.svgElement("defs", undefined, [
                    this._svgNoteBackground,
                    this._svgDrumBackground,
                ]),
                this._svgBackground,
                this._svgNoteContainer,
                this._svgPreview,
                this._svgPlayhead,
            ]);
            this.container = beepbox.html.div({ style: "height: 481px; overflow:hidden; position: relative;" }, [this._svg]);
            this._defaultPitchHeight = 13;
            this._defaultDrumHeight = 40;
            this._backgroundPitchRows = [];
            this._backgroundDrumRow = beepbox.svgElement("rect");
            this._defaultPinChannels = [
                [beepbox.makeNotePin(0, 0, 3), beepbox.makeNotePin(0, 2, 3)],
                [beepbox.makeNotePin(0, 0, 3), beepbox.makeNotePin(0, 2, 3)],
                [beepbox.makeNotePin(0, 0, 3), beepbox.makeNotePin(0, 2, 3)],
                [beepbox.makeNotePin(0, 0, 3), beepbox.makeNotePin(0, 2, 0)],
            ];
            this._editorHeight = 481;
            this._mouseX = 0;
            this._mouseY = 0;
            this._mouseDown = false;
            this._mouseOver = false;
            this._mouseDragging = false;
            this._mouseHorizontal = false;
            this._copiedPinChannels = [];
            this._mouseXStart = 0;
            this._mouseYStart = 0;
            this._mouseXPrev = 0;
            this._mouseYPrev = 0;
            this._dragChange = null;
            this._cursor = new PatternCursor();
            this._pattern = null;
            this._playheadX = 0.0;
            this._octaveOffset = 0;
            this._renderedWidth = -1;
            this._renderedBeatWidth = -1;
            this._renderedFifths = false;
			this._renderedMore = false;
            this._renderedDrums = false;
            this._renderedPartsPerBeat = -1;
            this._renderedPitchChannelCount = -1;
            this._renderedDrumChannelCount = -1;
            this.resetCopiedPins = function () {
                var maxDivision = _this._getMaxDivision();
                _this._copiedPinChannels.length = _this._doc.song.getChannelCount();
                for (var i = 0; i < _this._doc.song.pitchChannelCount; i++) {
                    _this._copiedPinChannels[i] = [beepbox.makeNotePin(0, 0, 3), beepbox.makeNotePin(0, maxDivision, 3)];
                }
                for (var i = _this._doc.song.pitchChannelCount; i < _this._doc.song.getChannelCount(); i++) {
                    _this._copiedPinChannels[i] = [beepbox.makeNotePin(0, 0, 3), beepbox.makeNotePin(0, maxDivision, 0)];
                }
            };
            this._animatePlayhead = function (timestamp) {
                if (!_this._doc.synth.playing || _this._pattern == null || _this._doc.song.getPattern(_this._doc.channel, Math.floor(_this._doc.synth.playhead)) != _this._pattern) {
                    _this._svgPlayhead.setAttribute("visibility", "hidden");
                }
                else {
                    _this._svgPlayhead.setAttribute("visibility", "visible");
                    var modPlayhead = _this._doc.synth.playhead - Math.floor(_this._doc.synth.playhead);
                    if (Math.abs(modPlayhead - _this._playheadX) > 0.1) {
                        _this._playheadX = modPlayhead;
                    }
                    else {
                        _this._playheadX += (modPlayhead - _this._playheadX) * 0.2;
                    }
                    _this._svgPlayhead.setAttribute("x", "" + prettyNumber(_this._playheadX * _this._editorWidth - 2));
                }
                window.requestAnimationFrame(_this._animatePlayhead);
            };
            this._whenMouseOver = function (event) {
                if (_this._mouseOver)
                    return;
                _this._mouseOver = true;
            };
            this._whenMouseOut = function (event) {
                if (!_this._mouseOver)
                    return;
                _this._mouseOver = false;
            };
            this._whenMousePressed = function (event) {
                event.preventDefault();
                if (_this._pattern == null)
                    return;
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = (event.clientX || event.pageX) - boundingRect.left;
                _this._mouseY = (event.clientY || event.pageY) - boundingRect.top;
                _this._whenCursorPressed();
            };
            this._whenTouchPressed = function (event) {
                event.preventDefault();
                if (_this._pattern == null)
                    return;
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = event.touches[0].clientX - boundingRect.left;
                _this._mouseY = event.touches[0].clientY - boundingRect.top;
                _this._whenCursorPressed();
            };
            this._whenMouseMoved = function (event) {
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = (event.clientX || event.pageX) - boundingRect.left;
                _this._mouseY = (event.clientY || event.pageY) - boundingRect.top;
                _this._whenCursorMoved();
            };
            this._whenTouchMoved = function (event) {
                if (!_this._mouseDown)
                    return;
                event.preventDefault();
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = event.touches[0].clientX - boundingRect.left;
                _this._mouseY = event.touches[0].clientY - boundingRect.top;
                _this._whenCursorMoved();
            };
            this._whenCursorReleased = function (event) {
                if (!_this._cursor.valid)
                    return;
                if (_this._pattern == null)
                    return;
                var continuousChange = _this._doc.history.lastChangeWas(_this._dragChange);
                if (_this._mouseDragging && continuousChange) {
                    if (_this._dragChange != null) {
                        _this._doc.history.record(_this._dragChange);
                        _this._dragChange = null;
                    }
                }
                else if (_this._mouseDown && continuousChange) {
                    if (_this._cursor.curNote == null) {
                        var note = beepbox.makeNote(_this._cursor.pitch, _this._cursor.start, _this._cursor.end, 3, _this._doc.song.getChannelIsDrum(_this._doc.channel));
                        note.pins = [];
                        for (var _i = 0, _a = _this._cursor.pins; _i < _a.length; _i++) {
                            var oldPin = _a[_i];
                            note.pins.push(beepbox.makeNotePin(0, oldPin.time, oldPin.volume));
                        }
                        _this._doc.history.record(new beepbox.ChangeNoteAdded(_this._doc, _this._pattern, note, _this._cursor.curIndex));
                    }
                    else {
                        if (_this._cursor.pitchIndex == -1) {
                            var sequence = new beepbox.ChangeSequence();
                            if (_this._cursor.curNote.pitches.length == 4) {
                                sequence.append(new beepbox.ChangePitchAdded(_this._doc, _this._pattern, _this._cursor.curNote, _this._cursor.curNote.pitches[0], 0, true));
                            }
                            sequence.append(new beepbox.ChangePitchAdded(_this._doc, _this._pattern, _this._cursor.curNote, _this._cursor.pitch, _this._cursor.curNote.pitches.length));
                            _this._doc.history.record(sequence);
                            _this._copyPins(_this._cursor.curNote);
                        }
                        else {
                            if (_this._cursor.curNote.pitches.length == 1) {
                                _this._doc.history.record(new beepbox.ChangeNoteAdded(_this._doc, _this._pattern, _this._cursor.curNote, _this._cursor.curIndex, true));
                            }
                            else {
                                _this._doc.history.record(new beepbox.ChangePitchAdded(_this._doc, _this._pattern, _this._cursor.curNote, _this._cursor.pitch, _this._cursor.curNote.pitches.indexOf(_this._cursor.pitch), true));
                            }
                        }
                    }
                }
                _this._mouseDown = false;
                _this._mouseDragging = false;
                _this._updateCursorStatus();
                _this._updatePreview();
            };
            this._documentChanged = function () {
                _this._editorWidth = _this._doc.showLetters ? (_this._doc.showScrollBar ? 460 : 480) : (_this._doc.showScrollBar ? 492 : 512);
                _this._pattern = _this._doc.getCurrentPattern();
                _this._partWidth = _this._editorWidth / (_this._doc.song.beatsPerBar * _this._doc.song.partsPerBeat);
                _this._pitchHeight = _this._doc.song.getChannelIsDrum(_this._doc.channel) ? _this._defaultDrumHeight : _this._defaultPitchHeight;
                _this._pitchCount = _this._doc.song.getChannelIsDrum(_this._doc.channel) ? beepbox.Config.drumCount : beepbox.Config.pitchCount;
                _this._octaveOffset = _this._doc.song.channelOctaves[_this._doc.channel] * 12;
                if (_this._renderedPartsPerBeat != _this._doc.song.partsPerBeat ||
                    _this._renderedPitchChannelCount != _this._doc.song.pitchChannelCount ||
                    _this._renderedDrumChannelCount != _this._doc.song.drumChannelCount) {
                    _this._renderedPartsPerBeat = _this._doc.song.partsPerBeat;
                    _this._renderedPitchChannelCount = _this._doc.song.pitchChannelCount;
                    _this._renderedDrumChannelCount = _this._doc.song.drumChannelCount;
                    _this.resetCopiedPins();
                }
                _this._copiedPins = _this._copiedPinChannels[_this._doc.channel];
                if (_this._renderedWidth != _this._editorWidth) {
                    _this._renderedWidth = _this._editorWidth;
                    _this._svg.setAttribute("width", "" + _this._editorWidth);
                    _this._svgBackground.setAttribute("width", "" + _this._editorWidth);
                }
                var beatWidth = _this._editorWidth / _this._doc.song.beatsPerBar;
                if (_this._renderedBeatWidth != beatWidth) {
                    _this._renderedBeatWidth = beatWidth;
                    _this._svgNoteBackground.setAttribute("width", "" + beatWidth);
                    _this._svgDrumBackground.setAttribute("width", "" + beatWidth);
                    _this._backgroundDrumRow.setAttribute("width", "" + (beatWidth - 2));
                    for (var j = 0; j < 12; j++) {
                        _this._backgroundPitchRows[j].setAttribute("width", "" + (beatWidth - 2));
                    }
                }
                if (!_this._mouseDown)
                    _this._updateCursorStatus();
                _this._svgNoteContainer = makeEmptyReplacementElement(_this._svgNoteContainer);
                _this._updatePreview();
                if (_this._pattern == null) {
                    _this._svg.style.visibility = "hidden";
                    return;
                }
                _this._svg.style.visibility = "visible";
                if (_this._renderedFifths != _this._doc.showFifth) {
                    _this._renderedFifths = _this._doc.showFifth;
                    _this._backgroundPitchRows[7].setAttribute("fill", _this._doc.showFifth ? fifthNoteColorPallet[_this._doc.song.theme] : "#444444");
                }
				
				if (_this._renderedMore != _this._doc.showMore) {
                    _this._renderedMore = _this._doc.showMore;
                    _this._backgroundPitchRows[1].setAttribute("fill", _this._doc.showMore ? secondNoteColorPallet[_this._doc.song.theme] : "#444444");
					_this._backgroundPitchRows[2].setAttribute("fill", _this._doc.showMore ? thirdNoteColorPallet[_this._doc.song.theme] : "#444444");
					_this._backgroundPitchRows[3].setAttribute("fill", _this._doc.showMore ? fourthNoteColorPallet[_this._doc.song.theme] : "#444444");
					_this._backgroundPitchRows[4].setAttribute("fill", _this._doc.showMore ? sixthNoteColorPallet[_this._doc.song.theme] : "#444444");
					_this._backgroundPitchRows[5].setAttribute("fill", _this._doc.showMore ? seventhNoteColorPallet[_this._doc.song.theme] : "#444444");
					_this._backgroundPitchRows[6].setAttribute("fill", _this._doc.showMore ? eigthNoteColorPallet[_this._doc.song.theme] : "#444444");
					_this._backgroundPitchRows[8].setAttribute("fill", _this._doc.showMore ? ninthNoteColorPallet[_this._doc.song.theme] : "#444444");
					_this._backgroundPitchRows[9].setAttribute("fill", _this._doc.showMore ? tenNoteColorPallet[_this._doc.song.theme] : "#444444");
					_this._backgroundPitchRows[10].setAttribute("fill", _this._doc.showMore ? elevenNoteColorPallet[_this._doc.song.theme] : "#444444");
					_this._backgroundPitchRows[11].setAttribute("fill", _this._doc.showMore ? twelveNoteColorPallet[_this._doc.song.theme] : "#444444");
                }
				for (var j = 0; j < 12; j++) {
                    _this._backgroundPitchRows[j].style.visibility = beepbox.Config.scaleFlags[_this._doc.song.scale][j] ? "visible" : "hidden";
                }
                if (_this._doc.song.getChannelIsDrum(_this._doc.channel)) {
                    if (!_this._renderedDrums) {
                        _this._renderedDrums = true;
                        _this._svgBackground.setAttribute("fill", "url(#patternEditorDrumBackground)");
                        _this._svgBackground.setAttribute("height", "" + (_this._defaultDrumHeight * beepbox.Config.drumCount));
                        _this._svg.setAttribute("height", "" + (_this._defaultDrumHeight * beepbox.Config.drumCount));
                    }
                }
                else {
                    if (_this._renderedDrums) {
                        _this._renderedDrums = false;
                        _this._svgBackground.setAttribute("fill", "url(#patternEditorNoteBackground)");
                        _this._svgBackground.setAttribute("height", "" + _this._editorHeight);
                        _this._svg.setAttribute("height", "" + _this._editorHeight);
                    }
                }
                if (_this._doc.showChannels) {
                    for (var channel = _this._doc.song.getChannelCount() - 1; channel >= 0; channel--) {
                        if (channel == _this._doc.channel)
                            continue;
                        if (_this._doc.song.getChannelIsDrum(channel) != _this._doc.song.getChannelIsDrum(_this._doc.channel))
                            continue;
                        var pattern2 = _this._doc.song.getPattern(channel, _this._doc.bar);
                        if (pattern2 == null)
                            continue;
                        for (var _i = 0, _a = pattern2.notes; _i < _a.length; _i++) {
                            var note = _a[_i];
                            for (var _b = 0, _c = note.pitches; _b < _c.length; _b++) {
                                var pitch = _c[_b];
                                var notePath = beepbox.svgElement("path");
                                notePath.setAttribute("fill", _this._doc.song.getNoteColorDim(channel));
                                notePath.setAttribute("pointer-events", "none");
                                _this._drawNote(notePath, pitch, note.start, note.pins, _this._pitchHeight * 0.19, false, _this._doc.song.channelOctaves[channel] * 12);
                                _this._svgNoteContainer.appendChild(notePath);
                            }
                        }
                    }
                }
                for (var _d = 0, _e = _this._pattern.notes; _d < _e.length; _d++) {
                    var note = _e[_d];
                    for (var _f = 0, _g = note.pitches; _f < _g.length; _f++) {
                        var pitch = _g[_f];
                        var notePath = beepbox.svgElement("path");
                        notePath.setAttribute("fill", _this._doc.song.getNoteColorDim(_this._doc.channel));
                        notePath.setAttribute("pointer-events", "none");
                        _this._drawNote(notePath, pitch, note.start, note.pins, _this._pitchHeight / 2 + 1, false, _this._octaveOffset);
                        _this._svgNoteContainer.appendChild(notePath);
                        notePath = beepbox.svgElement("path");
                        notePath.setAttribute("fill", _this._doc.song.getNoteColorBright(_this._doc.channel));
                        notePath.setAttribute("pointer-events", "none");
                        _this._drawNote(notePath, pitch, note.start, note.pins, _this._pitchHeight / 2 + 1, true, _this._octaveOffset);
                        _this._svgNoteContainer.appendChild(notePath);
                    }
                }
            };
            for (var i = 0; i < 12; i++) {
                var y = (12 - i) % 12;
                var rectangle = beepbox.svgElement("rect");
                rectangle.setAttribute("x", "1");
                rectangle.setAttribute("y", "" + (y * this._defaultPitchHeight + 1));
                rectangle.setAttribute("height", "" + (this._defaultPitchHeight - 2));
                rectangle.setAttribute("fill", (i == 0) ? baseNoteColorPallet[_this._doc.song.theme] : "#444444");
                this._svgNoteBackground.appendChild(rectangle);
                this._backgroundPitchRows[i] = rectangle;
            }
            this._backgroundDrumRow.setAttribute("x", "1");
            this._backgroundDrumRow.setAttribute("y", "1");
            this._backgroundDrumRow.setAttribute("height", "" + (this._defaultDrumHeight - 2));
            this._backgroundDrumRow.setAttribute("fill", "#444444");
            this._svgDrumBackground.appendChild(this._backgroundDrumRow);
            this._doc.notifier.watch(this._documentChanged);
            this._documentChanged();
            this._updateCursorStatus();
            this._updatePreview();
            window.requestAnimationFrame(this._animatePlayhead);
            this._svg.addEventListener("mousedown", this._whenMousePressed);
            document.addEventListener("mousemove", this._whenMouseMoved);
            document.addEventListener("mouseup", this._whenCursorReleased);
            this._svg.addEventListener("mouseover", this._whenMouseOver);
            this._svg.addEventListener("mouseout", this._whenMouseOut);
            this._svg.addEventListener("touchstart", this._whenTouchPressed);
            document.addEventListener("touchmove", this._whenTouchMoved);
            document.addEventListener("touchend", this._whenCursorReleased);
            document.addEventListener("touchcancel", this._whenCursorReleased);
            this.resetCopiedPins();
        }
        PatternEditor.prototype._getMaxDivision = function () {
            if (this._doc.song.partsPerBeat % 3 == 0) {
                return this._doc.song.partsPerBeat / 3;
            }
            else if (this._doc.song.partsPerBeat % 2 == 0) {
                return this._doc.song.partsPerBeat / 2;
            }
            return this._doc.song.partsPerBeat;
        };
        PatternEditor.prototype._updateCursorStatus = function () {
            if (this._pattern == null)
                return;
            this._cursor = new PatternCursor();
            if (this._mouseX < 0 || this._mouseX > this._editorWidth || this._mouseY < 0 || this._mouseY > this._editorHeight)
                return;
            this._cursor.part = Math.floor(Math.max(0, Math.min(this._doc.song.beatsPerBar * this._doc.song.partsPerBeat - 1, this._mouseX / this._partWidth)));
            for (var _i = 0, _a = this._pattern.notes; _i < _a.length; _i++) {
                var note = _a[_i];
                if (note.end <= this._cursor.part) {
                    this._cursor.prevNote = note;
                    this._cursor.curIndex++;
                }
                else if (note.start <= this._cursor.part && note.end > this._cursor.part) {
                    this._cursor.curNote = note;
                }
                else if (note.start > this._cursor.part) {
                    this._cursor.nextNote = note;
                    break;
                }
            }
            var mousePitch = this._findMousePitch(this._mouseY);
            if (this._cursor.curNote != null) {
                this._cursor.start = this._cursor.curNote.start;
                this._cursor.end = this._cursor.curNote.end;
                this._cursor.pins = this._cursor.curNote.pins;
                var interval = 0;
                var error = 0;
                var prevPin = void 0;
                var nextPin = this._cursor.curNote.pins[0];
                for (var j = 1; j < this._cursor.curNote.pins.length; j++) {
                    prevPin = nextPin;
                    nextPin = this._cursor.curNote.pins[j];
                    var leftSide = this._partWidth * (this._cursor.curNote.start + prevPin.time);
                    var rightSide = this._partWidth * (this._cursor.curNote.start + nextPin.time);
                    if (this._mouseX > rightSide)
                        continue;
                    if (this._mouseX < leftSide)
                        throw new Error();
                    var intervalRatio = (this._mouseX - leftSide) / (rightSide - leftSide);
                    var arc = Math.sqrt(1.0 / Math.sqrt(4.0) - Math.pow(intervalRatio - 0.5, 2.0)) - 0.5;
                    var bendHeight = Math.abs(nextPin.interval - prevPin.interval);
                    interval = prevPin.interval * (1.0 - intervalRatio) + nextPin.interval * intervalRatio;
                    error = arc * bendHeight + 1.0;
                    break;
                }
                var minInterval = Number.MAX_VALUE;
                var maxInterval = -Number.MAX_VALUE;
                var bestDistance = Number.MAX_VALUE;
                for (var _b = 0, _c = this._cursor.curNote.pins; _b < _c.length; _b++) {
                    var pin = _c[_b];
                    if (minInterval > pin.interval)
                        minInterval = pin.interval;
                    if (maxInterval < pin.interval)
                        maxInterval = pin.interval;
                    var pinDistance = Math.abs(this._cursor.curNote.start + pin.time - this._mouseX / this._partWidth);
                    if (bestDistance > pinDistance) {
                        bestDistance = pinDistance;
                        this._cursor.nearPinIndex = this._cursor.curNote.pins.indexOf(pin);
                    }
                }
                mousePitch -= interval;
                this._cursor.pitch = this._snapToPitch(mousePitch, -minInterval, (this._doc.song.getChannelIsDrum(this._doc.channel) ? beepbox.Config.drumCount - 1 : beepbox.Config.maxPitch) - maxInterval);
                if (this._doc.channel != 3) {
                    var nearest = error;
                    for (var i = 0; i < this._cursor.curNote.pitches.length; i++) {
                        var distance = Math.abs(this._cursor.curNote.pitches[i] - mousePitch + 0.5);
                        if (distance > nearest)
                            continue;
                        nearest = distance;
                        this._cursor.pitch = this._cursor.curNote.pitches[i];
                    }
                }
                for (var i = 0; i < this._cursor.curNote.pitches.length; i++) {
                    if (this._cursor.curNote.pitches[i] == this._cursor.pitch) {
                        this._cursor.pitchIndex = i;
                        break;
                    }
                }
            }
            else {
                this._cursor.pitch = this._snapToPitch(mousePitch, 0, beepbox.Config.maxPitch);
                var defaultLength = this._copiedPins[this._copiedPins.length - 1].time;
                var fullBeats = Math.floor(this._cursor.part / this._doc.song.partsPerBeat);
                var maxDivision = this._getMaxDivision();
                var modMouse = this._cursor.part % this._doc.song.partsPerBeat;
                if (defaultLength == 1) {
                    this._cursor.start = this._cursor.part;
                }
                else if (defaultLength > this._doc.song.partsPerBeat) {
                    this._cursor.start = fullBeats * this._doc.song.partsPerBeat;
                }
                else if (defaultLength == this._doc.song.partsPerBeat) {
                    this._cursor.start = fullBeats * this._doc.song.partsPerBeat;
                    if (maxDivision < this._doc.song.partsPerBeat && modMouse > maxDivision) {
                        this._cursor.start += Math.floor(modMouse / maxDivision) * maxDivision;
                    }
                }
                else {
                    this._cursor.start = fullBeats * this._doc.song.partsPerBeat;
                    var division = this._doc.song.partsPerBeat % defaultLength == 0 ? defaultLength : Math.min(defaultLength, maxDivision);
                    while (division < maxDivision && this._doc.song.partsPerBeat % division != 0) {
                        division++;
                    }
                    this._cursor.start += Math.floor(modMouse / division) * division;
                }
                this._cursor.end = this._cursor.start + defaultLength;
                var forceStart = 0;
                var forceEnd = this._doc.song.beatsPerBar * this._doc.song.partsPerBeat;
                if (this._cursor.prevNote != null) {
                    forceStart = this._cursor.prevNote.end;
                }
                if (this._cursor.nextNote != null) {
                    forceEnd = this._cursor.nextNote.start;
                }
                if (this._cursor.start < forceStart) {
                    this._cursor.start = forceStart;
                    this._cursor.end = this._cursor.start + defaultLength;
                    if (this._cursor.end > forceEnd) {
                        this._cursor.end = forceEnd;
                    }
                }
                else if (this._cursor.end > forceEnd) {
                    this._cursor.end = forceEnd;
                    this._cursor.start = this._cursor.end - defaultLength;
                    if (this._cursor.start < forceStart) {
                        this._cursor.start = forceStart;
                    }
                }
                if (this._cursor.end - this._cursor.start == defaultLength) {
                    this._cursor.pins = this._copiedPins;
                }
                else {
                    this._cursor.pins = [];
                    for (var _d = 0, _e = this._copiedPins; _d < _e.length; _d++) {
                        var oldPin = _e[_d];
                        if (oldPin.time <= this._cursor.end - this._cursor.start) {
                            this._cursor.pins.push(beepbox.makeNotePin(0, oldPin.time, oldPin.volume));
                            if (oldPin.time == this._cursor.end - this._cursor.start)
                                break;
                        }
                        else {
                            this._cursor.pins.push(beepbox.makeNotePin(0, this._cursor.end - this._cursor.start, oldPin.volume));
                            break;
                        }
                    }
                }
            }
            this._cursor.valid = true;
        };
        PatternEditor.prototype._findMousePitch = function (pixelY) {
            return Math.max(0, Math.min(this._pitchCount - 1, this._pitchCount - (pixelY / this._pitchHeight))) + this._octaveOffset;
        };
        PatternEditor.prototype._snapToPitch = function (guess, min, max) {
            if (guess < min)
                guess = min;
            if (guess > max)
                guess = max;
            var scale = beepbox.Config.scaleFlags[this._doc.song.scale];
            if (scale[Math.floor(guess) % 12] || this._doc.song.getChannelIsDrum(this._doc.channel)) {
                return Math.floor(guess);
            }
            else {
                var topPitch = Math.floor(guess) + 1;
                var bottomPitch = Math.floor(guess) - 1;
                while (!scale[topPitch % 12]) {
                    topPitch++;
                }
                while (!scale[(bottomPitch) % 12]) {
                    bottomPitch--;
                }
                if (topPitch > max) {
                    if (bottomPitch < min) {
                        return min;
                    }
                    else {
                        return bottomPitch;
                    }
                }
                else if (bottomPitch < min) {
                    return topPitch;
                }
                var topRange = topPitch;
                var bottomRange = bottomPitch + 1;
                if (topPitch % 12 == 0 || topPitch % 12 == 7) {
                    topRange -= 0.5;
                }
                if (bottomPitch % 12 == 0 || bottomPitch % 12 == 7) {
                    bottomRange += 0.5;
                }
                return guess - bottomRange > topRange - guess ? topPitch : bottomPitch;
            }
        };
        PatternEditor.prototype._copyPins = function (note) {
            this._copiedPins = [];
            for (var _i = 0, _a = note.pins; _i < _a.length; _i++) {
                var oldPin = _a[_i];
                this._copiedPins.push(beepbox.makeNotePin(0, oldPin.time, oldPin.volume));
            }
            for (var i = 1; i < this._copiedPins.length - 1;) {
                if (this._copiedPins[i - 1].volume == this._copiedPins[i].volume &&
                    this._copiedPins[i].volume == this._copiedPins[i + 1].volume) {
                    this._copiedPins.splice(i, 1);
                }
                else {
                    i++;
                }
            }
            this._copiedPinChannels[this._doc.channel] = this._copiedPins;
        };
        PatternEditor.prototype._whenCursorPressed = function () {
            this._mouseDown = true;
            this._mouseXStart = this._mouseX;
            this._mouseYStart = this._mouseY;
            this._mouseXPrev = this._mouseX;
            this._mouseYPrev = this._mouseY;
            this._updateCursorStatus();
            this._updatePreview();
            this._dragChange = new beepbox.ChangeSequence();
            this._doc.history.setProspectiveChange(this._dragChange);
        };
        PatternEditor.prototype._whenCursorMoved = function () {
            var start;
            var end;
            if (this._pattern == null)
                return;
            var continuousChange = this._doc.history.lastChangeWas(this._dragChange);
            if (this._mouseDown && this._cursor.valid && continuousChange) {
                if (!this._mouseDragging) {
                    var dx = this._mouseX - this._mouseXStart;
                    var dy = this._mouseY - this._mouseYStart;
                    if (Math.sqrt(dx * dx + dy * dy) > 5) {
                        this._mouseDragging = true;
                        this._mouseHorizontal = Math.abs(dx) >= Math.abs(dy);
                    }
                }
                if (this._mouseDragging) {
                    if (this._dragChange != null) {
                        this._dragChange.undo();
                    }
                    var currentPart = Math.floor(this._mouseX / this._partWidth);
                    var sequence = new beepbox.ChangeSequence();
                    this._dragChange = sequence;
                    this._doc.history.setProspectiveChange(this._dragChange);
                    if (this._cursor.curNote == null) {
                        var backwards = void 0;
                        var directLength = void 0;
                        if (currentPart < this._cursor.start) {
                            backwards = true;
                            directLength = this._cursor.start - currentPart;
                        }
                        else {
                            backwards = false;
                            directLength = currentPart - this._cursor.start + 1;
                        }
                        var defaultLength = 1;
                        for (var i_1 = 0; i_1 <= this._doc.song.beatsPerBar * this._doc.song.partsPerBeat; i_1++) {
                            if (i_1 >= 5 &&
                                i_1 % this._doc.song.partsPerBeat != 0 &&
                                i_1 != this._doc.song.partsPerBeat * 3.0 / 2.0 &&
                                i_1 != this._doc.song.partsPerBeat * 4.0 / 3.0 &&
                                i_1 != this._doc.song.partsPerBeat * 5.0 / 3.0) {
                                continue;
                            }
                            var blessedLength = i_1;
                            if (blessedLength == directLength) {
                                defaultLength = blessedLength;
                                break;
                            }
                            if (blessedLength < directLength) {
                                defaultLength = blessedLength;
                            }
                            if (blessedLength > directLength) {
                                if (defaultLength < directLength - 1) {
                                    defaultLength = blessedLength;
                                }
                                break;
                            }
                        }
                        if (backwards) {
                            end = this._cursor.start;
                            start = end - defaultLength;
                        }
                        else {
                            start = this._cursor.start;
                            end = start + defaultLength;
                        }
                        if (start < 0)
                            start = 0;
                        if (end > this._doc.song.beatsPerBar * this._doc.song.partsPerBeat)
                            end = this._doc.song.beatsPerBar * this._doc.song.partsPerBeat;
                        sequence.append(new beepbox.ChangeNoteTruncate(this._doc, this._pattern, start, end));
                        var i = void 0;
                        for (i = 0; i < this._pattern.notes.length; i++) {
                            if (this._pattern.notes[i].start >= end)
                                break;
                        }
                        var theNote = beepbox.makeNote(this._cursor.pitch, start, end, 3, this._doc.song.getChannelIsDrum(this._doc.channel));
                        sequence.append(new beepbox.ChangeNoteAdded(this._doc, this._pattern, theNote, i));
                        this._copyPins(theNote);
                    }
                    else if (this._mouseHorizontal) {
                        var shift = Math.round((this._mouseX - this._mouseXStart) / this._partWidth);
                        var shiftedPin = this._cursor.curNote.pins[this._cursor.nearPinIndex];
                        var shiftedTime = this._cursor.curNote.start + shiftedPin.time + shift;
                        if (shiftedTime < 0)
                            shiftedTime = 0;
                        if (shiftedTime > this._doc.song.beatsPerBar * this._doc.song.partsPerBeat)
                            shiftedTime = this._doc.song.beatsPerBar * this._doc.song.partsPerBeat;
                        if (shiftedTime <= this._cursor.curNote.start && this._cursor.nearPinIndex == this._cursor.curNote.pins.length - 1 ||
                            shiftedTime >= this._cursor.curNote.end && this._cursor.nearPinIndex == 0) {
                            sequence.append(new beepbox.ChangeNoteAdded(this._doc, this._pattern, this._cursor.curNote, this._cursor.curIndex, true));
                        }
                        else {
                            start = Math.min(this._cursor.curNote.start, shiftedTime);
                            end = Math.max(this._cursor.curNote.end, shiftedTime);
                            sequence.append(new beepbox.ChangeNoteTruncate(this._doc, this._pattern, start, end, this._cursor.curNote));
                            sequence.append(new beepbox.ChangePinTime(this._doc, this._cursor.curNote, this._cursor.nearPinIndex, shiftedTime));
                            this._copyPins(this._cursor.curNote);
                        }
                    }
                    else if (this._cursor.pitchIndex == -1) {
                        var bendPart = Math.round(Math.max(this._cursor.curNote.start, Math.min(this._cursor.curNote.end, this._mouseX / this._partWidth))) - this._cursor.curNote.start;
                        var prevPin = void 0;
                        var nextPin = this._cursor.curNote.pins[0];
                        var bendVolume = 0;
                        var bendInterval = 0;
                        for (var i = 1; i < this._cursor.curNote.pins.length; i++) {
                            prevPin = nextPin;
                            nextPin = this._cursor.curNote.pins[i];
                            if (bendPart > nextPin.time)
                                continue;
                            if (bendPart < prevPin.time)
                                throw new Error();
                            var volumeRatio = (bendPart - prevPin.time) / (nextPin.time - prevPin.time);
                            bendVolume = Math.round(prevPin.volume * (1.0 - volumeRatio) + nextPin.volume * volumeRatio + ((this._mouseYStart - this._mouseY) / 25.0));
                            if (bendVolume < 0)
                                bendVolume = 0;
                            if (bendVolume > 3)
                                bendVolume = 3;
                            bendInterval = this._snapToPitch(prevPin.interval * (1.0 - volumeRatio) + nextPin.interval * volumeRatio + this._cursor.curNote.pitches[0], 0, beepbox.Config.maxPitch) - this._cursor.curNote.pitches[0];
                            break;
                        }
                        sequence.append(new beepbox.ChangeVolumeBend(this._doc, this._pattern, this._cursor.curNote, bendPart, bendVolume, bendInterval));
                        this._copyPins(this._cursor.curNote);
                    }
                    else {
                        var bendStart = void 0;
                        var bendEnd = void 0;
                        if (this._mouseX >= this._mouseXStart) {
                            bendStart = this._cursor.part;
                            bendEnd = currentPart + 1;
                        }
                        else {
                            bendStart = this._cursor.part + 1;
                            bendEnd = currentPart;
                        }
                        if (bendEnd < 0)
                            bendEnd = 0;
                        if (bendEnd > this._doc.song.beatsPerBar * this._doc.song.partsPerBeat)
                            bendEnd = this._doc.song.beatsPerBar * this._doc.song.partsPerBeat;
                        if (bendEnd > this._cursor.curNote.end) {
                            sequence.append(new beepbox.ChangeNoteTruncate(this._doc, this._pattern, this._cursor.curNote.start, bendEnd, this._cursor.curNote));
                        }
                        if (bendEnd < this._cursor.curNote.start) {
                            sequence.append(new beepbox.ChangeNoteTruncate(this._doc, this._pattern, bendEnd, this._cursor.curNote.end, this._cursor.curNote));
                        }
                        var minPitch = Number.MAX_VALUE;
                        var maxPitch = -Number.MAX_VALUE;
                        for (var _i = 0, _a = this._cursor.curNote.pitches; _i < _a.length; _i++) {
                            var pitch = _a[_i];
                            if (minPitch > pitch)
                                minPitch = pitch;
                            if (maxPitch < pitch)
                                maxPitch = pitch;
                        }
                        minPitch -= this._cursor.curNote.pitches[0];
                        maxPitch -= this._cursor.curNote.pitches[0];
                        var bendTo = this._snapToPitch(this._findMousePitch(this._mouseY), -minPitch, beepbox.Config.maxPitch - maxPitch);
                        sequence.append(new beepbox.ChangePitchBend(this._doc, this._cursor.curNote, bendStart, bendEnd, bendTo, this._cursor.pitchIndex));
                        this._copyPins(this._cursor.curNote);
                    }
                }
                this._mouseXPrev = this._mouseX;
                this._mouseYPrev = this._mouseY;
            }
            else {
                this._updateCursorStatus();
                this._updatePreview();
            }
        };
        PatternEditor.prototype._updatePreview = function () {
            if (!this._mouseOver || this._mouseDown || !this._cursor.valid || this._pattern == null) {
                this._svgPreview.setAttribute("visibility", "hidden");
            }
            else {
                this._svgPreview.setAttribute("visibility", "visible");
                this._drawNote(this._svgPreview, this._cursor.pitch, this._cursor.start, this._cursor.pins, this._pitchHeight / 2 + 1, true, this._octaveOffset);
            }
        };
        PatternEditor.prototype._drawNote = function (svgElement, pitch, start, pins, radius, showVolume, offset) {
            var nextPin = pins[0];
            var pathString = "M " + prettyNumber(this._partWidth * (start + nextPin.time) + 1) + " " + prettyNumber(this._pitchToPixelHeight(pitch - offset) + radius * (showVolume ? nextPin.volume / 3.0 : 1.0)) + " ";
            for (var i = 1; i < pins.length; i++) {
                var prevPin = nextPin;
                nextPin = pins[i];
                var prevSide = this._partWidth * (start + prevPin.time) + (i == 1 ? 1 : 0);
                var nextSide = this._partWidth * (start + nextPin.time) - (i == pins.length - 1 ? 1 : 0);
                var prevHeight = this._pitchToPixelHeight(pitch + prevPin.interval - offset);
                var nextHeight = this._pitchToPixelHeight(pitch + nextPin.interval - offset);
                var prevVolume = showVolume ? prevPin.volume / 3.0 : 1.0;
                var nextVolume = showVolume ? nextPin.volume / 3.0 : 1.0;
                pathString += "L " + prettyNumber(prevSide) + " " + prettyNumber(prevHeight - radius * prevVolume) + " ";
                if (prevPin.interval > nextPin.interval)
                    pathString += "L " + prettyNumber(prevSide + 1) + " " + prettyNumber(prevHeight - radius * prevVolume) + " ";
                if (prevPin.interval < nextPin.interval)
                    pathString += "L " + prettyNumber(nextSide - 1) + " " + prettyNumber(nextHeight - radius * nextVolume) + " ";
                pathString += "L " + prettyNumber(nextSide) + " " + prettyNumber(nextHeight - radius * nextVolume) + " ";
            }
            for (var i = pins.length - 2; i >= 0; i--) {
                var prevPin = nextPin;
                nextPin = pins[i];
                var prevSide = this._partWidth * (start + prevPin.time) - (i == pins.length - 2 ? 1 : 0);
                var nextSide = this._partWidth * (start + nextPin.time) + (i == 0 ? 1 : 0);
                var prevHeight = this._pitchToPixelHeight(pitch + prevPin.interval - offset);
                var nextHeight = this._pitchToPixelHeight(pitch + nextPin.interval - offset);
                var prevVolume = showVolume ? prevPin.volume / 3.0 : 1.0;
                var nextVolume = showVolume ? nextPin.volume / 3.0 : 1.0;
                pathString += "L " + prettyNumber(prevSide) + " " + prettyNumber(prevHeight + radius * prevVolume) + " ";
                if (prevPin.interval < nextPin.interval)
                    pathString += "L " + prettyNumber(prevSide - 1) + " " + prettyNumber(prevHeight + radius * prevVolume) + " ";
                if (prevPin.interval > nextPin.interval)
                    pathString += "L " + prettyNumber(nextSide + 1) + " " + prettyNumber(nextHeight + radius * nextVolume) + " ";
                pathString += "L " + prettyNumber(nextSide) + " " + prettyNumber(nextHeight + radius * nextVolume) + " ";
            }
            pathString += "z";
            svgElement.setAttribute("d", pathString);
        };
        PatternEditor.prototype._pitchToPixelHeight = function (pitch) {
            return this._pitchHeight * (this._pitchCount - (pitch) - 0.5);
        };
        return PatternEditor;
    }());
    beepbox.PatternEditor = PatternEditor;
})(beepbox || (beepbox = {}));
var beepbox;
(function (beepbox) {
    var Box = (function () {
        function Box(channel, x, y, color) {
            this._text = beepbox.html.text("1");
            this._label = beepbox.svgElement("text", { x: 16, y: 23, "font-family": "sans-serif", "font-size": 20, "text-anchor": "middle", "font-weight": "bold", fill: "red" }, [this._text]);
            this._rect = beepbox.svgElement("rect", { width: 30, height: 30, x: 1, y: 1 });
            this.container = beepbox.svgElement("svg", undefined, [this._rect, this._label]);
            this._renderedIndex = 1;
            this._renderedDim = true;
            this._renderedSelected = false;
            this._renderedColor = "";
            this.container.setAttribute("x", "" + (x * 32));
            this.container.setAttribute("y", "" + (y * 32));
            this._rect.setAttribute("fill", "#444444");
            this._label.setAttribute("fill", color);
        }
        Box.prototype.setSquashed = function (squashed, y) {
            if (squashed) {
                this.container.setAttribute("y", "" + (y * 27));
                this._rect.setAttribute("height", "" + 25);
                this._label.setAttribute("y", "" + 21);
            }
            else {
                this.container.setAttribute("y", "" + (y * 32));
                this._rect.setAttribute("height", "" + 30);
                this._label.setAttribute("y", "" + 23);
            }
        };
        Box.prototype.setIndex = function (index, dim, selected, y, color) {
            if (this._renderedIndex != index) {
                if (!this._renderedSelected && ((index == 0) != (this._renderedIndex == 0))) {
                    this._rect.setAttribute("fill", (index == 0) ? "#000000" : "#444444");
                }
                this._renderedIndex = index;
                this._text.data = "" + index;
            }
            if (this._renderedDim != dim || this._renderedColor != color) {
                this._renderedDim = dim;
                if (selected) {
                    this._label.setAttribute("fill", "#000000");
                }
                else {
                    this._label.setAttribute("fill", color);
                }
            }
            if (this._renderedSelected != selected || this._renderedColor != color) {
                this._renderedSelected = selected;
                if (selected) {
                    this._rect.setAttribute("fill", color);
                    this._label.setAttribute("fill", "#000000");
                }
                else {
                    this._rect.setAttribute("fill", (this._renderedIndex == 0) ? "#000000" : "#444444");
                    this._label.setAttribute("fill", color);
                }
            }
            this._renderedColor = color;
        };
        return Box;
    }());
    var TrackEditor = (function () {
        function TrackEditor(_doc, _songEditor) {
            var _this = this;
            this._doc = _doc;
            this._songEditor = _songEditor;
            this._editorWidth = 512;
            this._barWidth = 32;
            this._svg = beepbox.svgElement("svg", { style: "background-color: #000000; position: absolute;", width: this._editorWidth, height: 128 });
            this.container = beepbox.html.div({ style: "width: 512px; height: 128px; position: relative; overflow:hidden;" }, [this._svg]);
            this._boxContainer = beepbox.svgElement("g");
            this._playhead = beepbox.svgElement("rect", { fill: "white", x: 0, y: 0, width: 4, height: 128 });
            this._boxHighlight = beepbox.svgElement("rect", { fill: "none", stroke: "white", "stroke-width": 2, "pointer-events": "none", x: 1, y: 1, width: 30, height: 30 });
            this._upHighlight = beepbox.svgElement("path", { fill: "black", stroke: "black", "stroke-width": 1, "pointer-events": "none" });
            this._downHighlight = beepbox.svgElement("path", { fill: "black", stroke: "black", "stroke-width": 1, "pointer-events": "none" });
            this._grid = [];
            this._mouseX = 0;
            this._mouseY = 0;
            this._pattern = null;
            this._mouseOver = false;
            this._digits = "";
            this._editorHeight = 128;
            this._channelHeight = 32;
            this._renderedChannelCount = 0;
            this._renderedPlayhead = -1;
            this._renderedSquashed = false;
            this._changeBarPattern = null;
            this._animatePlayhead = function (timestamp) {
                var playhead = (_this._barWidth * (_this._doc.synth.playhead - _this._doc.barScrollPos) - 2);
                if (_this._renderedPlayhead != playhead) {
                    _this._renderedPlayhead = playhead;
                    _this._playhead.setAttribute("x", "" + playhead);
                }
                window.requestAnimationFrame(_this._animatePlayhead);
            };
            this._whenMouseOver = function (event) {
                if (_this._mouseOver)
                    return;
                _this._mouseOver = true;
            };
            this._whenMouseOut = function (event) {
                if (!_this._mouseOver)
                    return;
                _this._mouseOver = false;
            };
            this._whenMousePressed = function (event) {
                event.preventDefault();
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = (event.clientX || event.pageX) - boundingRect.left;
                _this._mouseY = (event.clientY || event.pageY) - boundingRect.top;
                var channel = Math.floor(Math.min(_this._doc.song.getChannelCount() - 1, Math.max(0, _this._mouseY / _this._channelHeight)));
                var bar = Math.floor(Math.min(_this._doc.song.barCount - 1, Math.max(0, _this._mouseX / _this._barWidth + _this._doc.barScrollPos)));
                if (_this._doc.channel == channel && _this._doc.bar == bar) {
                    var up = (_this._mouseY % _this._channelHeight) < _this._channelHeight / 2;
                    var patternCount = _this._doc.song.channelPatterns[channel].length;
                    _this._setBarPattern((_this._doc.song.channelBars[channel][bar] + (up ? 1 : patternCount)) % (patternCount + 1));
                }
                else {
                    _this._setChannelBar(channel, bar);
                }
            };
            this._whenMouseMoved = function (event) {
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = (event.clientX || event.pageX) - boundingRect.left;
                _this._mouseY = (event.clientY || event.pageY) - boundingRect.top;
                _this._updatePreview();
            };
            this._whenMouseReleased = function (event) {
            };
            this._documentChanged = function () {
                _this._render();
            };
            this._svg.appendChild(this._boxContainer);
            this._svg.appendChild(this._boxHighlight);
            this._svg.appendChild(this._upHighlight);
            this._svg.appendChild(this._downHighlight);
            this._svg.appendChild(this._playhead);
            this._render();
            this._doc.notifier.watch(this._documentChanged);
            window.requestAnimationFrame(this._animatePlayhead);
            this.container.addEventListener("mousedown", this._whenMousePressed);
            document.addEventListener("mousemove", this._whenMouseMoved);
            document.addEventListener("mouseup", this._whenMouseReleased);
            this.container.addEventListener("mouseover", this._whenMouseOver);
            this.container.addEventListener("mouseout", this._whenMouseOut);
        }
        TrackEditor.prototype._setChannelBar = function (channel, bar) {
            new beepbox.ChangeChannelBar(this._doc, channel, bar);
            this._digits = "";
            this._doc.history.forgetLastChange();
        };
        TrackEditor.prototype._setBarPattern = function (pattern) {
            var currentValue = this._doc.song.channelBars[this._doc.channel][this._doc.bar];
            var continuousChange = this._doc.history.lastChangeWas(this._changeBarPattern);
            var oldValue = continuousChange ? this._changeBarPattern.oldValue : currentValue;
            if (pattern != currentValue) {
                this._changeBarPattern = new beepbox.ChangeBarPattern(this._doc, oldValue, pattern);
                this._doc.history.record(this._changeBarPattern, continuousChange);
            }
        };
        TrackEditor.prototype.onKeyPressed = function (event) {
            switch (event.keyCode) {
                case 38:
                    this._setChannelBar((this._doc.channel - 1 + this._doc.song.getChannelCount()) % this._doc.song.getChannelCount(), this._doc.bar);
                    event.preventDefault();
                    break;
                case 40:
                    this._setChannelBar((this._doc.channel + 1) % this._doc.song.getChannelCount(), this._doc.bar);
                    event.preventDefault();
                    break;
                case 37:
                    this._setChannelBar(this._doc.channel, (this._doc.bar + this._doc.song.barCount - 1) % this._doc.song.barCount);
                    event.preventDefault();
                    break;
                case 39:
                    this._setChannelBar(this._doc.channel, (this._doc.bar + 1) % this._doc.song.barCount);
                    event.preventDefault();
                    break;
                case 48:
                    this._nextDigit("0");
                    event.preventDefault();
                    break;
                case 49:
                    this._nextDigit("1");
                    event.preventDefault();
                    break;
                case 50:
                    this._nextDigit("2");
                    event.preventDefault();
                    break;
                case 51:
                    this._nextDigit("3");
                    event.preventDefault();
                    break;
                case 52:
                    this._nextDigit("4");
                    event.preventDefault();
                    break;
                case 53:
                    this._nextDigit("5");
                    event.preventDefault();
                    break;
                case 54:
                    this._nextDigit("6");
                    event.preventDefault();
                    break;
                case 55:
                    this._nextDigit("7");
                    event.preventDefault();
                    break;
                case 56:
                    this._nextDigit("8");
                    event.preventDefault();
                    break;
                case 57:
                    this._nextDigit("9");
                    event.preventDefault();
                    break;
                default:
                    this._digits = "";
                    break;
            }
        };
        TrackEditor.prototype._nextDigit = function (digit) {
            this._digits += digit;
            var parsed = parseInt(this._digits);
            if (parsed <= this._doc.song.patternsPerChannel) {
                this._setBarPattern(parsed);
                return;
            }
            this._digits = digit;
            parsed = parseInt(this._digits);
            if (parsed <= this._doc.song.patternsPerChannel) {
                this._setBarPattern(parsed);
                return;
            }
            this._digits = "";
        };
        TrackEditor.prototype._updatePreview = function () {
            var channel = Math.floor(Math.min(this._doc.song.getChannelCount() - 1, Math.max(0, this._mouseY / this._channelHeight)));
            var bar = Math.floor(Math.min(this._doc.song.barCount - 1, Math.max(0, this._mouseX / this._barWidth + this._doc.barScrollPos)));
            var selected = (bar == this._doc.bar && channel == this._doc.channel);
            if (this._mouseOver && !selected) {
                this._boxHighlight.setAttribute("x", "" + (1 + this._barWidth * (bar - this._doc.barScrollPos)));
                this._boxHighlight.setAttribute("y", "" + (1 + (this._channelHeight * channel)));
                this._boxHighlight.setAttribute("height", "" + (this._channelHeight - 2));
                this._boxHighlight.style.visibility = "visible";
            }
            else {
                this._boxHighlight.style.visibility = "hidden";
            }
            if (this._mouseOver && selected) {
                var up = (this._mouseY % this._channelHeight) < this._channelHeight / 2;
                var center = this._barWidth * (bar - this._doc.barScrollPos + 0.8);
                var middle = this._channelHeight * (channel + 0.5);
                var base = this._channelHeight * 0.1;
                var tip = this._channelHeight * 0.4;
                var width = this._channelHeight * 0.175;
                this._upHighlight.setAttribute("fill", up ? "#fff" : "#000");
                this._downHighlight.setAttribute("fill", !up ? "#fff" : "#000");
                this._upHighlight.setAttribute("d", "M " + center + " " + (middle - tip) + " L " + (center + width) + " " + (middle - base) + " L " + (center - width) + " " + (middle - base) + " z");
                this._downHighlight.setAttribute("d", "M " + center + " " + (middle + tip) + " L " + (center + width) + " " + (middle + base) + " L " + (center - width) + " " + (middle + base) + " z");
                this._upHighlight.style.visibility = "visible";
                this._downHighlight.style.visibility = "visible";
            }
            else {
                this._upHighlight.style.visibility = "hidden";
                this._downHighlight.style.visibility = "hidden";
            }
        };
        TrackEditor.prototype._render = function () {
            this._pattern = this._doc.getCurrentPattern();
            var squashed = this._doc.song.getChannelCount() > 4 || (this._doc.song.barCount > 16 && this._doc.song.getChannelCount() > 3);
            this._channelHeight = squashed ? 27 : 32;
            if (this._renderedChannelCount != this._doc.song.getChannelCount()) {
                for (var y = this._renderedChannelCount; y < this._doc.song.getChannelCount(); y++) {
                    this._grid[y] = [];
                    for (var x = 0; x < 16; x++) {
                        var box = new Box(y, x, y, this._doc.song.getChannelColorDim(y));
                        box.setSquashed(squashed, y);
                        this._boxContainer.appendChild(box.container);
                        this._grid[y][x] = box;
                    }
                }
                for (var y = this._doc.song.getChannelCount(); y < this._renderedChannelCount; y++) {
                    for (var x = 0; x < 16; x++) {
                        this._boxContainer.removeChild(this._grid[y][x].container);
                    }
                }
                this._grid.length = this._doc.song.getChannelCount();
            }
            if (this._renderedSquashed != squashed) {
                for (var y = 0; y < this._doc.song.getChannelCount(); y++) {
                    for (var x = 0; x < 16; x++) {
                        this._grid[y][x].setSquashed(squashed, y);
                    }
                }
            }
            if (this._renderedSquashed != squashed || this._renderedChannelCount != this._doc.song.getChannelCount()) {
                this._renderedSquashed = squashed;
                this._renderedChannelCount = this._doc.song.getChannelCount();
                this._editorHeight = this._doc.song.getChannelCount() * this._channelHeight;
                this._svg.setAttribute("height", "" + this._editorHeight);
                this._playhead.setAttribute("height", "" + this._editorHeight);
                this.container.style.height = this._editorHeight + "px";
            }
            for (var j = 0; j < this._doc.song.getChannelCount(); j++) {
                for (var i = 0; i < 16; i++) {
                    var pattern = this._doc.song.getPattern(j, i + this._doc.barScrollPos);
                    var selected = (i + this._doc.barScrollPos == this._doc.bar && j == this._doc.channel);
                    var dim = (pattern == null || pattern.notes.length == 0);
                    var box = this._grid[j][i];
                    if (i < this._doc.song.barCount) {
                        box.setIndex(this._doc.song.channelBars[j][i + this._doc.barScrollPos], dim, selected, j, dim && !selected ? this._doc.song.getChannelColorDim(j) : this._doc.song.getChannelColorBright(j));
                        box.container.style.visibility = "visible";
                    }
                    else {
                        box.container.style.visibility = "hidden";
                    }
                }
            }
            this._updatePreview();
        };
        return TrackEditor;
    }());
    beepbox.TrackEditor = TrackEditor;
})(beepbox || (beepbox = {}));
var beepbox;
(function (beepbox) {
    var Change = (function () {
        function Change() {
            this._noop = true;
        }
        Change.prototype._didSomething = function () {
            this._noop = false;
        };
        Change.prototype.isNoop = function () {
            return this._noop;
        };
        return Change;
    }());
    beepbox.Change = Change;
    var UndoableChange = (function (_super) {
        __extends(UndoableChange, _super);
        function UndoableChange(reversed) {
            var _this = _super.call(this) || this;
            _this._reversed = reversed;
            _this._doneForwards = !reversed;
            return _this;
        }
        UndoableChange.prototype.undo = function () {
            if (this._reversed) {
                this._doForwards();
                this._doneForwards = true;
            }
            else {
                this._doBackwards();
                this._doneForwards = false;
            }
        };
        UndoableChange.prototype.redo = function () {
            if (this._reversed) {
                this._doBackwards();
                this._doneForwards = false;
            }
            else {
                this._doForwards();
                this._doneForwards = true;
            }
        };
        UndoableChange.prototype._isDoneForwards = function () {
            return this._doneForwards;
        };
        UndoableChange.prototype._doForwards = function () {
            throw new Error("Change.doForwards(): Override me.");
        };
        UndoableChange.prototype._doBackwards = function () {
            throw new Error("Change.doBackwards(): Override me.");
        };
        return UndoableChange;
    }(Change));
    beepbox.UndoableChange = UndoableChange;
    var ChangeGroup = (function (_super) {
        __extends(ChangeGroup, _super);
        function ChangeGroup() {
            return _super.call(this) || this;
        }
        ChangeGroup.prototype.append = function (change) {
            if (change.isNoop())
                return;
            this._didSomething();
        };
        return ChangeGroup;
    }(Change));
    beepbox.ChangeGroup = ChangeGroup;
    var ChangeSequence = (function (_super) {
        __extends(ChangeSequence, _super);
        function ChangeSequence(changes) {
            var _this = _super.call(this, false) || this;
            if (changes == undefined) {
                _this._changes = [];
            }
            else {
                _this._changes = changes.concat();
            }
            return _this;
        }
        ChangeSequence.prototype.append = function (change) {
            if (change.isNoop())
                return;
            this._changes[this._changes.length] = change;
            this._didSomething();
        };
        ChangeSequence.prototype._doForwards = function () {
            for (var i = 0; i < this._changes.length; i++) {
                this._changes[i].redo();
            }
        };
        ChangeSequence.prototype._doBackwards = function () {
            for (var i = this._changes.length - 1; i >= 0; i--) {
                this._changes[i].undo();
            }
        };
        return ChangeSequence;
    }(UndoableChange));
    beepbox.ChangeSequence = ChangeSequence;
})(beepbox || (beepbox = {}));
var beepbox;
(function (beepbox) {
    var ChangePins = (function (_super) {
        __extends(ChangePins, _super);
        function ChangePins(_document, _note) {
            var _this = _super.call(this, false) || this;
            _this._document = _document;
            _this._note = _note;
            _this._oldStart = _this._note.start;
            _this._oldEnd = _this._note.end;
            _this._newStart = _this._note.start;
            _this._newEnd = _this._note.end;
            _this._oldPins = _this._note.pins;
            _this._newPins = [];
            _this._oldPitches = _this._note.pitches;
            _this._newPitches = [];
            return _this;
        }
        ChangePins.prototype._finishSetup = function () {
            for (var i = 0; i < this._newPins.length - 1;) {
                if (this._newPins[i].time >= this._newPins[i + 1].time) {
                    this._newPins.splice(i, 1);
                }
                else {
                    i++;
                }
            }
            for (var i = 1; i < this._newPins.length - 1;) {
                if (this._newPins[i - 1].interval == this._newPins[i].interval &&
                    this._newPins[i].interval == this._newPins[i + 1].interval &&
                    this._newPins[i - 1].volume == this._newPins[i].volume &&
                    this._newPins[i].volume == this._newPins[i + 1].volume) {
                    this._newPins.splice(i, 1);
                }
                else {
                    i++;
                }
            }
            var firstInterval = this._newPins[0].interval;
            var firstTime = this._newPins[0].time;
            for (var i = 0; i < this._oldPitches.length; i++) {
                this._newPitches[i] = this._oldPitches[i] + firstInterval;
            }
            for (var i = 0; i < this._newPins.length; i++) {
                this._newPins[i].interval -= firstInterval;
                this._newPins[i].time -= firstTime;
            }
            this._newStart = this._oldStart + firstTime;
            this._newEnd = this._newStart + this._newPins[this._newPins.length - 1].time;
            this._doForwards();
            this._didSomething();
        };
        ChangePins.prototype._doForwards = function () {
            this._note.pins = this._newPins;
            this._note.pitches = this._newPitches;
            this._note.start = this._newStart;
            this._note.end = this._newEnd;
            this._document.notifier.changed();
        };
        ChangePins.prototype._doBackwards = function () {
            this._note.pins = this._oldPins;
            this._note.pitches = this._oldPitches;
            this._note.start = this._oldStart;
            this._note.end = this._oldEnd;
            this._document.notifier.changed();
        };
        return ChangePins;
    }(beepbox.UndoableChange));
    beepbox.ChangePins = ChangePins;
    var ChangeEnvelope = (function (_super) {
        __extends(ChangeEnvelope, _super);
        function ChangeEnvelope(document, newValue) {
            var _this = _super.call(this) || this;
            var oldValue = document.song.instrumentEnvelopes[document.channel][document.getCurrentInstrument()];
            if (oldValue != newValue) {
                _this._didSomething();
                document.song.instrumentEnvelopes[document.channel][document.getCurrentInstrument()] = newValue;
                document.notifier.changed();
            }
            return _this;
        }
        return ChangeEnvelope;
    }(beepbox.Change));
    beepbox.ChangeEnvelope = ChangeEnvelope;
    var ChangeBarPattern = (function (_super) {
        __extends(ChangeBarPattern, _super);
        function ChangeBarPattern(document, oldValue, newValue) {
            var _this = _super.call(this) || this;
            _this.oldValue = oldValue;
            if (newValue > document.song.channelPatterns[document.channel].length)
                throw new Error("invalid pattern");
            document.song.channelBars[document.channel][document.bar] = newValue;
            document.notifier.changed();
            if (oldValue != newValue)
                _this._didSomething();
            return _this;
        }
        return ChangeBarPattern;
    }(beepbox.Change));
    beepbox.ChangeBarPattern = ChangeBarPattern;
    var ChangeBarCount = (function (_super) {
        __extends(ChangeBarCount, _super);
        function ChangeBarCount(document, newValue) {
            var _this = _super.call(this) || this;
            if (document.song.barCount != newValue) {
                var newChannelBars = [];
                for (var i = 0; i < document.song.getChannelCount(); i++) {
                    var channel = [];
                    for (var j = 0; j < newValue; j++) {
                        channel.push(j < document.song.barCount ? document.song.channelBars[i][j] : 1);
                    }
                    newChannelBars.push(channel);
                }
                var newBar = document.bar;
                var newBarScrollPos = document.barScrollPos;
                var newLoopStart = document.song.loopStart;
                var newLoopLength = document.song.loopLength;
                if (document.song.barCount > newValue) {
                    newBar = Math.min(newBar, newValue - 1);
                    newBarScrollPos = Math.max(0, Math.min(newValue - 16, newBarScrollPos));
                    newLoopLength = Math.min(newValue, newLoopLength);
                    newLoopStart = Math.min(newValue - newLoopLength, newLoopStart);
                }
                document.bar = newBar;
                document.barScrollPos = newBarScrollPos;
                document.song.loopStart = newLoopStart;
                document.song.loopLength = newLoopLength;
                document.song.barCount = newValue;
                document.song.channelBars = newChannelBars;
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangeBarCount;
    }(beepbox.Change));
    beepbox.ChangeBarCount = ChangeBarCount;
    var ChangeChannelCount = (function (_super) {
        __extends(ChangeChannelCount, _super);
        function ChangeChannelCount(document, newPitchChannelCount, newDrumChannelCount) {
            var _this = _super.call(this) || this;
            if (document.song.pitchChannelCount != newPitchChannelCount || document.song.drumChannelCount != newDrumChannelCount) {
                var channelPatterns = [];
                var channelBars = [];
                var channelOctaves = [];
                var instrumentWaves = [];
                var instrumentFilters = [];
                var instrumentEnvelopes = [];
                var instrumentEffects = [];
				var instrumentHarm = [];
				var instrumentOffOne = [];
                var instrumentChorus = [];
                var instrumentVolumes = [];
                for (var i = 0; i < newPitchChannelCount; i++) {
                    var channel = i;
                    var oldChannel = i;
                    if (i < document.song.pitchChannelCount) {
                        channelPatterns[channel] = document.song.channelPatterns[oldChannel];
                        channelBars[channel] = document.song.channelBars[oldChannel];
                        channelOctaves[channel] = document.song.channelOctaves[oldChannel];
                        instrumentWaves[channel] = document.song.instrumentWaves[oldChannel];
                        instrumentFilters[channel] = document.song.instrumentFilters[oldChannel];
                        instrumentEnvelopes[channel] = document.song.instrumentEnvelopes[oldChannel];
                        instrumentEffects[channel] = document.song.instrumentEffects[oldChannel];
                        instrumentChorus[channel] = document.song.instrumentChorus[oldChannel];
						instrumentHarm[channel] = document.song.instrumentHarm[oldChannel];
						instrumentOffOne[channel] = document.song.instrumentOffOne[oldChannel];
                        instrumentVolumes[channel] = document.song.instrumentVolumes[oldChannel];
                    }
                    else {
                        channelPatterns[channel] = [];
                        for (var j = 0; j < document.song.patternsPerChannel; j++)
                            channelPatterns[channel][j] = new beepbox.BarPattern();
                        channelBars[channel] = beepbox.filledArray(document.song.barCount, 1);
                        channelOctaves[channel] = 2;
                        instrumentWaves[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 1);
                        instrumentFilters[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 0);
                        instrumentEnvelopes[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 1);
                        instrumentEffects[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 0);
                        instrumentChorus[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 0);
						instrumentHarm[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 0);
						instrumentOffOne[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 0);
                        instrumentVolumes[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 0);
                    }
                }
                for (var i = 0; i < newDrumChannelCount; i++) {
                    var channel = i + newPitchChannelCount;
                    var oldChannel = i + document.song.pitchChannelCount;
                    if (i < document.song.drumChannelCount) {
                        channelPatterns[channel] = document.song.channelPatterns[oldChannel];
                        channelBars[channel] = document.song.channelBars[oldChannel];
                        channelOctaves[channel] = document.song.channelOctaves[oldChannel];
                        instrumentWaves[channel] = document.song.instrumentWaves[oldChannel];
                        instrumentFilters[channel] = document.song.instrumentFilters[oldChannel];
                        instrumentEnvelopes[channel] = document.song.instrumentEnvelopes[oldChannel];
                        instrumentEffects[channel] = document.song.instrumentEffects[oldChannel];
                        instrumentChorus[channel] = document.song.instrumentChorus[oldChannel];
						instrumentHarm[channel] = document.song.instrumentHarm[oldChannel];
						instrumentOffOne[channel] = document.song.instrumentOffOne[oldChannel];
                        instrumentVolumes[channel] = document.song.instrumentVolumes[oldChannel];
                    }
                    else {
                        channelPatterns[channel] = [];
                        for (var j = 0; j < document.song.patternsPerChannel; j++)
                            channelPatterns[channel][j] = new beepbox.BarPattern();
                        channelBars[channel] = beepbox.filledArray(document.song.barCount, 1);
                        channelOctaves[channel] = 0;
                        instrumentWaves[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 1);
                        instrumentFilters[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 0);
                        instrumentEnvelopes[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 1);
                        instrumentEffects[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 0);
                        instrumentChorus[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 0);
						instrumentHarm[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 0);
						instrumentOffOne[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 0);
                        instrumentVolumes[channel] = beepbox.filledArray(document.song.instrumentsPerChannel, 0);
                    }
                }
                document.song.pitchChannelCount = newPitchChannelCount;
                document.song.drumChannelCount = newDrumChannelCount;
                document.song.channelPatterns = channelPatterns;
                document.song.channelBars = channelBars;
                document.song.channelOctaves = channelOctaves;
                document.song.instrumentWaves = instrumentWaves;
                document.song.instrumentFilters = instrumentFilters;
                document.song.instrumentEnvelopes = instrumentEnvelopes;
                document.song.instrumentEffects = instrumentEffects;
                document.song.instrumentChorus = instrumentChorus;
				document.song.instrumentHarm = instrumentHarm;
				document.song.instrumentOffOne = instrumentOffOne;
                document.song.instrumentVolumes = instrumentVolumes;
                document.channel = Math.min(document.channel, newPitchChannelCount + newDrumChannelCount - 1);
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangeChannelCount;
    }(beepbox.Change));
    beepbox.ChangeChannelCount = ChangeChannelCount;
    var ChangeBeatsPerBar = (function (_super) {
        __extends(ChangeBeatsPerBar, _super);
        function ChangeBeatsPerBar(document, newValue) {
            var _this = _super.call(this) || this;
            if (document.song.beatsPerBar != newValue) {
                if (document.song.beatsPerBar > newValue) {
                    var sequence = new beepbox.ChangeSequence();
                    for (var i = 0; i < document.song.getChannelCount(); i++) {
                        for (var j = 0; j < document.song.channelPatterns[i].length; j++) {
                            sequence.append(new ChangeNoteTruncate(document, document.song.channelPatterns[i][j], newValue * document.song.partsPerBeat, document.song.beatsPerBar * document.song.partsPerBeat));
                        }
                    }
                }
                document.song.beatsPerBar = newValue;
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangeBeatsPerBar;
    }(beepbox.Change));
    beepbox.ChangeBeatsPerBar = ChangeBeatsPerBar;
    var ChangeChannelBar = (function (_super) {
        __extends(ChangeChannelBar, _super);
        function ChangeChannelBar(document, newChannel, newBar) {
            var _this = _super.call(this) || this;
            var oldChannel = document.channel;
            var oldBar = document.bar;
            document.channel = newChannel;
            document.bar = newBar;
            document.barScrollPos = Math.min(document.bar, Math.max(document.bar - 15, document.barScrollPos));
            document.notifier.changed();
            if (oldChannel != newChannel || oldBar != newBar) {
                _this._didSomething();
            }
            return _this;
        }
        return ChangeChannelBar;
    }(beepbox.Change));
    beepbox.ChangeChannelBar = ChangeChannelBar;
    var ChangeChorus = (function (_super) {
        __extends(ChangeChorus, _super);
        function ChangeChorus(document, newValue) {
            var _this = _super.call(this) || this;
            var oldValue = document.song.instrumentChorus[document.channel][document.getCurrentInstrument()];
            if (oldValue != newValue) {
                _this._didSomething();
                document.song.instrumentChorus[document.channel][document.getCurrentInstrument()] = newValue;
                document.notifier.changed();
            }
            return _this;
        }
        return ChangeChorus;
    }(beepbox.Change));
    beepbox.ChangeChorus = ChangeChorus;
    var ChangeEffect = (function (_super) {
        __extends(ChangeEffect, _super);
        function ChangeEffect(document, newValue) {
            var _this = _super.call(this) || this;
            var oldValue = document.song.instrumentEffects[document.channel][document.getCurrentInstrument()];
            if (oldValue != newValue) {
                document.song.instrumentEffects[document.channel][document.getCurrentInstrument()] = newValue;
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangeEffect;
    }(beepbox.Change));
    beepbox.ChangeEffect = ChangeEffect;
    var ChangeFilter = (function (_super) {
        __extends(ChangeFilter, _super);
        function ChangeFilter(document, newValue) {
            var _this = _super.call(this) || this;
            var oldValue = document.song.instrumentFilters[document.channel][document.getCurrentInstrument()];
            if (oldValue != newValue) {
                document.song.instrumentFilters[document.channel][document.getCurrentInstrument()] = newValue;
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangeFilter;
    }(beepbox.Change));
    beepbox.ChangeFilter = ChangeFilter;
	
	var ChangeHarm = (function (_super) {
        __extends(ChangeHarm, _super);
        function ChangeHarm(document, newValue) {
            var _this = _super.call(this) || this;
            var oldValue = document.song.instrumentHarm[document.channel][document.getCurrentInstrument()];
            if (oldValue != newValue) {
                document.song.instrumentHarm[document.channel][document.getCurrentInstrument()] = newValue;
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangeHarm;
    }(beepbox.Change));
    beepbox.ChangeHarm = ChangeHarm;
	
	var ChangeOffOne = (function (_super) {
        __extends(ChangeOffOne, _super);
        function ChangeOffOne(document, newValue) {
            var _this = _super.call(this) || this;
            var oldValue = document.song.instrumentOffOne[document.channel][document.getCurrentInstrument()];
            if (oldValue != newValue) {
                document.song.instrumentOffOne[document.channel][document.getCurrentInstrument()] = newValue;
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangeOffOne;
    }(beepbox.Change));
    beepbox.ChangeOffOne = ChangeOffOne;
	
	var ChangeOffOnev = (function (_super) {
        __extends(ChangeOffOne, _super);
        function ChangeOffOne(document, newValue) {
            var _this = _super.call(this) || this;
            var oldValue = document.song.instrumentOffOne[document.channel][document.getCurrentInstrument()];
            if (oldValue != newValue) {
                document.song.instrumentOffOne[document.channel][document.getCurrentInstrument()] = newValue;
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangeOffOne;
    }(beepbox.Change));
    beepbox.ChangeOffOne = ChangeOffOne;
	
    var ChangeInstrumentsPerChannel = (function (_super) {
        __extends(ChangeInstrumentsPerChannel, _super);
        function ChangeInstrumentsPerChannel(document, instrumentsPerChannel) {
            var _this = _super.call(this) || this;
            var oldInstrumentsPerChannel = document.song.instrumentsPerChannel;
            var newInstrumentsPerChannel = instrumentsPerChannel;
            if (document.song.instrumentsPerChannel != newInstrumentsPerChannel) {
                var oldInstrumentWaves = document.song.instrumentWaves;
                var oldInstrumentFilters = document.song.instrumentFilters;
                var oldInstrumentEnvelopes = document.song.instrumentEnvelopes;
                var oldInstrumentEffects = document.song.instrumentEffects;
                var oldInstrumentChorus = document.song.instrumentChorus;
				var oldInstrumentHarm = document.song.instrumentHarm;
				var oldInstrumentOffOne = document.song.instrumentOffOne;
                var oldInstrumentVolumes = document.song.instrumentVolumes;
                var newInstrumentWaves = [];
                var newInstrumentFilters = [];
                var newInstrumentEnvelopes = [];
                var newInstrumentEffects = [];
                var newInstrumentChorus = [];
				var newInstrumentHarm = [];
				var newInstrumentOffOne = [];
                var newInstrumentVolumes = [];
                var oldArrays = [oldInstrumentWaves, oldInstrumentFilters, oldInstrumentEnvelopes, oldInstrumentEffects, oldInstrumentChorus, oldInstrumentHarm, oldInstrumentOffOne, oldInstrumentVolumes];
                var newArrays = [newInstrumentWaves, newInstrumentFilters, newInstrumentEnvelopes, newInstrumentEffects, newInstrumentChorus, newInstrumentHarm, newInstrumentOffOne, newInstrumentVolumes];
                for (var k = 0; k < newArrays.length; k++) {
                    var oldArray = oldArrays[k];
                    var newArray = newArrays[k];
                    for (var i = 0; i < document.song.getChannelCount(); i++) {
                        var channel = [];
                        for (var j = 0; j < newInstrumentsPerChannel; j++) {
                            if (j < oldInstrumentsPerChannel) {
                                channel.push(oldArray[i][j]);
                            }
                            else {
                                if (k == 0) {
                                    channel.push(1);
                                }
                                else if (k == 2) {
                                    channel.push(1);
                                }
                                else {
                                    channel.push(0);
                                }
                            }
                        }
                        newArray.push(channel);
                    }
                }
                var newInstrumentIndices = [];
                for (var i = 0; i < document.song.getChannelCount(); i++) {
                    var oldIndices = [];
                    var newIndices = [];
                    for (var j = 0; j < document.song.patternsPerChannel; j++) {
                        var oldIndex = document.song.channelPatterns[i][j].instrument;
                        oldIndices.push(oldIndex);
                        newIndices.push(oldIndex < newInstrumentsPerChannel ? oldIndex : 0);
                    }
                    newInstrumentIndices.push(newIndices);
                }
                document.song.instrumentsPerChannel = newInstrumentsPerChannel;
                document.song.instrumentWaves = newInstrumentWaves;
                document.song.instrumentFilters = newInstrumentFilters;
                document.song.instrumentEnvelopes = newInstrumentEnvelopes;
                document.song.instrumentEffects = newInstrumentEffects;
                document.song.instrumentChorus = newInstrumentChorus;
				document.song.instrumentHarm = newInstrumentHarm;
				document.song.instrumentOffOne = newInstrumentOffOne;
                document.song.instrumentVolumes = newInstrumentVolumes;
                for (var i = 0; i < document.song.getChannelCount(); i++) {
                    for (var j = 0; j < document.song.patternsPerChannel; j++) {
                        document.song.channelPatterns[i][j].instrument = newInstrumentIndices[i][j];
                    }
                }
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangeInstrumentsPerChannel;
    }(beepbox.Change));
    beepbox.ChangeInstrumentsPerChannel = ChangeInstrumentsPerChannel;
    var ChangeKey = (function (_super) {
        __extends(ChangeKey, _super);
        function ChangeKey(document, newValue) {
            var _this = _super.call(this) || this;
            if (document.song.key != newValue) {
                document.song.key = newValue;
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangeKey;
    }(beepbox.Change));
    beepbox.ChangeKey = ChangeKey;
	

	    var ChangeTheme = (function (_super) {
        __extends(ChangeTheme, _super);
        function ChangeTheme(document, newValue) {
            var _this = _super.call(this) || this;
            if (document.song.theme != newValue) {
                document.song.theme = newValue;
                document.notifier.changed();
                _this._didSomething();
				themeset = document.song.theme
				refresh();
            }
            return _this;
        }
        return ChangeTheme;
		
    }(beepbox.Change));
    beepbox.ChangeTheme = ChangeTheme;
	
	
    var ChangeLoop = (function (_super) {
        __extends(ChangeLoop, _super);
        function ChangeLoop(_document, oldStart, oldLength, newStart, newLength) {
            var _this = _super.call(this) || this;
            _this._document = _document;
            _this.oldStart = oldStart;
            _this.oldLength = oldLength;
            _this.newStart = newStart;
            _this.newLength = newLength;
            _this._document.song.loopStart = _this.newStart;
            _this._document.song.loopLength = _this.newLength;
            _this._document.notifier.changed();
            if (_this.oldStart != _this.newStart || _this.oldLength != _this.newLength) {
                _this._didSomething();
            }
            return _this;
        }
        return ChangeLoop;
    }(beepbox.Change));
    beepbox.ChangeLoop = ChangeLoop;
    var ChangePitchAdded = (function (_super) {
        __extends(ChangePitchAdded, _super);
        function ChangePitchAdded(document, pattern, note, pitch, index, deletion) {
            if (deletion === void 0) { deletion = false; }
            var _this = _super.call(this, deletion) || this;
            _this._document = document;
            _this._pattern = pattern;
            _this._note = note;
            _this._pitch = pitch;
            _this._index = index;
            _this._didSomething();
            _this.redo();
            return _this;
        }
        ChangePitchAdded.prototype._doForwards = function () {
            this._note.pitches.splice(this._index, 0, this._pitch);
            this._document.notifier.changed();
        };
        ChangePitchAdded.prototype._doBackwards = function () {
            this._note.pitches.splice(this._index, 1);
            this._document.notifier.changed();
        };
        return ChangePitchAdded;
    }(beepbox.UndoableChange));
    beepbox.ChangePitchAdded = ChangePitchAdded;
    var ChangeOctave = (function (_super) {
        __extends(ChangeOctave, _super);
        function ChangeOctave(document, oldValue, newValue) {
            var _this = _super.call(this) || this;
            _this.oldValue = oldValue;
            document.song.channelOctaves[document.channel] = newValue;
            document.notifier.changed();
            if (oldValue != newValue)
                _this._didSomething();
            return _this;
        }
        return ChangeOctave;
    }(beepbox.Change));
    beepbox.ChangeOctave = ChangeOctave;
    var ChangePartsPerBeat = (function (_super) {
        __extends(ChangePartsPerBeat, _super);
        function ChangePartsPerBeat(document, newValue) {
            var _this = _super.call(this) || this;
            if (document.song.partsPerBeat != newValue) {
                for (var i = 0; i < document.song.getChannelCount(); i++) {
                    for (var j = 0; j < document.song.channelPatterns[i].length; j++) {
                        _this.append(new ChangeRhythm(document, document.song.channelPatterns[i][j], document.song.partsPerBeat, newValue));
                    }
                }
                document.song.partsPerBeat = newValue;
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangePartsPerBeat;
    }(beepbox.ChangeGroup));
    beepbox.ChangePartsPerBeat = ChangePartsPerBeat;
    var ChangePaste = (function (_super) {
        __extends(ChangePaste, _super);
        function ChangePaste(document, pattern, notes, newBeatsPerBar, newPartsPerBeat) {
            var _this = _super.call(this) || this;
            pattern.notes = notes;
            if (document.song.partsPerBeat != newPartsPerBeat) {
                _this.append(new ChangeRhythm(document, pattern, newPartsPerBeat, document.song.partsPerBeat));
            }
            if (document.song.beatsPerBar != newBeatsPerBar) {
                _this.append(new ChangeNoteTruncate(document, pattern, document.song.beatsPerBar * document.song.partsPerBeat, newBeatsPerBar * document.song.partsPerBeat));
            }
            document.notifier.changed();
            _this._didSomething();
            return _this;
        }
        return ChangePaste;
    }(beepbox.ChangeGroup));
    beepbox.ChangePaste = ChangePaste;
    var ChangePatternInstrument = (function (_super) {
        __extends(ChangePatternInstrument, _super);
        function ChangePatternInstrument(document, newValue, pattern) {
            var _this = _super.call(this) || this;
            if (pattern.instrument != newValue) {
                pattern.instrument = newValue;
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangePatternInstrument;
    }(beepbox.Change));
    beepbox.ChangePatternInstrument = ChangePatternInstrument;
    var ChangePatternsPerChannel = (function (_super) {
        __extends(ChangePatternsPerChannel, _super);
        function ChangePatternsPerChannel(document, newValue) {
            var _this = _super.call(this) || this;
            if (document.song.patternsPerChannel != newValue) {
                for (var i = 0; i < document.song.getChannelCount(); i++) {
                    var channelBars = document.song.channelBars[i];
                    var channelPatterns = document.song.channelPatterns[i];
                    for (var j = 0; j < channelBars.length; j++) {
                        if (channelBars[j] > newValue)
                            channelBars[j] = 0;
                    }
                    for (var j = channelPatterns.length; j < newValue; j++) {
                        channelPatterns[j] = new beepbox.BarPattern();
                    }
                    channelPatterns.length = newValue;
                }
                document.song.patternsPerChannel = newValue;
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangePatternsPerChannel;
    }(beepbox.Change));
    beepbox.ChangePatternsPerChannel = ChangePatternsPerChannel;
    var ChangePinTime = (function (_super) {
        __extends(ChangePinTime, _super);
        function ChangePinTime(document, note, pinIndex, shiftedTime) {
            var _this = _super.call(this, document, note) || this;
            shiftedTime -= _this._oldStart;
            var originalTime = _this._oldPins[pinIndex].time;
            var skipStart = Math.min(originalTime, shiftedTime);
            var skipEnd = Math.max(originalTime, shiftedTime);
            var setPin = false;
            for (var i = 0; i < _this._oldPins.length; i++) {
                var oldPin = note.pins[i];
                var time = oldPin.time;
                if (time < skipStart) {
                    _this._newPins.push(beepbox.makeNotePin(oldPin.interval, time, oldPin.volume));
                }
                else if (time > skipEnd) {
                    if (!setPin) {
                        _this._newPins.push(beepbox.makeNotePin(_this._oldPins[pinIndex].interval, shiftedTime, _this._oldPins[pinIndex].volume));
                        setPin = true;
                    }
                    _this._newPins.push(beepbox.makeNotePin(oldPin.interval, time, oldPin.volume));
                }
            }
            if (!setPin) {
                _this._newPins.push(beepbox.makeNotePin(_this._oldPins[pinIndex].interval, shiftedTime, _this._oldPins[pinIndex].volume));
            }
            _this._finishSetup();
            return _this;
        }
        return ChangePinTime;
    }(ChangePins));
    beepbox.ChangePinTime = ChangePinTime;
    var ChangePitchBend = (function (_super) {
        __extends(ChangePitchBend, _super);
        function ChangePitchBend(document, note, bendStart, bendEnd, bendTo, pitchIndex) {
            var _this = _super.call(this, document, note) || this;
            bendStart -= _this._oldStart;
            bendEnd -= _this._oldStart;
            bendTo -= note.pitches[pitchIndex];
            var setStart = false;
            var setEnd = false;
            var prevInterval = 0;
            var prevVolume = 3;
            var persist = true;
            var i;
            var direction;
            var stop;
            var push;
            if (bendEnd > bendStart) {
                i = 0;
                direction = 1;
                stop = note.pins.length;
                push = function (item) { _this._newPins.push(item); };
            }
            else {
                i = note.pins.length - 1;
                direction = -1;
                stop = -1;
                push = function (item) { _this._newPins.unshift(item); };
            }
            for (; i != stop; i += direction) {
                var oldPin = note.pins[i];
                var time = oldPin.time;
                for (;;) {
                    if (!setStart) {
                        if (time * direction <= bendStart * direction) {
                            prevInterval = oldPin.interval;
                            prevVolume = oldPin.volume;
                        }
                        if (time * direction < bendStart * direction) {
                            push(beepbox.makeNotePin(oldPin.interval, time, oldPin.volume));
                            break;
                        }
                        else {
                            push(beepbox.makeNotePin(prevInterval, bendStart, prevVolume));
                            setStart = true;
                        }
                    }
                    else if (!setEnd) {
                        if (time * direction <= bendEnd * direction) {
                            prevInterval = oldPin.interval;
                            prevVolume = oldPin.volume;
                        }
                        if (time * direction < bendEnd * direction) {
                            break;
                        }
                        else {
                            push(beepbox.makeNotePin(bendTo, bendEnd, prevVolume));
                            setEnd = true;
                        }
                    }
                    else {
                        if (time * direction == bendEnd * direction) {
                            break;
                        }
                        else {
                            if (oldPin.interval != prevInterval)
                                persist = false;
                            push(beepbox.makeNotePin(persist ? bendTo : oldPin.interval, time, oldPin.volume));
                            break;
                        }
                    }
                }
            }
            if (!setEnd) {
                push(beepbox.makeNotePin(bendTo, bendEnd, prevVolume));
            }
            _this._finishSetup();
            return _this;
        }
        return ChangePitchBend;
    }(ChangePins));
    beepbox.ChangePitchBend = ChangePitchBend;
    var ChangeRhythm = (function (_super) {
        __extends(ChangeRhythm, _super);
        function ChangeRhythm(document, bar, oldPartsPerBeat, newPartsPerBeat) {
            var _this = _super.call(this) || this;
            var changeRhythm;
            if (oldPartsPerBeat > newPartsPerBeat) {
                changeRhythm = function (oldTime) { return Math.ceil(oldTime * newPartsPerBeat / oldPartsPerBeat); };
            }
            else if (oldPartsPerBeat < newPartsPerBeat) {
                changeRhythm = function (oldTime) { return Math.floor(oldTime * newPartsPerBeat / oldPartsPerBeat); };
            }
            else {
                throw new Error("ChangeRhythm couldn't handle rhythm change from " + oldPartsPerBeat + " to " + newPartsPerBeat + ".");
            }
            var i = 0;
            while (i < bar.notes.length) {
                var note = bar.notes[i];
                if (changeRhythm(note.start) >= changeRhythm(note.end)) {
                    _this.append(new ChangeNoteAdded(document, bar, note, i, true));
                }
                else {
                    _this.append(new ChangeRhythmNote(document, note, changeRhythm));
                    i++;
                }
            }
            return _this;
        }
        return ChangeRhythm;
    }(beepbox.ChangeSequence));
    beepbox.ChangeRhythm = ChangeRhythm;
    var ChangeRhythmNote = (function (_super) {
        __extends(ChangeRhythmNote, _super);
        function ChangeRhythmNote(document, note, changeRhythm) {
            var _this = _super.call(this, document, note) || this;
            for (var _i = 0, _a = _this._oldPins; _i < _a.length; _i++) {
                var oldPin = _a[_i];
                _this._newPins.push(beepbox.makeNotePin(oldPin.interval, changeRhythm(oldPin.time + _this._oldStart) - _this._oldStart, oldPin.volume));
            }
            _this._finishSetup();
            return _this;
        }
        return ChangeRhythmNote;
    }(ChangePins));
    beepbox.ChangeRhythmNote = ChangeRhythmNote;
    var ChangeScale = (function (_super) {
        __extends(ChangeScale, _super);
        function ChangeScale(document, newValue) {
            var _this = _super.call(this) || this;
            if (document.song.scale != newValue) {
                document.song.scale = newValue;
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangeScale;
    }(beepbox.Change));
    beepbox.ChangeScale = ChangeScale;
	
	var ChangeASettings = (function (_super) {
        __extends(ChangeASettings, _super);
        function ChangeASettings(document, newValue) {
            var _this = _super.call(this) || this;
            if (document.song.aSettings != newValue) {
                document.song.aSettings = newValue;
                aValue = document.song.aSettings
				document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangeASettings;
    }(beepbox.Change));
    beepbox.ChangeASettings = ChangeASettings;
	
    var ChangeSong = (function (_super) {
        __extends(ChangeSong, _super);
        function ChangeSong(document, newHash) {
            var _this = _super.call(this) || this;
            document.song.fromBase64String(newHash);
            document.channel = Math.min(document.channel, document.song.getChannelCount() - 1);
            document.bar = Math.max(0, Math.min(document.song.barCount - 1, document.bar));
            document.barScrollPos = Math.max(0, Math.min(document.song.barCount - 16, document.barScrollPos));
            document.barScrollPos = Math.min(document.bar, Math.max(document.bar - 15, document.barScrollPos));
            document.notifier.changed();
            _this._didSomething();
            return _this;
        }
        return ChangeSong;
    }(beepbox.Change));
    beepbox.ChangeSong = ChangeSong;
    var ChangeTempo = (function (_super) {
        __extends(ChangeTempo, _super);
        function ChangeTempo(document, oldValue, newValue) {
            var _this = _super.call(this) || this;
            _this.oldValue = oldValue;
            document.song.tempo = newValue;
            document.notifier.changed();
            if (oldValue != newValue)
                _this._didSomething();
            return _this;
        }
        return ChangeTempo;
    }(beepbox.Change));
    beepbox.ChangeTempo = ChangeTempo;
    var ChangeReverb = (function (_super) {
        __extends(ChangeReverb, _super);
        function ChangeReverb(document, oldValue, newValue) {
            var _this = _super.call(this) || this;
            _this.oldValue = oldValue;
            document.song.reverb = newValue;
            document.notifier.changed();
            if (oldValue != newValue)
                _this._didSomething();
            return _this;
        }
        return ChangeReverb;
    }(beepbox.Change));
    beepbox.ChangeReverb = ChangeReverb;
	
	var ChangeBlend = (function (_super) {
        __extends(ChangeBlend, _super);
        function ChangeBlend(document, oldValue, newValue) {
            var _this = _super.call(this) || this;
            _this.oldValue = oldValue;
            document.song.blend = newValue;
            document.notifier.changed();
            if (oldValue != newValue)
                _this._didSomething();
            return _this;
        }
        return ChangeBlend;
    }(beepbox.Change));
    beepbox.ChangeBlend = ChangeBlend;
	
	var ChangeRiff = (function (_super) {
        __extends(ChangeRiff, _super);
        function ChangeRiff(document, oldValue, newValue) {
            var _this = _super.call(this) || this;
            _this.oldValue = oldValue;
            document.song.riff = newValue;
            document.notifier.changed();
            if (oldValue != newValue)
                _this._didSomething();
            return _this;
        }
        return ChangeRiff;
    }(beepbox.Change));
    beepbox.ChangeRiff = ChangeRiff;

	var ChangeDecaysl = (function (_super) {
        __extends(ChangeDecaysl, _super);
        function ChangeDecaysl(document, oldValue, newValue) {
            var _this = _super.call(this) || this;
            _this.oldValue = oldValue;
            document.song.decaysl = newValue;
            document.notifier.changed();
            if (oldValue != newValue)
                _this._didSomething();
            return _this;
        }
        return ChangeDecaysl;
    }(beepbox.Change));
    beepbox.ChangeDecaysl = ChangeDecaysl;
	

    var ChangeNoteAdded = (function (_super) {
        __extends(ChangeNoteAdded, _super);
        function ChangeNoteAdded(document, bar, note, index, deletion) {
            if (deletion === void 0) { deletion = false; }
            var _this = _super.call(this, deletion) || this;
            _this._document = document;
            _this._bar = bar;
            _this._note = note;
            _this._index = index;
            _this._didSomething();
            _this.redo();
            return _this;
        }
        ChangeNoteAdded.prototype._doForwards = function () {
            this._bar.notes.splice(this._index, 0, this._note);
            this._document.notifier.changed();
        };
        ChangeNoteAdded.prototype._doBackwards = function () {
            this._bar.notes.splice(this._index, 1);
            this._document.notifier.changed();
        };
        return ChangeNoteAdded;
    }(beepbox.UndoableChange));
    beepbox.ChangeNoteAdded = ChangeNoteAdded;
    var ChangeNoteLength = (function (_super) {
        __extends(ChangeNoteLength, _super);
        function ChangeNoteLength(document, note, truncStart, truncEnd) {
            var _this = _super.call(this, document, note) || this;
            truncStart -= _this._oldStart;
            truncEnd -= _this._oldStart;
            var setStart = false;
            var prevVolume = _this._oldPins[0].volume;
            var prevInterval = _this._oldPins[0].interval;
            var pushLastPin = true;
            var i;
            for (i = 0; i < _this._oldPins.length; i++) {
                var oldPin = _this._oldPins[i];
                if (oldPin.time < truncStart) {
                    prevVolume = oldPin.volume;
                    prevInterval = oldPin.interval;
                }
                else if (oldPin.time <= truncEnd) {
                    if (oldPin.time > truncStart && !setStart) {
                        _this._newPins.push(beepbox.makeNotePin(prevInterval, truncStart, prevVolume));
                    }
                    _this._newPins.push(beepbox.makeNotePin(oldPin.interval, oldPin.time, oldPin.volume));
                    setStart = true;
                    if (oldPin.time == truncEnd) {
                        pushLastPin = false;
                        break;
                    }
                }
                else {
                    break;
                }
            }
            if (pushLastPin)
                _this._newPins.push(beepbox.makeNotePin(_this._oldPins[i].interval, truncEnd, _this._oldPins[i].volume));
            _this._finishSetup();
            return _this;
        }
        return ChangeNoteLength;
    }(ChangePins));
    beepbox.ChangeNoteLength = ChangeNoteLength;
    var ChangeNoteTruncate = (function (_super) {
        __extends(ChangeNoteTruncate, _super);
        function ChangeNoteTruncate(document, bar, start, end, skipNote) {
            var _this = _super.call(this) || this;
            var i = 0;
            while (i < bar.notes.length) {
                var note = bar.notes[i];
                if (note == skipNote && skipNote != undefined) {
                    i++;
                }
                else if (note.end <= start) {
                    i++;
                }
                else if (note.start >= end) {
                    break;
                }
                else if (note.start < start) {
                    _this.append(new ChangeNoteLength(document, note, note.start, start));
                    i++;
                }
                else if (note.end > end) {
                    _this.append(new ChangeNoteLength(document, note, end, note.end));
                    i++;
                }
                else {
                    _this.append(new ChangeNoteAdded(document, bar, note, i, true));
                }
            }
            return _this;
        }
        return ChangeNoteTruncate;
    }(beepbox.ChangeSequence));
    beepbox.ChangeNoteTruncate = ChangeNoteTruncate;
    var ChangeTransposeNote = (function (_super) {
        __extends(ChangeTransposeNote, _super);
        function ChangeTransposeNote(doc, note, upward) {
            var _this = _super.call(this, false) || this;
            _this._document = doc;
            _this._note = note;
            _this._oldPins = note.pins;
            _this._newPins = [];
            _this._oldPitches = note.pitches;
            _this._newPitches = [];
            var maxPitch = (doc.song.getChannelIsDrum(doc.channel) ? beepbox.Config.drumCount - 1 : beepbox.Config.maxPitch);
            for (var i = 0; i < _this._oldPitches.length; i++) {
                var pitch = _this._oldPitches[i];
                if (upward) {
                    for (var j = pitch + 1; j <= maxPitch; j++) {
                        if (doc.song.getChannelIsDrum(doc.channel) || beepbox.Config.scaleFlags[doc.song.scale][j % 12]) {
                            pitch = j;
                            break;
                        }
                    }
                }
                else {
                    for (var j = pitch - 1; j >= 0; j--) {
                        if (doc.song.getChannelIsDrum(doc.channel) || beepbox.Config.scaleFlags[doc.song.scale][j % 12]) {
                            pitch = j;
                            break;
                        }
                    }
                }
                var foundMatch = false;
                for (var j = 0; j < _this._newPitches.length; j++) {
                    if (_this._newPitches[j] == pitch) {
                        foundMatch = true;
                        break;
                    }
                }
                if (!foundMatch)
                    _this._newPitches.push(pitch);
            }
            var min = 0;
            var max = maxPitch;
            for (var i = 1; i < _this._newPitches.length; i++) {
                var diff = _this._newPitches[0] - _this._newPitches[i];
                if (min < diff)
                    min = diff;
                if (max > diff + maxPitch)
                    max = diff + maxPitch;
            }
            for (var _i = 0, _a = _this._oldPins; _i < _a.length; _i++) {
                var oldPin = _a[_i];
                var interval = oldPin.interval + _this._oldPitches[0];
                if (interval < min)
                    interval = min;
                if (interval > max)
                    interval = max;
                if (upward) {
                    for (var i = interval + 1; i <= max; i++) {
                        if (doc.song.getChannelIsDrum(doc.channel) || beepbox.Config.scaleFlags[doc.song.scale][i % 12]) {
                            interval = i;
                            break;
                        }
                    }
                }
                else {
                    for (var i = interval - 1; i >= min; i--) {
                        if (doc.song.getChannelIsDrum(doc.channel) || beepbox.Config.scaleFlags[doc.song.scale][i % 12]) {
                            interval = i;
                            break;
                        }
                    }
                }
                interval -= _this._newPitches[0];
                _this._newPins.push(beepbox.makeNotePin(interval, oldPin.time, oldPin.volume));
            }
            if (_this._newPins[0].interval != 0)
                throw new Error("wrong pin start interval");
            for (var i = 1; i < _this._newPins.length - 1;) {
                if (_this._newPins[i - 1].interval == _this._newPins[i].interval &&
                    _this._newPins[i].interval == _this._newPins[i + 1].interval &&
                    _this._newPins[i - 1].volume == _this._newPins[i].volume &&
                    _this._newPins[i].volume == _this._newPins[i + 1].volume) {
                    _this._newPins.splice(i, 1);
                }
                else {
                    i++;
                }
            }
            _this._doForwards();
            _this._didSomething();
            return _this;
        }
        ChangeTransposeNote.prototype._doForwards = function () {
            this._note.pins = this._newPins;
            this._note.pitches = this._newPitches;
            this._document.notifier.changed();
        };
        ChangeTransposeNote.prototype._doBackwards = function () {
            this._note.pins = this._oldPins;
            this._note.pitches = this._oldPitches;
            this._document.notifier.changed();
        };
        return ChangeTransposeNote;
    }(beepbox.UndoableChange));
    beepbox.ChangeTransposeNote = ChangeTransposeNote;
    var ChangeTranspose = (function (_super) {
        __extends(ChangeTranspose, _super);
        function ChangeTranspose(document, bar, upward) {
            var _this = _super.call(this) || this;
            for (var i = 0; i < bar.notes.length; i++) {
                _this.append(new ChangeTransposeNote(document, bar.notes[i], upward));
            }
            return _this;
        }
        return ChangeTranspose;
    }(beepbox.ChangeSequence));
    beepbox.ChangeTranspose = ChangeTranspose;
    var ChangeVolume = (function (_super) {
        __extends(ChangeVolume, _super);
        function ChangeVolume(document, oldValue, newValue) {
            var _this = _super.call(this) || this;
            _this.oldValue = oldValue;
            document.song.instrumentVolumes[document.channel][document.getCurrentInstrument()] = newValue;
            document.notifier.changed();
            if (oldValue != newValue)
                _this._didSomething();
            return _this;
        }
        return ChangeVolume;
    }(beepbox.Change));
    beepbox.ChangeVolume = ChangeVolume;
    var ChangeVolumeBend = (function (_super) {
        __extends(ChangeVolumeBend, _super);
        function ChangeVolumeBend(document, bar, note, bendPart, bendVolume, bendInterval) {
            var _this = _super.call(this, false) || this;
            _this._document = document;
            _this._bar = bar;
            _this._note = note;
            _this._oldPins = note.pins;
            _this._newPins = [];
            var inserted = false;
            for (var _i = 0, _a = note.pins; _i < _a.length; _i++) {
                var pin = _a[_i];
                if (pin.time < bendPart) {
                    _this._newPins.push(pin);
                }
                else if (pin.time == bendPart) {
                    _this._newPins.push(beepbox.makeNotePin(bendInterval, bendPart, bendVolume));
                    inserted = true;
                }
                else {
                    if (!inserted) {
                        _this._newPins.push(beepbox.makeNotePin(bendInterval, bendPart, bendVolume));
                        inserted = true;
                    }
                    _this._newPins.push(pin);
                }
            }
            for (var i = 1; i < _this._newPins.length - 1;) {
                if (_this._newPins[i - 1].interval == _this._newPins[i].interval &&
                    _this._newPins[i].interval == _this._newPins[i + 1].interval &&
                    _this._newPins[i - 1].volume == _this._newPins[i].volume &&
                    _this._newPins[i].volume == _this._newPins[i + 1].volume) {
                    _this._newPins.splice(i, 1);
                }
                else {
                    i++;
                }
            }
            _this._doForwards();
            _this._didSomething();
            return _this;
        }
        ChangeVolumeBend.prototype._doForwards = function () {
            this._note.pins = this._newPins;
            this._document.notifier.changed();
        };
        ChangeVolumeBend.prototype._doBackwards = function () {
            this._note.pins = this._oldPins;
            this._document.notifier.changed();
        };
        return ChangeVolumeBend;
    }(beepbox.UndoableChange));
    beepbox.ChangeVolumeBend = ChangeVolumeBend;
    var ChangeWave = (function (_super) {
        __extends(ChangeWave, _super);
        function ChangeWave(document, newValue) {
            var _this = _super.call(this) || this;
            if (document.song.instrumentWaves[document.channel][document.getCurrentInstrument()] != newValue) {
                document.song.instrumentWaves[document.channel][document.getCurrentInstrument()] = newValue;
                document.notifier.changed();
                _this._didSomething();
            }
            return _this;
        }
        return ChangeWave;
    }(beepbox.Change));
    beepbox.ChangeWave = ChangeWave;
})(beepbox || (beepbox = {}));
var beepbox;
(function (beepbox) {
    var LoopEditor = (function () {
        function LoopEditor(_doc) {
            var _this = this;
            this._doc = _doc;
            this._barWidth = 32;
            this._editorWidth = 512;
            this._editorHeight = 20;
            this._startMode = 0;
            this._endMode = 1;
            this._bothMode = 2;
            this._loop = beepbox.svgElement("path", { fill: "none", stroke: sliderOneColorPallet[_this._doc.song.theme], "stroke-width": 4 });
            this._highlight = beepbox.svgElement("path", { fill: "white", "pointer-events": "none" });
            this._svg = beepbox.svgElement("svg", { style: "background-color: #000000; touch-action: pan-y; position: absolute;", width: this._editorWidth, height: this._editorHeight }, [
                this._loop,
                this._highlight,
            ]);
            this._canvas = beepbox.html.canvas({ width: "512", height: "20" });
            this._preview = beepbox.html.canvas({ width: "512", height: "20" });
            this.container = beepbox.html.div({ style: "width: 512px; height: 20px; position: relative;" }, [this._svg]);
            this._change = null;
            this._cursor = { startBar: -1, mode: -1 };
            this._mouseX = 0;
            this._mouseY = 0;
            this._mouseDown = false;
            this._mouseOver = false;
            this._renderedLoopStart = -1;
            this._renderedLoopStop = -1;
            this._whenMouseOver = function (event) {
                if (_this._mouseOver)
                    return;
                _this._mouseOver = true;
                _this._updatePreview();
            };
            this._whenMouseOut = function (event) {
                if (!_this._mouseOver)
                    return;
                _this._mouseOver = false;
                _this._updatePreview();
            };
            this._whenMousePressed = function (event) {
                event.preventDefault();
                _this._mouseDown = true;
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = (event.clientX || event.pageX) - boundingRect.left;
                _this._mouseY = (event.clientY || event.pageY) - boundingRect.top;
                _this._updateCursorStatus();
                _this._updatePreview();
                _this._whenMouseMoved(event);
            };
            this._whenTouchPressed = function (event) {
                event.preventDefault();
                _this._mouseDown = true;
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = event.touches[0].clientX - boundingRect.left;
                _this._mouseY = event.touches[0].clientY - boundingRect.top;
                _this._updateCursorStatus();
                _this._updatePreview();
                _this._whenTouchMoved(event);
            };
            this._whenMouseMoved = function (event) {
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = (event.clientX || event.pageX) - boundingRect.left;
                _this._mouseY = (event.clientY || event.pageY) - boundingRect.top;
                _this._whenCursorMoved();
            };
            this._whenTouchMoved = function (event) {
                if (!_this._mouseDown)
                    return;
                event.preventDefault();
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = event.touches[0].clientX - boundingRect.left;
                _this._mouseY = event.touches[0].clientY - boundingRect.top;
                _this._whenCursorMoved();
            };
            this._whenCursorReleased = function (event) {
                if (_this._change != null)
                    _this._doc.history.record(_this._change);
                _this._change = null;
                _this._mouseDown = false;
                _this._updateCursorStatus();
                _this._render();
            };
            this._documentChanged = function () {
                _this._render();
            };
            this._updateCursorStatus();
            this._render();
            this._doc.notifier.watch(this._documentChanged);
            this.container.addEventListener("mousedown", this._whenMousePressed);
            document.addEventListener("mousemove", this._whenMouseMoved);
            document.addEventListener("mouseup", this._whenCursorReleased);
            this.container.addEventListener("mouseover", this._whenMouseOver);
            this.container.addEventListener("mouseout", this._whenMouseOut);
            this.container.addEventListener("touchstart", this._whenTouchPressed);
            document.addEventListener("touchmove", this._whenTouchMoved);
            document.addEventListener("touchend", this._whenCursorReleased);
            document.addEventListener("touchcancel", this._whenCursorReleased);
        }
        LoopEditor.prototype._updateCursorStatus = function () {
            var bar = this._mouseX / this._barWidth + this._doc.barScrollPos;
            this._cursor.startBar = bar;
            if (bar > this._doc.song.loopStart - 0.25 && bar < this._doc.song.loopStart + this._doc.song.loopLength + 0.25) {
                if (bar - this._doc.song.loopStart < this._doc.song.loopLength * 0.5) {
                    this._cursor.mode = this._startMode;
                }
                else {
                    this._cursor.mode = this._endMode;
                }
            }
            else {
                this._cursor.mode = this._bothMode;
            }
        };
        LoopEditor.prototype._findEndPoints = function (middle) {
            var start = Math.round(middle - this._doc.song.loopLength / 2);
            var end = start + this._doc.song.loopLength;
            if (start < 0) {
                end -= start;
                start = 0;
            }
            if (end > this._doc.song.barCount) {
                start -= end - this._doc.song.barCount;
                end = this._doc.song.barCount;
            }
            return { start: start, length: end - start };
        };
        LoopEditor.prototype._whenCursorMoved = function () {
            if (this._mouseDown) {
                var oldStart = this._doc.song.loopStart;
                var oldEnd = this._doc.song.loopStart + this._doc.song.loopLength;
                if (this._change != null && this._doc.history.lastChangeWas(this._change)) {
                    oldStart = this._change.oldStart;
                    oldEnd = oldStart + this._change.oldLength;
                }
                var bar = this._mouseX / this._barWidth + this._doc.barScrollPos;
                var start = void 0;
                var end = void 0;
                var temp = void 0;
                if (this._cursor.mode == this._startMode) {
                    start = oldStart + Math.round(bar - this._cursor.startBar);
                    end = oldEnd;
                    if (start == end) {
                        start = end - 1;
                    }
                    else if (start > end) {
                        temp = start;
                        start = end;
                        end = temp;
                    }
                    if (start < 0)
                        start = 0;
                    if (end >= this._doc.song.barCount)
                        end = this._doc.song.barCount;
                    this._change = new beepbox.ChangeLoop(this._doc, oldStart, oldEnd - oldStart, start, end - start);
                }
                else if (this._cursor.mode == this._endMode) {
                    start = oldStart;
                    end = oldEnd + Math.round(bar - this._cursor.startBar);
                    if (end == start) {
                        end = start + 1;
                    }
                    else if (end < start) {
                        temp = start;
                        start = end;
                        end = temp;
                    }
                    if (start < 0)
                        start = 0;
                    if (end >= this._doc.song.barCount)
                        end = this._doc.song.barCount;
                    this._change = new beepbox.ChangeLoop(this._doc, oldStart, oldEnd - oldStart, start, end - start);
                }
                else if (this._cursor.mode == this._bothMode) {
                    var endPoints = this._findEndPoints(bar);
                    this._change = new beepbox.ChangeLoop(this._doc, oldStart, oldEnd - oldStart, endPoints.start, endPoints.length);
                }
                this._doc.history.setProspectiveChange(this._change);
            }
            else {
                this._updateCursorStatus();
                this._updatePreview();
            }
        };
        LoopEditor.prototype._updatePreview = function () {
            var showHighlight = this._mouseOver && !this._mouseDown;
            this._highlight.style.visibility = showHighlight ? "visible" : "hidden";
            if (showHighlight) {
                var radius = this._editorHeight / 2;
                var highlightStart = (this._doc.song.loopStart - this._doc.barScrollPos) * this._barWidth;
                var highlightStop = (this._doc.song.loopStart + this._doc.song.loopLength - this._doc.barScrollPos) * this._barWidth;
                if (this._cursor.mode == this._startMode) {
                    highlightStop = (this._doc.song.loopStart - this._doc.barScrollPos) * this._barWidth + radius * 2;
                }
                else if (this._cursor.mode == this._endMode) {
                    highlightStart = (this._doc.song.loopStart + this._doc.song.loopLength - this._doc.barScrollPos) * this._barWidth - radius * 2;
                }
                else {
                    var endPoints = this._findEndPoints(this._cursor.startBar);
                    highlightStart = (endPoints.start - this._doc.barScrollPos) * this._barWidth;
                    highlightStop = (endPoints.start + endPoints.length - this._doc.barScrollPos) * this._barWidth;
                }
                this._highlight.setAttribute("d", "M " + (highlightStart + radius) + " " + 4 + " " +
                    ("L " + (highlightStop - radius) + " " + 4 + " ") +
                    ("A " + (radius - 4) + " " + (radius - 4) + " " + 0 + " " + 0 + " " + 1 + " " + (highlightStop - radius) + " " + (this._editorHeight - 4) + " ") +
                    ("L " + (highlightStart + radius) + " " + (this._editorHeight - 4) + " ") +
                    ("A " + (radius - 4) + " " + (radius - 4) + " " + 0 + " " + 0 + " " + 1 + " " + (highlightStart + radius) + " " + 4 + " ") +
                    "z");
            }
        };
        LoopEditor.prototype._render = function () {
            var radius = this._editorHeight / 2;
            var loopStart = (this._doc.song.loopStart - this._doc.barScrollPos) * this._barWidth;
            var loopStop = (this._doc.song.loopStart + this._doc.song.loopLength - this._doc.barScrollPos) * this._barWidth;
            if (this._renderedLoopStart != loopStart || this._renderedLoopStop != loopStop) {
                this._renderedLoopStart = loopStart;
                this._renderedLoopStop = loopStop;
                this._loop.setAttribute("d", "M " + (loopStart + radius) + " " + 2 + " " +
                    ("L " + (loopStop - radius) + " " + 2 + " ") +
                    ("A " + (radius - 2) + " " + (radius - 2) + " " + 0 + " " + 0 + " " + 1 + " " + (loopStop - radius) + " " + (this._editorHeight - 2) + " ") +
                    ("L " + (loopStart + radius) + " " + (this._editorHeight - 2) + " ") +
                    ("A " + (radius - 2) + " " + (radius - 2) + " " + 0 + " " + 0 + " " + 1 + " " + (loopStart + radius) + " " + 2 + " ") +
                    "z");
            }
            this._updatePreview();
        };
        return LoopEditor;
    }());
    beepbox.LoopEditor = LoopEditor;
})(beepbox || (beepbox = {}));
var beepbox;
(function (beepbox) {
    var BarScrollBar = (function () {
        function BarScrollBar(_doc) {
            var _this = this;
            this._doc = _doc;
            this._editorWidth = 512;
            this._editorHeight = 20;
            this._notches = beepbox.svgElement("svg", { "pointer-events": "none" });
            this._handle = beepbox.svgElement("rect", { fill: "#444444", x: 0, y: 2, width: 10, height: this._editorHeight - 4 });
            this._handleHighlight = beepbox.svgElement("rect", { fill: "none", stroke: "white", "stroke-width": 2, "pointer-events": "none", x: 0, y: 1, width: 10, height: this._editorHeight - 2 });
            this._leftHighlight = beepbox.svgElement("path", { fill: "white", "pointer-events": "none" });
            this._rightHighlight = beepbox.svgElement("path", { fill: "white", "pointer-events": "none" });
            this._svg = beepbox.svgElement("svg", { style: "background-color: #000000; touch-action: pan-y; position: absolute;", width: this._editorWidth, height: this._editorHeight }, [
                this._notches,
                this._handle,
                this._handleHighlight,
                this._leftHighlight,
                this._rightHighlight,
            ]);
            this.container = beepbox.html.div({ style: "width: 512px; height: 20px; overflow: hidden; position: relative;" }, [this._svg]);
            this._mouseX = 0;
            this._mouseY = 0;
            this._mouseDown = false;
            this._mouseOver = false;
            this._dragging = false;
            this._renderedNotchCount = -1;
            this._renderedBarPos = -1;
            this._whenMouseOver = function (event) {
                if (_this._mouseOver)
                    return;
                _this._mouseOver = true;
                _this._updatePreview();
            };
            this._whenMouseOut = function (event) {
                if (!_this._mouseOver)
                    return;
                _this._mouseOver = false;
                _this._updatePreview();
            };
            this._whenMousePressed = function (event) {
                event.preventDefault();
                _this._mouseDown = true;
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = (event.clientX || event.pageX) - boundingRect.left;
                _this._mouseY = (event.clientY || event.pageY) - boundingRect.top;
                _this._updatePreview();
                if (_this._mouseX >= _this._doc.barScrollPos * _this._barWidth && _this._mouseX <= (_this._doc.barScrollPos + 16) * _this._barWidth) {
                    _this._dragging = true;
                    _this._dragStart = _this._mouseX;
                }
            };
            this._whenTouchPressed = function (event) {
                event.preventDefault();
                _this._mouseDown = true;
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = event.touches[0].clientX - boundingRect.left;
                _this._mouseY = event.touches[0].clientY - boundingRect.top;
                _this._updatePreview();
                if (_this._mouseX >= _this._doc.barScrollPos * _this._barWidth && _this._mouseX <= (_this._doc.barScrollPos + 16) * _this._barWidth) {
                    _this._dragging = true;
                    _this._dragStart = _this._mouseX;
                }
            };
            this._whenMouseMoved = function (event) {
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = (event.clientX || event.pageX) - boundingRect.left;
                _this._mouseY = (event.clientY || event.pageY) - boundingRect.top;
                _this._whenCursorMoved();
            };
            this._whenTouchMoved = function (event) {
                if (!_this._mouseDown)
                    return;
                event.preventDefault();
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = event.touches[0].clientX - boundingRect.left;
                _this._mouseY = event.touches[0].clientY - boundingRect.top;
                _this._whenCursorMoved();
            };
            this._whenCursorReleased = function (event) {
                if (!_this._dragging && _this._mouseDown) {
                    if (_this._mouseX < (_this._doc.barScrollPos + 8) * _this._barWidth) {
                        if (_this._doc.barScrollPos > 0)
                            _this._doc.barScrollPos--;
                        _this._doc.notifier.changed();
                    }
                    else {
                        if (_this._doc.barScrollPos < _this._doc.song.barCount - 16)
                            _this._doc.barScrollPos++;
                        _this._doc.notifier.changed();
                    }
                }
                _this._mouseDown = false;
                _this._dragging = false;
                _this._updatePreview();
            };
            this._documentChanged = function () {
                _this._barWidth = (_this._editorWidth - 1) / Math.max(16, _this._doc.song.barCount);
                _this._render();
            };
            this._doc.notifier.watch(this._documentChanged);
            this._documentChanged();
            var center = this._editorHeight * 0.5;
            var base = 20;
            var tip = 9;
            var arrowHeight = 6;
            this._leftHighlight.setAttribute("d", "M " + tip + " " + center + " L " + base + " " + (center + arrowHeight) + " L " + base + " " + (center - arrowHeight) + " z");
            this._rightHighlight.setAttribute("d", "M " + (this._editorWidth - tip) + " " + center + " L " + (this._editorWidth - base) + " " + (center + arrowHeight) + " L " + (this._editorWidth - base) + " " + (center - arrowHeight) + " z");
            this.container.addEventListener("mousedown", this._whenMousePressed);
            document.addEventListener("mousemove", this._whenMouseMoved);
            document.addEventListener("mouseup", this._whenCursorReleased);
            this.container.addEventListener("mouseover", this._whenMouseOver);
            this.container.addEventListener("mouseout", this._whenMouseOut);
            this.container.addEventListener("touchstart", this._whenTouchPressed);
            document.addEventListener("touchmove", this._whenTouchMoved);
            document.addEventListener("touchend", this._whenCursorReleased);
            document.addEventListener("touchcancel", this._whenCursorReleased);
        }
        BarScrollBar.prototype._whenCursorMoved = function () {
            if (this._dragging) {
                while (this._mouseX - this._dragStart < -this._barWidth * 0.5) {
                    if (this._doc.barScrollPos > 0) {
                        this._doc.barScrollPos--;
                        this._dragStart -= this._barWidth;
                        this._doc.notifier.changed();
                    }
                    else {
                        break;
                    }
                }
                while (this._mouseX - this._dragStart > this._barWidth * 0.5) {
                    if (this._doc.barScrollPos < this._doc.song.barCount - 16) {
                        this._doc.barScrollPos++;
                        this._dragStart += this._barWidth;
                        this._doc.notifier.changed();
                    }
                    else {
                        break;
                    }
                }
            }
            if (this._mouseOver)
                this._updatePreview();
        };
        BarScrollBar.prototype._updatePreview = function () {
            var showHighlight = this._mouseOver && !this._mouseDown;
            var showleftHighlight = false;
            var showRightHighlight = false;
            var showHandleHighlight = false;
            if (showHighlight) {
                if (this._mouseX < this._doc.barScrollPos * this._barWidth) {
                    showleftHighlight = true;
                }
                else if (this._mouseX > (this._doc.barScrollPos + 16) * this._barWidth) {
                    showRightHighlight = true;
                }
                else {
                    showHandleHighlight = true;
                }
            }
            this._leftHighlight.style.visibility = showleftHighlight ? "visible" : "hidden";
            this._rightHighlight.style.visibility = showRightHighlight ? "visible" : "hidden";
            this._handleHighlight.style.visibility = showHandleHighlight ? "visible" : "hidden";
        };
        BarScrollBar.prototype._render = function () {
            var resized = this._renderedNotchCount != this._doc.song.barCount;
            if (resized) {
                this._renderedNotchCount = this._doc.song.barCount;
                while (this._notches.firstChild)
                    this._notches.removeChild(this._notches.firstChild);
                for (var i = 0; i <= this._doc.song.barCount; i++) {
                    var lineHeight = (i % 16 == 0) ? 0 : ((i % 4 == 0) ? this._editorHeight / 8 : this._editorHeight / 3);
                    this._notches.appendChild(beepbox.svgElement("rect", { fill: "#444444", x: i * this._barWidth - 1, y: lineHeight, width: 2, height: this._editorHeight - lineHeight * 2 }));
                }
            }
            if (resized || this._renderedBarPos != this._doc.barScrollPos) {
                this._renderedBarPos = this._doc.barScrollPos;
                this._handle.setAttribute("x", "" + (this._barWidth * this._doc.barScrollPos));
                this._handle.setAttribute("width", "" + (this._barWidth * 16));
                this._handleHighlight.setAttribute("x", "" + (this._barWidth * this._doc.barScrollPos));
                this._handleHighlight.setAttribute("width", "" + (this._barWidth * 16));
            }
            this._updatePreview();
        };
        return BarScrollBar;
    }());
    beepbox.BarScrollBar = BarScrollBar;
})(beepbox || (beepbox = {}));
var beepbox;
(function (beepbox) {
    var OctaveScrollBar = (function () {
        function OctaveScrollBar(_doc) {
            var _this = this;
            this._doc = _doc;
            this._editorWidth = 20;
            this._editorHeight = 481;
            this._notchHeight = 4.0;
            this._octaveCount = 7;
            this._octaveHeight = (this._editorHeight - this._notchHeight) / this._octaveCount;
            this._barHeight = (this._octaveHeight * 3 + this._notchHeight);
            this._handle = beepbox.svgElement("rect", { fill: sliderOctaveColorPallet[_this._doc.song.theme], x: 2, y: 0, width: this._editorWidth - 4, height: this._barHeight });
            this._handleHighlight = beepbox.svgElement("rect", { fill: "none", stroke: "white", "stroke-width": 2, "pointer-events": "none", x: 1, y: 0, width: this._editorWidth - 2, height: this._barHeight });
            this._upHighlight = beepbox.svgElement("path", { fill: "white", "pointer-events": "none" });
            this._downHighlight = beepbox.svgElement("path", { fill: "white", "pointer-events": "none" });
            this._svg = beepbox.svgElement("svg", { style: "background-color: #000000; touch-action: pan-x; position: absolute;", width: this._editorWidth, height: this._editorHeight });
            this.container = beepbox.html.div({ id: "octaveScrollBarContainer", style: "width: 20px; height: 481px; overflow: hidden; position: relative;" }, [this._svg]);
            this._mouseX = 0;
            this._mouseY = 0;
            this._mouseDown = false;
            this._mouseOver = false;
            this._dragging = false;
            this._renderedBarBottom = -1;
            this._change = null;
            this._whenMouseOver = function (event) {
                if (_this._mouseOver)
                    return;
                _this._mouseOver = true;
                _this._updatePreview();
            };
            this._whenMouseOut = function (event) {
                if (!_this._mouseOver)
                    return;
                _this._mouseOver = false;
                _this._updatePreview();
            };
            this._whenMousePressed = function (event) {
                event.preventDefault();
                _this._mouseDown = true;
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = (event.clientX || event.pageX) - boundingRect.left;
                _this._mouseY = (event.clientY || event.pageY) - boundingRect.top;
                if (_this._doc.song.getChannelIsDrum(_this._doc.channel))
                    return;
                _this._updatePreview();
                if (_this._mouseY >= _this._barBottom - _this._barHeight && _this._mouseY <= _this._barBottom) {
                    _this._dragging = true;
                    _this._dragStart = _this._mouseY;
                }
            };
            this._whenTouchPressed = function (event) {
                event.preventDefault();
                _this._mouseDown = true;
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = event.touches[0].clientX - boundingRect.left;
                _this._mouseY = event.touches[0].clientY - boundingRect.top;
                if (_this._doc.song.getChannelIsDrum(_this._doc.channel))
                    return;
                _this._updatePreview();
                if (_this._mouseY >= _this._barBottom - _this._barHeight && _this._mouseY <= _this._barBottom) {
                    _this._dragging = true;
                    _this._dragStart = _this._mouseY;
                }
            };
            this._whenMouseMoved = function (event) {
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = (event.clientX || event.pageX) - boundingRect.left;
                _this._mouseY = (event.clientY || event.pageY) - boundingRect.top;
                _this._whenCursorMoved();
            };
            this._whenTouchMoved = function (event) {
                if (!_this._mouseDown)
                    return;
                event.preventDefault();
                var boundingRect = _this._svg.getBoundingClientRect();
                _this._mouseX = event.touches[0].clientX - boundingRect.left;
                _this._mouseY = event.touches[0].clientY - boundingRect.top;
                _this._whenCursorMoved();
            };
            this._whenCursorReleased = function (event) {
                if (!_this._doc.song.getChannelIsDrum(_this._doc.channel) && !_this._dragging && _this._mouseDown) {
                    var continuousChange = _this._doc.history.lastChangeWas(_this._change);
                    var oldValue = continuousChange ? _this._change.oldValue : _this._doc.song.channelOctaves[_this._doc.channel];
                    var currentOctave = _this._doc.song.channelOctaves[_this._doc.channel];
                    if (_this._mouseY < _this._barBottom - _this._barHeight * 0.5) {
                        if (currentOctave < 4) {
                            _this._change = new beepbox.ChangeOctave(_this._doc, oldValue, currentOctave + 1);
                            _this._doc.history.record(_this._change, continuousChange);
                        }
                    }
                    else {
                        if (currentOctave > 0) {
                            _this._change = new beepbox.ChangeOctave(_this._doc, oldValue, currentOctave - 1);
                            _this._doc.history.record(_this._change, continuousChange);
                        }
                    }
                }
                _this._mouseDown = false;
                _this._dragging = false;
                _this._updatePreview();
            };
            this._documentChanged = function () {
                _this._barBottom = _this._editorHeight - (_this._octaveHeight * _this._doc.song.channelOctaves[_this._doc.channel]);
                _this._render();
            };
            this._doc.notifier.watch(this._documentChanged);
            this._documentChanged();
            this._svg.appendChild(this._handle);
            for (var i = 0; i <= this._octaveCount; i++) {
                this._svg.appendChild(beepbox.svgElement("rect", { fill: sliderOctaveNotchColorPallet[_this._doc.song.theme], x: 0, y: i * this._octaveHeight, width: this._editorWidth, height: this._notchHeight }));
            }
            this._svg.appendChild(this._handleHighlight);
            this._svg.appendChild(this._upHighlight);
            this._svg.appendChild(this._downHighlight);
            var center = this._editorWidth * 0.5;
            var base = 20;
            var tip = 9;
            var arrowWidth = 6;
            this._upHighlight.setAttribute("d", "M " + center + " " + tip + " L " + (center + arrowWidth) + " " + base + " L " + (center - arrowWidth) + " " + base + " z");
            this._downHighlight.setAttribute("d", "M " + center + " " + (this._editorHeight - tip) + " L " + (center + arrowWidth) + " " + (this._editorHeight - base) + " L " + (center - arrowWidth) + " " + (this._editorHeight - base) + " z");
            this.container.addEventListener("mousedown", this._whenMousePressed);
            document.addEventListener("mousemove", this._whenMouseMoved);
            document.addEventListener("mouseup", this._whenCursorReleased);
            this.container.addEventListener("mouseover", this._whenMouseOver);
            this.container.addEventListener("mouseout", this._whenMouseOut);
            this.container.addEventListener("touchstart", this._whenTouchPressed);
            document.addEventListener("touchmove", this._whenTouchMoved);
            document.addEventListener("touchend", this._whenCursorReleased);
            document.addEventListener("touchcancel", this._whenCursorReleased);
        }
        OctaveScrollBar.prototype._whenCursorMoved = function () {
            if (this._doc.song.getChannelIsDrum(this._doc.channel))
                return;
            if (this._dragging) {
                var currentOctave = this._doc.song.channelOctaves[this._doc.channel];
                var continuousChange = this._doc.history.lastChangeWas(this._change);
                var oldValue = continuousChange ? this._change.oldValue : currentOctave;
                var octave = currentOctave;
                while (this._mouseY - this._dragStart < -this._octaveHeight * 0.5) {
                    if (octave < 4) {
                        octave++;
                        this._dragStart -= this._octaveHeight;
                    }
                    else {
                        break;
                    }
                }
                while (this._mouseY - this._dragStart > this._octaveHeight * 0.5) {
                    if (octave > 0) {
                        octave--;
                        this._dragStart += this._octaveHeight;
                    }
                    else {
                        break;
                    }
                }
                if (octave != currentOctave) {
                    this._change = new beepbox.ChangeOctave(this._doc, oldValue, octave);
                    this._doc.history.record(this._change, continuousChange);
                }
            }
            if (this._mouseOver)
                this._updatePreview();
        };
        OctaveScrollBar.prototype._updatePreview = function () {
            var showHighlight = this._mouseOver && !this._mouseDown;
            var showUpHighlight = false;
            var showDownHighlight = false;
            var showHandleHighlight = false;
            if (showHighlight) {
                if (this._mouseY < this._barBottom - this._barHeight) {
                    showUpHighlight = true;
                }
                else if (this._mouseY > this._barBottom) {
                    showDownHighlight = true;
                }
                else {
                    showHandleHighlight = true;
                }
            }
            this._upHighlight.style.visibility = showUpHighlight ? "inherit" : "hidden";
            this._downHighlight.style.visibility = showDownHighlight ? "inherit" : "hidden";
            this._handleHighlight.style.visibility = showHandleHighlight ? "inherit" : "hidden";
        };
        OctaveScrollBar.prototype._render = function () {
            this._svg.style.visibility = (this._doc.song.getChannelIsDrum(this._doc.channel)) ? "hidden" : "visible";
            if (this._renderedBarBottom != this._barBottom) {
                this._renderedBarBottom = this._barBottom;
                this._handle.setAttribute("y", "" + (this._barBottom - this._barHeight));
                this._handleHighlight.setAttribute("y", "" + (this._barBottom - this._barHeight));
            }
            this._updatePreview();
        };
        return OctaveScrollBar;
    }());
    beepbox.OctaveScrollBar = OctaveScrollBar;
})(beepbox || (beepbox = {}));
var beepbox;
(function (beepbox) {
    var loadedCount = 0;
    var finishedLoadingImages = false;
    function onLoaded() {
        loadedCount++;
        finishedLoadingImages = true;
    }
    var BlackKey = document.createElement("img");
    BlackKey.onload = onLoaded;
    BlackKey.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAANCAIAAABHKvtLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEU3RTM2RTg0NzBEMTFFMTgyMjBBREEyQTVGRDY5MjIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEU3RTM2RTk0NzBEMTFFMTgyMjBBREEyQTVGRDY5MjIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDozMzYxN0U3RDQ3MEQxMUUxODIyMEFEQTJBNUZENjkyMiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDozMzYxN0U3RTQ3MEQxMUUxODIyMEFEQTJBNUZENjkyMiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PomGIaQAAABgSURBVHjaYpSWlmZhYWFmZgaSTExMQAYTGGAyIICRkRFIMhANWISFhdlggAUHANrBysoKNBfuCGKMvnjx4r59+xhp5wOg6UCSBM+SB0YtGLVgCFgAzDeMeOSGgAUAAQYAGgwJrOg8pdQAAAAASUVORK5CYII=";
    var BlackKeyDisabled = document.createElement("img");
    BlackKeyDisabled.onload = onLoaded;
    BlackKeyDisabled.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAANCAIAAABHKvtLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEU3RTM2RUM0NzBEMTFFMTgyMjBBREEyQTVGRDY5MjIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEU3RTM2RUQ0NzBEMTFFMTgyMjBBREEyQTVGRDY5MjIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0RTdFMzZFQTQ3MEQxMUUxODIyMEFEQTJBNUZENjkyMiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo0RTdFMzZFQjQ3MEQxMUUxODIyMEFEQTJBNUZENjkyMiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PhURscAAAAB1SURBVHja7NPBCoAgDAZgnaMX8Oj7P2KKldXPhiR4CwwCv4PInPvxoA0hMLNzDisRYUPCCiMucVallJzzJnaBih5pp2mw936puKEZ2qQ3MeUQmLiKGGNKCZ1IQr2fDnb0C8gMNgNmwA8Cnt/0Tv91vw64BRgALUuP70jrlrwAAAAASUVORK5CYII=";
    var WhiteKey = document.createElement("img");
    WhiteKey.onload = onLoaded;
    WhiteKey.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAANCAIAAABHKvtLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MzM2MTdFNzc0NzBEMTFFMTgyMjBBREEyQTVGRDY5MjIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MzM2MTdFNzg0NzBEMTFFMTgyMjBBREEyQTVGRDY5MjIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDozMzYxN0U3NTQ3MEQxMUUxODIyMEFEQTJBNUZENjkyMiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDozMzYxN0U3NjQ3MEQxMUUxODIyMEFEQTJBNUZENjkyMiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgBmMXoAAACTSURBVHja7JQ7CgMhGIT3920M2Hko7+RJPYWViE0myi5sEXAhKQL7FcP8PmawkWKMjx2llNb60MNIKY0xnPPphRDbMsJ7/xw458wAodZa6PRQ5GIF0RjlYCU655xSEqWU3ntrrdb63RcgHcq2H3MX3AV/UEAhBL7DBkTEzmAFuzSY44UC/BDHtU+8z539esFLgAEAkZ4XCDjZXPEAAAAASUVORK5CYII=";
    var WhiteKeyDisabled = document.createElement("img");
    WhiteKeyDisabled.onload = onLoaded;
    WhiteKeyDisabled.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAANCAIAAABHKvtLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MzM2MTdFN0I0NzBEMTFFMTgyMjBBREEyQTVGRDY5MjIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MzM2MTdFN0M0NzBEMTFFMTgyMjBBREEyQTVGRDY5MjIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDozMzYxN0U3OTQ3MEQxMUUxODIyMEFEQTJBNUZENjkyMiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDozMzYxN0U3QTQ3MEQxMUUxODIyMEFEQTJBNUZENjkyMiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PlZjoH4AAADHSURBVHja7JTNDoMgEIRBGq21iTcfyvd/DeNvJBYBp7uFEE+99NDE70AMMDPLYZRt2z4CeZ4XRcFrRkgphRD7vnvvX8RGdF03DEPf99M0LcuitcamMcZa6wkRuNV1/SSqqroTcC/LEu5KKQ6AEhq21oRzDl5bAME8DUjd3wHjOELPyu9fgNnneV7XNQ6OyNPsTCZ+zBVwBfxBgGyaRgViuWIt+ZIPuAAaZwh00BKxaKeuSfwhUsfI55g+WOMT2DEl3jm94BBgAAtY6T6d3wTNAAAAAElFTkSuQmCC";
    var Drum = document.createElement("img");
    Drum.onload = onLoaded;
    Drum.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAArCAIAAACW3x1gAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowMTgwMTE3NDA3MjA2ODExOUJCOEEzOUJCMkI3MTdFNCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo5NzVEOTA1QzQ5MjMxMUUxOTM3RDhDNEI4QkIxQkFCNSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NzVEOTA1QjQ5MjMxMUUxOTM3RDhDNEI4QkIxQkFCNSIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjAxODAxMTc0MDcyMDY4MTE5QkI4QTM5QkIyQjcxN0U0IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjAxODAxMTc0MDcyMDY4MTE5QkI4QTM5QkIyQjcxN0U0Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+dtFK5QAACbRJREFUeNrcV0lsG9cZnnmzcJdIcRHFRZtly5IVSVYSOcriNY7jqHHTBE2bJkCRNijQQ9re2kOBAj30kByKAm1PvQVF0RYIkLRpkiZuLMqyLVm7bGvlIpKiuHOGyww52+ubIbXYCYLk2P4ccobz3nzf+9f3D4b9rwv+5cOXL5x48crDT54b8Pr6jOZWQJoxKIi13WJ+Oziz+Z/r6x9N3AvMhb42gcWkf/P1Mz/40fkWz2iuAAsFrljkOK5crVYwTNTrcaMRNDURNhtl1Slrn9x55x+zf/5ooVIVvhLBq1ce+eXPLpt6RnZ22EIBmk1Oi8VuMFoMBgNF6RUMF2tcrVqscPlSKcGV4zaC85qNd25u/PHdm/+8tf5lBBRJ/Oan49/98cVEDmcYg9PZ09LSrjcYSRzHcAAxDGBQQfMgJiuyAiFUFMSUT23mtu9YxYxVgX/6YPa3796QZGUfk9i/Mhvo3//8W99443wwKtB0T1fXqM3m0en0iJUgSIIkKYoiKBL9A4QqAEcCSFJnbnI3uboqIpHP7D7T73WYDbfW4+IexwHB22+OX3zpsfAu5nI96vUM0gY9wqN0JEJG2AAATFs7hlABrhKgk3qJQwwCgrY4/ZiuaSceO+VvslkM11Yi9xG8+dLj33/tdDgLPB1POB09JE0RAOESFEEiVOWQaIZBPxCtX2MBUKVRMAXTWZyk2RaPRp440lIV5PngboPgZE/br16/kBJwR9dTTtdxQkejBzUOoHxO4P2CCAgcV+8iDSHUWWyA0ieDa4N++1J4N8VUVMVfvTCEm/S0vc/Z1g9IoKIjU6PHkCBvyrJ63hMJffZ+tQkyDnDVPThR18beM6zvHmky0i8/OYDAwTGvfXz0WKoCXL5BFVv1p0qgmULRMJTD0HVKWdqj1EZVS2meV+MNU1zHTmZE6tLJ7qOeFvLMQ504TRkt3SarC00j1aOBrhmksUxFu4PuNxytAqHAhZj2Bw2h6Kprgym40d5m9PXqmbXTA53gzIA/V+KaXZ3aTBSCuKrpniDMOo+yv/bGr3qCyv46VE8jDVCmIBT0t7mtK1fkn+rzgpPdrWy5arS2qloCXHMWdp8flYatZGVPm7rd7nc6psUV0BgQgsnhYbnacGcr8DltXE3UGZsxFNA4JAgcUzU/RHDoWsOFh2Pp8ES0OnX9anWAtNnK1wSf00paTIZG0UAhV19+4/uAHNCqc2Hj3n2CDCxDWRvU1FCLJuB43qijahyLiFG2wEZ5wr+gLOKac7USUX/+gVlQ1pahsdZKjEFHcxwPWIZpNus5JgUhPICqY+1B4XvAQItHrUjsDR6aiRRT9gAq2USzUccyLNhNpe0WI5uOYFrEoAPDDqHvoSJMcJ8Q+7f3J6rxIGP1hbKJsN1iQOAgtJNutZu5bKjEpmU1HNXQeABcKzsNIfeKqVbv8H0OLbCgamQIuXySS6y7rOZQIgO2M2WsxrealHRsSdEiW5Kkfez6uV47Dyg0+ANzgUbqIAfXDZBZn3eSoiJUorkyoMzW9bW1Tk+LkFtNJ1YQPApESZFAAxqAQ9jEYZK6aKPItJJaPdRPdmupGlnocDWvra4hcHCi7/jdxXtihe3yWFKx2+lsUJZESVKLxAH2F1A0wNEAsrooC5Ko5ggb38wsBbps+mqZXVxZHeg7Dvq7vYlo+c78vN9t7fSARPxmMrmuCKIgSfUqRnwxeEOQZQRBRnpDWcxur6QWPm3XcT67eX5uLrHD93V5SSOsWk2ttwMLNp9rePwiyZbC0Vs8X/R5T+gNFog41F2SOEjdevRrXhVFUS2sklTjSsmt21xw7ogZ8za3XEcyvdzS3KOXeeInlx9iC3IikqkKCZ2ROjr6kKXJVCjsRqMx9CRBGpHBkWXrW1g9nRG0pNpRRGav8Gw6thy995mhuHW81eSxmK4HpiYnrzNFU9+xXp/XQLz8aIel2RqeTZZrNVHYJYDi7u7s6OqkaaJQSEajYYbJ8xwvSgJaLDI3YuW5EsNkc7lIYmchEbtJC9tHHFS/z6GUuclrE4GJwG6BBpJ1bKy3WGXJ5WDs+WfOOX0t+UgmaqieOM1uXP2Xb/iUv+Nhv7+DYYRstlIoZLYj259rvMg2D+mwuq2ohjL81vTC8tQ0hyk7eRpyTd52W09P6/uBKXLmXuSlK7D3VM+tSAZugv7Lb3349otCOe3OxW3+oWb7gNXqwDAdhqHdX0I1BsNQ+8ZjWBXDOHQh88XY3EpoZml1ZjGdLP/ivX9cffcVtKcPDXdStHJ7bZtcjGS2Ntb7xwbDs2F2K4UX37rzMcOOQoN5RSpuNbnnjPYjlMkP6DaIm1AfpDZdQqlWSVVyMSYeTm5sJtZCHMOHd2q7O2T449+hXdPvd5wc7tpYX12OZslIEd6YWe4a7h+8PHT9D5/GVxhXEiTey2eC1aOnnINnUUuUx2vLtIGUqlKVq/FlgWf5ClstM1yF4Zk0F4zUIiGhkiLNgNxeLaDUfvzxXkAIgfmV7TJGcBJGSJUeFz36wllBlP/+6+suknQSlCGthGfyK7PpWKhcydckUYtRHBN5KZ/m4qHS+jK7OFNYmC6mNyRzlTIRSDlseT537uzApUvDk4HAX29s3C2olsUWk9K/r06jPBj94WmlJu68v4RuNpGEkzLCNJbbza98mL4qiowsj35vOLZVWL8VpnFcDwA6/AQt62FVwQSo7iVjj/WOP/fwzVs3PpicvVuAjcarJKhrawM5i8My+NoFqSxVtlKEApE1DQA4KKqd1nXrdb1Gw/jf/jL2/KPyO5+00bSVotCoorkexS9OkWPnB158eWxpbnYiEPgsrmyyh1rHGCOhztkF07SJOHrlrMnTVo3nFKaCdmgSRxs56kXU3a79lZ3NTz/JLORFXkG4yGwSVNFt7Y6nvzM2dubo7NTUxLVrEzH5Zgo+2PyGswJqarwUq0gV92ivf/wSbbFIGRayZVSP1WqM47pHbKH5TC3MCRW5TmBpt498e/TZN85RRHn6s4mF2flAVJ5Mavb6/K6K2pZvPuZ45ZK364jTfXzE2j5EQn95LsyvbJXWQ+VofDIci4vC00d9lMdlOuZ2DHndI242EgqjPJheiCdLE1vVqYSswC99wznVZ33hvOfKxQ5Ts6HJ3X0oD8xaHlQVoVCrJCq5OLMTSm5sJO4FObY6tVqcCnJrWfkrvaPpaXBxzP3sOd9zT3fYXSa9kab0lFhFVRPlAepAahUWJUEV5UE2XZ5azE6vl+YivCDDr/2WOdzfcmqkdWTINXDC4XXpzTqiWq7F42wwyKxuFO5sMneDxc0Ej/0/y38FGACBHjS0mkQ17AAAAABJRU5ErkJggg==";
    var Piano = (function () {
        function Piano(_doc) {
            var _this = this;
            this._doc = _doc;
            this._canvas = beepbox.html.canvas({ width: "32", height: "481" });
            this._preview = beepbox.html.canvas({ width: "32", height: "40" });
            this.container = beepbox.html.div({ style: "width: 32px; height: 481px; overflow:hidden; position: relative;" }, [
                this._canvas,
                this._preview,
            ]);
            this._graphics = this._canvas.getContext("2d");
            this._previewGraphics = this._preview.getContext("2d");
            this._editorWidth = 32;
            this._editorHeight = 481;
            this._mouseX = 0;
            this._mouseY = 0;
            this._mouseDown = false;
            this._mouseOver = false;
            this._renderedScale = -1;
            this._renderedDrums = false;
            this._renderedKey = -1;
            this._whenMouseOver = function (event) {
                if (_this._mouseOver)
                    return;
                _this._mouseOver = true;
                _this._updatePreview();
            };
            this._whenMouseOut = function (event) {
                if (!_this._mouseOver)
                    return;
                _this._mouseOver = false;
                _this._updatePreview();
            };
            this._whenMousePressed = function (event) {
                event.preventDefault();
                _this._mouseDown = true;
                var boundingRect = _this._canvas.getBoundingClientRect();
                _this._mouseX = (event.clientX || event.pageX) - boundingRect.left;
                _this._mouseY = (event.clientY || event.pageY) - boundingRect.top;
                _this._doc.synth.pianoPressed = true;
                _this._updatePreview();
            };
            this._whenMouseMoved = function (event) {
                var boundingRect = _this._canvas.getBoundingClientRect();
                _this._mouseX = (event.clientX || event.pageX) - boundingRect.left;
                _this._mouseY = (event.clientY || event.pageY) - boundingRect.top;
                _this._updateCursorPitch();
                _this._doc.synth.pianoPitch = _this._cursorPitch + _this._doc.song.channelOctaves[_this._doc.channel] * 12;
                _this._updatePreview();
            };
            this._whenMouseReleased = function (event) {
                _this._mouseDown = false;
                _this._doc.synth.pianoPressed = false;
                _this._updatePreview();
            };
            this._documentChanged = function () {
                var isDrum = _this._doc.song.getChannelIsDrum(_this._doc.channel);
                _this._pitchHeight = isDrum ? 40 : 13;
                _this._pitchCount = isDrum ? beepbox.Config.drumCount : beepbox.Config.pitchCount;
                _this._updateCursorPitch();
                _this._doc.synth.pianoPitch = _this._cursorPitch + _this._doc.song.channelOctaves[_this._doc.channel] * 12;
                _this._doc.synth.pianoChannel = _this._doc.channel;
                _this._render();
            };
            this._render = function () {
                if (!finishedLoadingImages) {
                    window.requestAnimationFrame(_this._render);
                    return;
                }
                if (!_this._doc.showLetters)
                    return;
                var isDrum = _this._doc.song.getChannelIsDrum(_this._doc.channel);
                if (_this._renderedScale == _this._doc.song.scale && _this._renderedKey == _this._doc.song.key && _this._renderedDrums == isDrum)
                    return;
                _this._renderedScale = _this._doc.song.scale;
                _this._renderedKey = _this._doc.song.key;
                _this._renderedDrums = isDrum;
                _this._graphics.clearRect(0, 0, _this._editorWidth, _this._editorHeight);
                var key;
                for (var j = 0; j < _this._pitchCount; j++) {
                    var pitchNameIndex = (j + beepbox.Config.keyTransposes[_this._doc.song.key]) % 12;
                    if (isDrum) {
                        key = Drum;
                        var scale = 1.0 - (j / _this._pitchCount) * 0.35;
                        var offset = (1.0 - scale) * 0.5;
                        var x = key.width * offset;
                        var y = key.height * offset + _this._pitchHeight * (_this._pitchCount - j - 1);
                        var w = key.width * scale;
                        var h = key.height * scale;
                        _this._graphics.drawImage(key, x, y, w, h);
                        var brightness = 1.0 + ((j - _this._pitchCount / 2.0) / _this._pitchCount) * 0.5;
                        var imageData = _this._graphics.getImageData(x, y, w, h);
                        var data = imageData.data;
                        for (var i = 0; i < data.length; i += 4) {
                            data[i + 0] *= brightness;
                            data[i + 1] *= brightness;
                            data[i + 2] *= brightness;
                        }
                        _this._graphics.putImageData(imageData, x, y);
                    }
                    else if (!beepbox.Config.scaleFlags[_this._doc.song.scale][j % 12]) {
                        key = beepbox.Config.pianoScaleFlags[pitchNameIndex] ? WhiteKeyDisabled : BlackKeyDisabled;
                        _this._graphics.drawImage(key, 0, _this._pitchHeight * (_this._pitchCount - j - 1));
                    }
                    else {
                        var text = beepbox.Config.pitchNames[pitchNameIndex];
                        if (text == null) {
                            var shiftDir = beepbox.Config.blackKeyNameParents[j % 12];
                            text = beepbox.Config.pitchNames[(pitchNameIndex + 12 + shiftDir) % 12];
                            if (shiftDir == 1) {
                                text += "â™­";
                            }
                            else if (shiftDir == -1) {
                                text += "â™¯";
                            }
                        }
                        var textColor = beepbox.Config.pianoScaleFlags[pitchNameIndex] ? "#000000" : buttonColorPallet[_this._doc.song.theme];
                        key = beepbox.Config.pianoScaleFlags[pitchNameIndex] ? WhiteKey : BlackKey;
                        _this._graphics.drawImage(key, 0, _this._pitchHeight * (_this._pitchCount - j - 1));
                        _this._graphics.font = "bold 11px sans-serif";
                        _this._graphics.fillStyle = textColor;
                        _this._graphics.fillText(text, 15, _this._pitchHeight * (_this._pitchCount - j) - 3);
                    }
                }
                _this._updatePreview();
            };
            this._doc.notifier.watch(this._documentChanged);
            this._documentChanged();
            this.container.addEventListener("mousedown", this._whenMousePressed);
            document.addEventListener("mousemove", this._whenMouseMoved);
            document.addEventListener("mouseup", this._whenMouseReleased);
            this.container.addEventListener("mouseover", this._whenMouseOver);
            this.container.addEventListener("mouseout", this._whenMouseOut);
        }
        Piano.prototype._updateCursorPitch = function () {
            var scale = beepbox.Config.scaleFlags[this._doc.song.scale];
            var mousePitch = Math.max(0, Math.min(this._pitchCount - 1, this._pitchCount - (this._mouseY / this._pitchHeight)));
            if (scale[Math.floor(mousePitch) % 12] || this._doc.song.getChannelIsDrum(this._doc.channel)) {
                this._cursorPitch = Math.floor(mousePitch);
            }
            else {
                var topPitch = Math.floor(mousePitch) + 1;
                var bottomPitch = Math.floor(mousePitch) - 1;
                while (!scale[topPitch % 12]) {
                    topPitch++;
                }
                while (!scale[(bottomPitch) % 12]) {
                    bottomPitch--;
                }
                var topRange = topPitch;
                var bottomRange = bottomPitch + 1;
                if (topPitch % 12 == 0 || topPitch % 12 == 7) {
                    topRange -= 0.5;
                }
                if (bottomPitch % 12 == 0 || bottomPitch % 12 == 7) {
                    bottomRange += 0.5;
                }
                this._cursorPitch = mousePitch - bottomRange > topRange - mousePitch ? topPitch : bottomPitch;
            }
        };
        Piano.prototype._updatePreview = function () {
            this._preview.style.visibility = (!this._mouseOver || this._mouseDown) ? "hidden" : "visible";
            if (!this._mouseOver || this._mouseDown)
                return;
            this._previewGraphics.clearRect(0, 0, 32, 40);
            this._preview.style.left = "0px";
            this._preview.style.top = this._pitchHeight * (this._pitchCount - this._cursorPitch - 1) + "px";
            this._previewGraphics.lineWidth = 2;
            this._previewGraphics.strokeStyle = "#ffffff";
            this._previewGraphics.strokeRect(1, 1, this._editorWidth - 2, this._pitchHeight - 2);
        };
        return Piano;
    }());
    beepbox.Piano = Piano;
})(beepbox || (beepbox = {}));
var beepbox;
(function (beepbox) {
    var button = beepbox.html.button, div = beepbox.html.div, span = beepbox.html.span, input = beepbox.html.input, br = beepbox.html.br, text = beepbox.html.text;
    var SongDurationPrompt = (function () {
        function SongDurationPrompt(_doc, _songEditor) {
            var _this = this;
            this._doc = _doc;
            this._songEditor = _songEditor;
            this._beatsStepper = input({ style: "width: 3em; margin-left: 1em;", type: "number", step: "1" });
            this._barsStepper = input({ style: "width: 3em; margin-left: 1em;", type: "number", step: "1" });
            this._patternsStepper = input({ style: "width: 3em; margin-left: 1em;", type: "number", step: "1" });
            this._instrumentsStepper = input({ style: "width: 3em; margin-left: 1em;", type: "number", step: "1" });
            this._pitchChannelStepper = input({ style: "width: 3em; margin-left: 1em;", type: "number", step: "1" });
            this._drumChannelStepper = input({ style: "width: 3em; margin-left: 1em;", type: "number", step: "1" });
            this._okayButton = button({ style: "width:45%;" }, [text("Okay")]);
            this._cancelButton = button({ style: "width:45%;" }, [text("Cancel")]);
			this.container = div({ className: "prompt", style: "width: 250px;" }, [
                div({ style: "font-size: 2em" }, [text("Custom Song Size")]),
                div({ style: "display: flex; flex-direction: row; align-items: center; height: 2em; justify-content: flex-end;" }, [
                    div({ style: "text-align: right;" }, [
                        text("Beats per bar:"),
                        br(),
                        span({ style: "font-size: smaller; color: #888888;" }, [text("(Multiples of 3 or 4 are recommended)")]),
                    ]),
                    this._beatsStepper,
                ]),
                div({ style: "display: flex; flex-direction: row; align-items: center; height: 2em; justify-content: flex-end;" }, [
                    div({ style: "display: inline-block; text-align: right;" }, [
                        text("Bars per song:"),
                        br(),
                        span({ style: "font-size: smaller; color: #888888;" }, [text("(Multiples of 2 or 4 are recommended)")]),
                    ]),
                    this._barsStepper,
                ]),
                div({ style: "display: flex; flex-direction: row; align-items: center; height: 2em; justify-content: flex-end;" }, [
                    text("Patterns per channel:"),
                    this._patternsStepper,
                ]),
                div({ style: "display: flex; flex-direction: row; align-items: center; height: 2em; justify-content: flex-end;" }, [
                    text("Instruments per channel:"),
                    this._instrumentsStepper,
                ]),
                div({ style: "display: flex; flex-direction: row; align-items: center; height: 2em; justify-content: flex-end;" }, [
                    text("Number of pitch channels:"),
                    this._pitchChannelStepper,
                ]),
                div({ style: "display: flex; flex-direction: row; align-items: center; height: 2em; justify-content: flex-end;" }, [
                    text("Number of drum channels:"),
                    this._drumChannelStepper,
                ]),
                div({ style: "display: flex; flex-direction: row; justify-content: space-between;" }, [
                    this._okayButton,
                    this._cancelButton,
                ]),
            ]);
            this._close = function () {
                _this._doc.undo();
            };
            this.cleanUp = function () {
                _this._okayButton.removeEventListener("click", _this._saveChanges);
                _this._cancelButton.removeEventListener("click", _this._close);
                _this._beatsStepper.removeEventListener("keypress", SongDurationPrompt._validateKey);
                _this._barsStepper.removeEventListener("keypress", SongDurationPrompt._validateKey);
                _this._patternsStepper.removeEventListener("keypress", SongDurationPrompt._validateKey);
                _this._instrumentsStepper.removeEventListener("keypress", SongDurationPrompt._validateKey);
                _this._pitchChannelStepper.removeEventListener("keypress", SongDurationPrompt._validateKey);
                _this._drumChannelStepper.removeEventListener("keypress", SongDurationPrompt._validateKey);
                _this._beatsStepper.removeEventListener("blur", SongDurationPrompt._validateNumber);
                _this._barsStepper.removeEventListener("blur", SongDurationPrompt._validateNumber);
                _this._patternsStepper.removeEventListener("blur", SongDurationPrompt._validateNumber);
                _this._instrumentsStepper.removeEventListener("blur", SongDurationPrompt._validateNumber);
                _this._pitchChannelStepper.removeEventListener("blur", SongDurationPrompt._validateNumber);
                _this._drumChannelStepper.removeEventListener("blur", SongDurationPrompt._validateNumber);
            };
            this._saveChanges = function () {
                var group = new beepbox.ChangeGroup();
                group.append(new beepbox.ChangeBeatsPerBar(_this._doc, SongDurationPrompt._validate(_this._beatsStepper)));
                group.append(new beepbox.ChangeBarCount(_this._doc, SongDurationPrompt._validate(_this._barsStepper)));
                group.append(new beepbox.ChangePatternsPerChannel(_this._doc, SongDurationPrompt._validate(_this._patternsStepper)));
                group.append(new beepbox.ChangeInstrumentsPerChannel(_this._doc, SongDurationPrompt._validate(_this._instrumentsStepper)));
                group.append(new beepbox.ChangeChannelCount(_this._doc, SongDurationPrompt._validate(_this._pitchChannelStepper), SongDurationPrompt._validate(_this._drumChannelStepper)));
                _this._doc.prompt = null;
                _this._doc.history.record(group, true);
            };
            this._beatsStepper.value = this._doc.song.beatsPerBar + "";
            this._beatsStepper.min = beepbox.Config.beatsPerBarMin + "";
            this._beatsStepper.max = beepbox.Config.beatsPerBarMax + "";
            this._barsStepper.value = this._doc.song.barCount + "";
            this._barsStepper.min = beepbox.Config.barCountMin + "";
            this._barsStepper.max = beepbox.Config.barCountMax + "";
            this._patternsStepper.value = this._doc.song.patternsPerChannel + "";
            this._patternsStepper.min = beepbox.Config.patternsPerChannelMin + "";
            this._patternsStepper.max = beepbox.Config.patternsPerChannelMax + "";
            this._instrumentsStepper.value = this._doc.song.instrumentsPerChannel + "";
            this._instrumentsStepper.min = beepbox.Config.instrumentsPerChannelMin + "";
            this._instrumentsStepper.max = beepbox.Config.instrumentsPerChannelMax + "";
            this._pitchChannelStepper.value = this._doc.song.pitchChannelCount + "";
            this._pitchChannelStepper.min = beepbox.Config.pitchChannelCountMin + "";
            this._pitchChannelStepper.max = beepbox.Config.pitchChannelCountMax + "";
            this._drumChannelStepper.value = this._doc.song.drumChannelCount + "";
            this._drumChannelStepper.min = beepbox.Config.drumChannelCountMin + "";
            this._drumChannelStepper.max = beepbox.Config.drumChannelCountMax + "";
            this._okayButton.addEventListener("click", this._saveChanges);
            this._cancelButton.addEventListener("click", this._close);
            this._beatsStepper.addEventListener("keypress", SongDurationPrompt._validateKey);
            this._barsStepper.addEventListener("keypress", SongDurationPrompt._validateKey);
            this._patternsStepper.addEventListener("keypress", SongDurationPrompt._validateKey);
            this._instrumentsStepper.addEventListener("keypress", SongDurationPrompt._validateKey);
            this._pitchChannelStepper.addEventListener("keypress", SongDurationPrompt._validateKey);
            this._drumChannelStepper.addEventListener("keypress", SongDurationPrompt._validateKey);
            this._beatsStepper.addEventListener("blur", SongDurationPrompt._validateNumber);
            this._barsStepper.addEventListener("blur", SongDurationPrompt._validateNumber);
            this._patternsStepper.addEventListener("blur", SongDurationPrompt._validateNumber);
            this._instrumentsStepper.addEventListener("blur", SongDurationPrompt._validateNumber);
            this._pitchChannelStepper.addEventListener("blur", SongDurationPrompt._validateNumber);
            this._drumChannelStepper.addEventListener("blur", SongDurationPrompt._validateNumber);
        }
        SongDurationPrompt._validateKey = function (event) {
            var charCode = (event.which) ? event.which : event.keyCode;
            if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)) {
                event.preventDefault();
                return true;
            }
            return false;
        };
        SongDurationPrompt._validateNumber = function (event) {
            var input = event.target;
            input.value = Math.floor(Math.max(Number(input.min), Math.min(Number(input.max), Number(input.value)))) + "";
        };
        SongDurationPrompt._validate = function (input) {
            return Math.floor(Number(input.value));
        };
        return SongDurationPrompt;
    }());
    beepbox.SongDurationPrompt = SongDurationPrompt;
})(beepbox || (beepbox = {}));
var beepbox;
(function (beepbox) {
    var button = beepbox.html.button, div = beepbox.html.div, input = beepbox.html.input, text = beepbox.html.text;
    function lerp(low, high, t) {
        return low + t * (high - low);
    }
    function save(blob, name) {
        if (navigator.msSaveOrOpenBlob) {
            navigator.msSaveOrOpenBlob(blob, name);
            return;
        }
        var anchor = document.createElement("a");
        if (anchor.download != undefined) {
            var url_1 = URL.createObjectURL(blob);
            setTimeout(function () { URL.revokeObjectURL(url_1); }, 60000);
            anchor.href = url_1;
            anchor.download = name;
            anchor.dispatchEvent(new MouseEvent("click"));
        }
        else if (navigator.vendor.indexOf("Apple") > -1) {
            var reader = new FileReader();
            reader.onloadend = function () {
                console.log(reader.result);
                var url = reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
                if (!window.open(url, "_blank"))
                    window.location.href = url;
            };
            reader.readAsDataURL(blob);
        }
        else {
            var url_2 = URL.createObjectURL(blob);
            setTimeout(function () { URL.revokeObjectURL(url_2); }, 60000);
            if (!window.open(url_2, "_blank"))
                window.location.href = url_2;
        }
    }
    if (!ArrayBuffer.transfer) {
        ArrayBuffer.transfer = function (source, length) {
            var dest = new ArrayBuffer(length);
            if (!(source instanceof ArrayBuffer) || !(dest instanceof ArrayBuffer)) {
                throw new TypeError('Source and destination must be ArrayBuffer instances');
            }
            var nextOffset = 0;
            var leftBytes = Math.min(source.byteLength, dest.byteLength);
            var wordSizes = [8, 4, 2, 1];
            for (var _i = 0, wordSizes_1 = wordSizes; _i < wordSizes_1.length; _i++) {
                var wordSize = wordSizes_1[_i];
                if (leftBytes >= wordSize) {
                    var done = transferWith(wordSize, source, dest, nextOffset, leftBytes);
                    nextOffset = done.nextOffset;
                    leftBytes = done.leftBytes;
                }
            }
            return dest;
            function transferWith(wordSize, source, dest, nextOffset, leftBytes) {
                var ViewClass = Uint8Array;
                switch (wordSize) {
                    case 8:
                        ViewClass = Float64Array;
                        break;
                    case 4:
                        ViewClass = Float32Array;
                        break;
                    case 2:
                        ViewClass = Uint16Array;
                        break;
                    case 1:
                        ViewClass = Uint8Array;
                        break;
                    default:
                        ViewClass = Uint8Array;
                        break;
                }
                var view_source = new ViewClass(source, nextOffset, (leftBytes / wordSize) | 0);
                var view_dest = new ViewClass(dest, nextOffset, (leftBytes / wordSize) | 0);
                for (var i = 0; i < view_dest.length; i++) {
                    view_dest[i] = view_source[i];
                }
                return {
                    nextOffset: view_source.byteOffset + view_source.byteLength,
                    leftBytes: leftBytes - view_dest.length * wordSize,
                };
            }
        };
    }
    var ExportPrompt = (function () {
        function ExportPrompt(_doc, _songEditor) {
            var _this = this;
            this._doc = _doc;
            this._songEditor = _songEditor;
            this._fileName = input({ type: "text", style: "width: 10em;", value: "BeepBox-Song", maxlength: 250 });
            this._enableIntro = input({ type: "checkbox" });
            this._loopDropDown = input({ style: "width: 2em;", type: "number", min: "1", max: "4", step: "1" });
            this._enableOutro = input({ type: "checkbox" });
            this._exportWavButton = button({}, [text("Export to .wav file")]);
            this._exportMidiButton = button({}, [text("Export to .midi file")]);
            this._exportJsonButton = button({}, [text("Export to .json file")]);
            this._cancelButton = button({}, [text("Cancel")]);
            this.container = div({ className: "prompt", style: "width: 200px;" }, [
                div({ style: "font-size: 2em" }, [text("Export Options")]),
                div({ style: "display: flex; flex-direction: row; align-items: center; justify-content: space-between;" }, [
                    text("File name:"),
                    this._fileName,
                ]),
                div({ style: "display: table; width: 100%;" }, [
                    div({ style: "display: table-row;" }, [
                        div({ style: "display: table-cell;" }, [text("Intro:")]),
                        div({ style: "display: table-cell;" }, [text("Loop Count:")]),
                        div({ style: "display: table-cell;" }, [text("Outro:")]),
                    ]),
                    div({ style: "display: table-row;" }, [
                        div({ style: "display: table-cell; vertical-align: middle;" }, [this._enableIntro]),
                        div({ style: "display: table-cell; vertical-align: middle;" }, [this._loopDropDown]),
                        div({ style: "display: table-cell; vertical-align: middle;" }, [this._enableOutro]),
                    ]),
                ]),
                this._exportWavButton,
                this._exportMidiButton,
                this._exportJsonButton,
                this._cancelButton,
            ]);
            this._close = function () {
                _this._doc.undo();
            };
            this.cleanUp = function () {
                _this._fileName.removeEventListener("input", ExportPrompt._validateFileName);
                _this._loopDropDown.removeEventListener("blur", ExportPrompt._validateNumber);
                _this._exportWavButton.removeEventListener("click", _this._whenExportToWav);
                _this._exportMidiButton.removeEventListener("click", _this._whenExportToMidi);
                _this._exportJsonButton.removeEventListener("click", _this._whenExportToJson);
                _this._cancelButton.removeEventListener("click", _this._close);
            };
            this._whenExportToWav = function () {
                var synth = new beepbox.Synth(_this._doc.song);
                synth.enableIntro = _this._enableIntro.checked;
                synth.enableOutro = _this._enableOutro.checked;
                synth.loopCount = Number(_this._loopDropDown.value);
                if (!synth.enableIntro) {
                    for (var introIter = 0; introIter < _this._doc.song.loopStart; introIter++) {
                        synth.nextBar();
                    }
                }
                var sampleFrames = synth.totalSamples;
                var recordedSamples = new Float32Array(sampleFrames);
                synth.synthesize(recordedSamples, sampleFrames);
                var srcChannelCount = 1;
                var wavChannelCount = 1;
                var sampleRate = 44100;
                var bytesPerSample = 2;
                var bitsPerSample = 8 * bytesPerSample;
                var sampleCount = wavChannelCount * sampleFrames;
                var totalFileSize = 44 + sampleCount * bytesPerSample;
                var index = 0;
                var arrayBuffer = new ArrayBuffer(totalFileSize);
                var data = new DataView(arrayBuffer);
                data.setUint32(index, 0x52494646, false);
                index += 4;
                data.setUint32(index, 36 + sampleCount * bytesPerSample, true);
                index += 4;
                data.setUint32(index, 0x57415645, false);
                index += 4;
                data.setUint32(index, 0x666D7420, false);
                index += 4;
                data.setUint32(index, 0x00000010, true);
                index += 4;
                data.setUint16(index, 0x0001, true);
                index += 2;
                data.setUint16(index, wavChannelCount, true);
                index += 2;
                data.setUint32(index, sampleRate, true);
                index += 4;
                data.setUint32(index, sampleRate * bytesPerSample * wavChannelCount, true);
                index += 4;
                data.setUint16(index, bytesPerSample, true);
                index += 2;
                data.setUint16(index, bitsPerSample, true);
                index += 2;
                data.setUint32(index, 0x64617461, false);
                index += 4;
                data.setUint32(index, sampleCount * bytesPerSample, true);
                index += 4;
                var stride;
                var repeat;
                if (srcChannelCount == wavChannelCount) {
                    stride = 1;
                    repeat = 1;
                }
                else {
                    stride = srcChannelCount;
                    repeat = wavChannelCount;
                }
                var val;
                if (bytesPerSample > 1) {
                    for (var i = 0; i < sampleFrames; i++) {
                        val = Math.floor(recordedSamples[i * stride] * ((1 << (bitsPerSample - 1)) - 1));
                        for (var k = 0; k < repeat; k++) {
                            if (bytesPerSample == 2) {
                                data.setInt16(index, val, true);
                                index += 2;
                            }
                            else if (bytesPerSample == 4) {
                                data.setInt32(index, val, true);
                                index += 4;
                            }
                            else {
                                throw new Error("unsupported sample size");
                            }
                        }
                    }
                }
                else {
                    for (var i = 0; i < sampleFrames; i++) {
                        val = Math.floor(recordedSamples[i * stride] * 127 + 128);
                        for (var k = 0; k < repeat; k++) {
                            data.setUint8(index, val > 255 ? 255 : (val < 0 ? 0 : val));
                            index++;
                        }
                    }
                }
                var blob = new Blob([arrayBuffer], { type: "audio/wav" });
                save(blob, _this._fileName.value.trim() + ".wav");
                ;
            };
            this._whenExportToMidi = function () {
                var writeIndex = 0;
                var fileSize = 0;
                var arrayBuffer = new ArrayBuffer(1024);
                var data = new DataView(arrayBuffer);
                function addBytes(numBytes) {
                    fileSize += numBytes;
                    if (fileSize > arrayBuffer.byteLength) {
                        arrayBuffer = ArrayBuffer.transfer(arrayBuffer, Math.max(arrayBuffer.byteLength * 2, fileSize));
                        data = new DataView(arrayBuffer);
                    }
                }
                function writeUint32(value) {
                    value = value >>> 0;
                    addBytes(4);
                    data.setUint32(writeIndex, value, false);
                    writeIndex = fileSize;
                }
                function writeUint24(value) {
                    value = value >>> 0;
                    addBytes(3);
                    data.setUint8(writeIndex, (value >> 16) & 0xff);
                    data.setUint8(writeIndex + 1, (value >> 8) & 0xff);
                    data.setUint8(writeIndex + 2, (value) & 0xff);
                    writeIndex = fileSize;
                }
                function writeUint16(value) {
                    value = value >>> 0;
                    addBytes(2);
                    data.setUint16(writeIndex, value, false);
                    writeIndex = fileSize;
                }
                function writeUint8(value) {
                    value = value >>> 0;
                    addBytes(1);
                    data.setUint8(writeIndex, value);
                    writeIndex = fileSize;
                }
                function writeFlagAnd7Bits(flag, value) {
                    value = ((value >>> 0) & 0x7f) | ((flag & 0x01) << 7);
                    addBytes(1);
                    data.setUint8(writeIndex, value);
                    writeIndex = fileSize;
                }
                function writeVariableLength(value) {
                    value = value >>> 0;
                    if (value > 0x0fffffff)
                        throw new Error("writeVariableLength value too big.");
                    var startWriting = false;
                    for (var i = 0; i < 4; i++) {
                        var shift = 21 - i * 7;
                        var bits = (value >>> shift) & 0x7f;
                        if (bits != 0 || i == 3)
                            startWriting = true;
                        if (startWriting)
                            writeFlagAnd7Bits(i == 3 ? 0 : 1, bits);
                    }
                }
                function writeAscii(string) {
                    writeVariableLength(string.length);
                    for (var i = 0; i < string.length; i++) {
                        var charCode = string.charCodeAt(i);
                        if (charCode > 0x7f)
                            throw new Error("Trying to write unicode character as ascii.");
                        writeUint8(charCode);
                    }
                }
                var song = _this._doc.song;
                var ticksPerBeat = 96;
                var ticksPerPart = ticksPerBeat / song.partsPerBeat;
                var ticksPerArpeggio = ticksPerPart / 4;
                var secondsPerMinute = 60;
                var microsecondsPerMinute = secondsPerMinute * 1000000;
                var beatsPerMinute = song.getBeatsPerMinute();
                var microsecondsPerBeat = Math.round(microsecondsPerMinute / beatsPerMinute);
                var secondsPerTick = secondsPerMinute / (ticksPerBeat * beatsPerMinute);
                var ticksPerBar = ticksPerBeat * song.beatsPerBar;
                var unrolledBars = [];
                if (_this._enableIntro.checked) {
                    for (var bar = 0; bar < song.loopStart; bar++) {
                        unrolledBars.push(bar);
                    }
                }
                for (var loopIndex = 0; loopIndex < Number(_this._loopDropDown.value); loopIndex++) {
                    for (var bar = song.loopStart; bar < song.loopStart + song.loopLength; bar++) {
                        unrolledBars.push(bar);
                    }
                }
                if (_this._enableOutro.checked) {
                    for (var bar = song.loopStart + song.loopLength; bar < song.barCount; bar++) {
                        unrolledBars.push(bar);
                    }
                }
                var tracks = [{ isMeta: true, channel: -1, midiChannel: -1, isChorus: false, isDrums: false }];
                var midiChannelCounter = 0;
                for (var channel = 0; channel < _this._doc.song.getChannelCount(); channel++) {
                    if (_this._doc.song.getChannelIsDrum(channel)) {
                        tracks.push({ isMeta: false, channel: channel, midiChannel: midiChannelCounter++, isChorus: false, isDrums: true });
                        if (midiChannelCounter == 9)
                            midiChannelCounter++;
                    }
                    else {
                        tracks.push({ isMeta: false, channel: channel, midiChannel: midiChannelCounter++, isChorus: false, isDrums: false });
                        if (midiChannelCounter == 9)
                            midiChannelCounter++;
                        tracks.push({ isMeta: false, channel: channel, midiChannel: midiChannelCounter++, isChorus: true, isDrums: false });
                        if (midiChannelCounter == 9)
                            midiChannelCounter++;
                    }
                }
                writeUint32(0x4D546864);
                writeUint32(6);
                writeUint16(1);
                writeUint16(tracks.length);
                writeUint16(ticksPerBeat);
                var _loop_1 = function (track) {
                    writeUint32(0x4D54726B);
                    var isMeta = track.isMeta, channel = track.channel, midiChannel = track.midiChannel, isChorus = track.isChorus, isDrums = track.isDrums;
                    var trackLengthIndex = writeIndex;
                    fileSize += 4;
                    writeIndex = fileSize;
                    var prevTime = 0;
                    var barStartTime = 0;
                    var writeEventTime = function (time) {
                        if (time < prevTime)
                            throw new Error("Midi event time cannot go backwards.");
                        writeVariableLength(time - prevTime);
                        prevTime = time;
                    };
                    if (isMeta) {
                        writeEventTime(0);
                        writeUint16(0xFF01);
                        writeAscii("http://www.beepbox.co/#" + song.toBase64String());
                        writeEventTime(0);
                        writeUint24(0xFF5103);
                        writeUint24(microsecondsPerBeat);
                        writeEventTime(0);
                        writeUint24(0xFF5804);
                        writeUint8(song.beatsPerBar);
                        writeUint8(2);
                        writeUint8(24);
                        writeUint8(8);
                        var isMinor = (song.scale < 10) && ((song.scale & 1) == 1);
                        var key = 11 - song.key;
                        var numSharps = key;
                        if ((key & 1) == 1)
                            numSharps += 6;
                        if (isMinor)
                            numSharps += 9;
                        while (numSharps > 6)
                            numSharps -= 12;
                        writeEventTime(0);
                        writeUint24(0xFF5902);
                        writeUint8(numSharps);
                        writeUint8(isMinor ? 1 : 0);
                        if (_this._enableIntro.checked)
                            barStartTime += ticksPerBar * song.loopStart;
                        writeEventTime(barStartTime);
                        writeUint16(0xFF06);
                        writeAscii("Loop Start");
                        for (var loopIndex = 0; loopIndex < Number(_this._loopDropDown.value); loopIndex++) {
                            barStartTime += ticksPerBar * song.loopLength;
                            writeEventTime(barStartTime);
                            writeUint16(0xFF06);
                            writeAscii(loopIndex < Number(_this._loopDropDown.value) - 1 ? "Loop Repeat" : "Loop End");
                        }
                        if (_this._enableOutro.checked)
                            barStartTime += ticksPerBar * (song.barCount - song.loopStart - song.loopLength);
                        if (barStartTime != ticksPerBar * unrolledBars.length)
                            throw new Error("Miscalculated number of bars.");
                    }
                    else {
                        var pitchChannelNames = ["cyan channel", "yellow channel", "orange channel", "green channel", "purple channel", "blue channel"];
                        var drumChannelNames = ["gray channel", "brown channel"];
                        var channelName = song.getChannelIsDrum(channel) ? drumChannelNames[channel - song.pitchChannelCount] : pitchChannelNames[channel];
                        if (isChorus)
                            channelName += " chorus";
                        writeEventTime(0);
                        writeUint16(0xFF03);
                        writeAscii(channelName);
                        writeEventTime(barStartTime);
                        writeUint8(0xB0 | midiChannel);
                        writeFlagAnd7Bits(0, 0x7E);
                        writeFlagAnd7Bits(0, 1);
                        writeEventTime(barStartTime);
                        writeUint8(0xB0 | midiChannel);
                        writeFlagAnd7Bits(0, 0x44);
                        writeFlagAnd7Bits(0, 0x7f);
                        var prevInstrument = -1;
                        var prevPitchBend = -1;
                        var prevExpression = -1;
                        var channelRoot = isDrums ? 33 : beepbox.Config.keyTransposes[song.key];
                        var intervalScale = isDrums ? beepbox.Config.drumInterval : 1;
                        for (var _i = 0, unrolledBars_1 = unrolledBars; _i < unrolledBars_1.length; _i++) {
                            var bar = unrolledBars_1[_i];
                            var pattern = song.getPattern(channel, bar);
                            if (pattern != null) {
                                var nextInstrument = pattern.instrument;
                                if (isChorus && song.instrumentChorus[channel][nextInstrument] == 0) {
                                    barStartTime += ticksPerBar;
                                    continue;
                                }
                                if (prevInstrument != nextInstrument) {
                                    prevInstrument = nextInstrument;
                                    writeEventTime(barStartTime);
                                    writeUint16(0xFF04);
                                    if (isDrums) {
                                        var description = "noise: " + beepbox.Config.drumNames[song.instrumentWaves[channel][nextInstrument]];
                                        description += ", volume: " + beepbox.Config.volumeNames[song.instrumentVolumes[channel][nextInstrument]];                                          description += ", envelope: " + beepbox.Config.envelopeNames[song.instrumentEnvelopes[channel][nextInstrument]];
                                          description += ", filter: " + beepbox.Config.filterNames[song.instrumentFilters[channel][nextInstrument]];
                                          description += ", harm: " + beepbox.Config.harmNames[song.instrumentHarm[channel][nextInstrument]];
                                        writeAscii(description);

                                        writeEventTime(barStartTime);
                                        writeUint8(0xC0 | midiChannel);
                                        writeFlagAnd7Bits(0, 0x7E);
                                    }
                                    else {
                                        var description = "wave: " + beepbox.Config.waveNames[song.instrumentWaves[channel][nextInstrument]];
                                        description += ", volume: " + beepbox.Config.volumeNames[song.instrumentVolumes[channel][nextInstrument]];
                                        description += ", envelope: " + beepbox.Config.envelopeNames[song.instrumentEnvelopes[channel][nextInstrument]];
                                        description += ", chorus: " + beepbox.Config.chorusNames[song.instrumentChorus[channel][nextInstrument]];
										description += ", offOne: " + beepbox.Config.offOneNames[song.instrumentOffOne[channel][nextInstrument]];
                                        description += ", effect: " + beepbox.Config.effectNames[song.instrumentEffects[channel][nextInstrument]];
                                        writeAscii(description);
                                        var sustainInstruments = [
                                            0x47,
                                            0x50,
                                            0x46,
                                            0x44,
                                            0x51,
                                            0x51,
                                            0x51,
                                            0x51,
                                            0x4A,
                                        ];
                                        var decayInstruments = [
                                            0x2E,
                                            0x2E,
                                            0x06,
                                            0x18,
                                            0x19,
                                            0x19,
                                            0x6A,
                                            0x6A,
                                            0x21,
                                        ];
                                        var filterInstruments = song.instrumentFilters[channel][nextInstrument] < 3 ? sustainInstruments : decayInstruments;
                                        writeEventTime(barStartTime);
                                        writeUint8(0xC0 | midiChannel);
                                        writeFlagAnd7Bits(0, filterInstruments[song.instrumentWaves[channel][nextInstrument]]);
                                    }
                                    var instrumentVolumeChoice = song.instrumentVolumes[channel][nextInstrument];
                                    var channelVolume = (5 - instrumentVolumeChoice) / 5;
                                    writeEventTime(barStartTime);
                                    writeUint8(0xB0 | midiChannel);
                                    writeFlagAnd7Bits(0, 0x07);
                                    writeFlagAnd7Bits(0, Math.round(0x7f * channelVolume));
                                }
                                var effectChoice = song.instrumentEffects[channel][nextInstrument];
                                var effectVibrato = beepbox.Config.effectVibratos[effectChoice];
                                var effectTremolo = beepbox.Config.effectTremolos[effectChoice];
                                var effectDuration = 0.14;
                                var chorusOffset = beepbox.Config.chorusIntervals[song.instrumentChorus[channel][nextInstrument]];
                                if (!isChorus)
                                    chorusOffset *= -1;
                                chorusOffset += beepbox.Config.chorusOffsets[song.instrumentChorus[channel][nextInstrument]];
                                for (var noteIndex = 0; noteIndex < pattern.notes.length; noteIndex++) {
                                    var note = pattern.notes[noteIndex];
                                    var noteStartTime = barStartTime + note.start * ticksPerPart;
                                    var pinTime = noteStartTime;
                                    var pinVolume = note.pins[0].volume;
                                    var pinInterval = note.pins[0].interval;
                                    var pitch = channelRoot + note.pitches[0] * intervalScale;
                                    for (var pinIndex = 1; pinIndex < note.pins.length; pinIndex++) {
                                        var nextPinTime = noteStartTime + note.pins[pinIndex].time * ticksPerPart;
                                        var nextPinVolume = note.pins[pinIndex].volume;
                                        var nextPinInterval = note.pins[pinIndex].interval;
                                        var length_1 = nextPinTime - pinTime;
                                        for (var tick = 0; tick < length_1; tick++) {
                                            var tickTime = pinTime + tick;
                                            var linearVolume = lerp(pinVolume, nextPinVolume, tick / length_1);
                                            var linearInterval = lerp(pinInterval, nextPinInterval, tick / length_1);
                                            var chorusHarmonizes = beepbox.Config.harmNames[song.instrumentHarm[channel][nextInstrument]];
                                            var arpeggio = Math.floor(tick / ticksPerArpeggio) % 4;
                                            var nextPitch = note.pitches[0];
                                            if (chorusHarmonizes) {
                                                if (isChorus) {
                                                    if (note.pitches.length == 2) {
                                                        nextPitch = note.pitches[1];
                                                    }
                                                    else if (note.pitches.length == 3) {
                                                        nextPitch = note.pitches[(arpeggio >> 1) + 1];
                                                    }
                                                    else if (note.pitches.length == 4) {
                                                        nextPitch = note.pitches[(arpeggio == 3 ? 1 : arpeggio) + 1];
                                                    }
                                                }
                                            }
                                            else {
                                                if (note.pitches.length == 2) {
                                                    nextPitch = note.pitches[arpeggio >> 1];
                                                }
                                                else if (note.pitches.length == 3) {
                                                    nextPitch = note.pitches[arpeggio == 3 ? 1 : arpeggio];
                                                }
                                                else if (note.pitches.length == 4) {
                                                    nextPitch = note.pitches[arpeggio];
                                                }
                                            }
                                            var fractionalPitch = channelRoot + nextPitch * intervalScale + linearInterval + chorusOffset;
                                            nextPitch = Math.round(fractionalPitch);
                                            var pitchOffset = fractionalPitch - nextPitch;
                                            var effectCurve = Math.sin(Math.PI * 2.0 * (tickTime - barStartTime) * secondsPerTick / effectDuration);
                                            if (effectChoice != 2 || tickTime - noteStartTime >= 3 * ticksPerPart) {
                                                pitchOffset += effectVibrato * effectCurve;
                                            }
                                            var pitchBend = Math.max(0, Math.min(0x3fff, Math.round(0x2000 + 0x1000 * pitchOffset)));
                                            var volume = linearVolume / 3;
                                            var tremolo = 1.0 + effectTremolo * (effectCurve - 1.0);
                                            var expression = Math.round(0x7f * volume * tremolo);
                                            if (pitchBend != prevPitchBend) {
                                                writeEventTime(tickTime);
                                                writeUint8(0xE0 | midiChannel);
                                                writeFlagAnd7Bits(0, pitchBend & 0x7f);
                                                writeFlagAnd7Bits(0, (pitchBend >> 7) & 0x7f);
                                                prevPitchBend = pitchBend;
                                            }
                                            if (expression != prevExpression) {
                                                writeEventTime(tickTime);
                                                writeUint8(0xB0 | midiChannel);
                                                writeFlagAnd7Bits(0, 0x0B);
                                                writeFlagAnd7Bits(0, expression);
                                                prevExpression = expression;
                                            }
                                            if (tickTime == noteStartTime) {
                                                writeEventTime(tickTime);
                                                writeUint8(0x90 | midiChannel);
                                                writeFlagAnd7Bits(0, nextPitch);
                                                writeFlagAnd7Bits(0, 0x40);
                                            }
                                            else if (nextPitch != pitch) {
                                                writeEventTime(tickTime);
                                                writeUint8(0x90 | midiChannel);
                                                writeFlagAnd7Bits(0, nextPitch);
                                                writeFlagAnd7Bits(0, 0x40);
                                                writeEventTime(tickTime);
                                                writeUint8(0x80 | midiChannel);
                                                writeFlagAnd7Bits(0, pitch);
                                                writeFlagAnd7Bits(0, 0x40);
                                            }
                                            pitch = nextPitch;
                                        }
                                        pinTime = nextPinTime;
                                        pinVolume = nextPinVolume;
                                        pinInterval = nextPinInterval;
                                    }
                                    writeEventTime(barStartTime + note.end * ticksPerPart);
                                    writeUint8(0x80 | midiChannel);
                                    writeFlagAnd7Bits(0, pitch);
                                    writeFlagAnd7Bits(0, 0x40);
                                }
                            }
                            barStartTime += ticksPerBar;
                        }
                    }
                    writeEventTime(barStartTime);
                    writeUint24(0xFF2F00);
                    data.setUint32(trackLengthIndex, writeIndex - trackLengthIndex - 4, false);
                };
                for (var _i = 0, tracks_1 = tracks; _i < tracks_1.length; _i++) {
                    var track = tracks_1[_i];
                    _loop_1(track);
                }
                arrayBuffer = ArrayBuffer.transfer(arrayBuffer, fileSize);
                var blob = new Blob([arrayBuffer], { type: "audio/midi" });
                save(blob, _this._fileName.value.trim() + ".midi");
                ;
            };
            this._whenExportToJson = function () {
                var jsonObject = _this._doc.song.toJsonObject(_this._enableIntro.checked, Number(_this._loopDropDown.value), _this._enableOutro.checked);
                var jsonString = JSON.stringify(jsonObject, null, '\t');
                var blob = new Blob([jsonString], { type: "application/json" });
                save(blob, _this._fileName.value.trim() + ".json");
                ;
            };
            this._loopDropDown.value = "1";
            if (this._doc.song.loopStart == 0) {
                this._enableIntro.checked = false;
                this._enableIntro.disabled = true;
            }
            else {
                this._enableIntro.checked = true;
                this._enableIntro.disabled = false;
            }
            if (this._doc.song.loopStart + this._doc.song.loopLength == this._doc.song.barCount) {
                this._enableOutro.checked = false;
                this._enableOutro.disabled = true;
            }
            else {
                this._enableOutro.checked = true;
                this._enableOutro.disabled = false;
            }
            this._fileName.addEventListener("input", ExportPrompt._validateFileName);
            this._loopDropDown.addEventListener("blur", ExportPrompt._validateNumber);
            this._exportWavButton.addEventListener("click", this._whenExportToWav);
            this._exportMidiButton.addEventListener("click", this._whenExportToMidi);
            this._exportJsonButton.addEventListener("click", this._whenExportToJson);
            this._cancelButton.addEventListener("click", this._close);
        }
        ExportPrompt._validateFileName = function (event) {
            var input = event.target;
            var deleteChars = /[\+\*\$\?\|\{\}\\\/<>#%!`&'"=:@]/gi;
            if (deleteChars.test(input.value)) {
                var cursorPos = input.selectionStart;
                input.value = input.value.replace(deleteChars, "");
                cursorPos--;
                input.setSelectionRange(cursorPos, cursorPos);
            }
        };
        ExportPrompt._validateNumber = function (event) {
            var input = event.target;
            input.value = Math.floor(Math.max(Number(input.min), Math.min(Number(input.max), Number(input.value)))) + "";
        };
        return ExportPrompt;
    }());
    beepbox.ExportPrompt = ExportPrompt;
})(beepbox || (beepbox = {}));
var beepbox;

(function (beepbox) {
    var button = beepbox.html.button, div = beepbox.html.div, input = beepbox.html.input, text = beepbox.html.text;
    var ImportPrompt = (function () {
        function ImportPrompt(_doc, _songEditor) {
            var _this = this;
            this._doc = _doc;
            this._songEditor = _songEditor;
            this._fileInput = input({ type: "file", accept: ".json,application/json" });
            this._cancelButton = button({}, [text("Cancel")]);
            this.container = div({ className: "prompt", style: "width: 200px;" }, [
                div({ style: "font-size: 2em" }, [text("Import")]),
                div(undefined, [text("BeepBox songs can be exported and re-imported as .json files. You could also use other means to make .json files for BeepBox as long as they follow the same structure.")]),
                this._fileInput,
                this._cancelButton,
            ]);
            this._close = function () {
                _this._doc.undo();
            };
            this.cleanUp = function () {
                _this._fileInput.removeEventListener("change", _this._whenFileSelected);
                _this._cancelButton.removeEventListener("click", _this._close);
            };
            this._whenFileSelected = function () {
                var file = _this._fileInput.files[0];
                if (!file)
                    return;
                var reader = new FileReader();
                reader.addEventListener("load", function (event) {
                    _this._doc.prompt = null;
                    _this._doc.history.record(new beepbox.ChangeSong(_this._doc, reader.result), true);
                });
                reader.readAsText(file);
            };
            this._fileInput.addEventListener("change", this._whenFileSelected);
            this._cancelButton.addEventListener("click", this._close);
        }
        return ImportPrompt;
    }());
    beepbox.ImportPrompt = ImportPrompt;
})(beepbox || (beepbox = {}));
var beepbox;

(function (beepbox) {
    var button = beepbox.html.button, div = beepbox.html.div, input = beepbox.html.input, text = beepbox.html.text;
    var RefreshPrompt = (function () {
        function RefreshPrompt(_doc, _songEditor) {
            var _this = this;
            this._doc = _doc;
            this._songEditor = _songEditor;
            this._refreshButton = button({}, [text("Refresh")]);
            this._cancelButton = button({}, [text("Cancel")]);
            this.container = div({ className: "prompt", style: "width: 200px;" }, [
                div({ style: "font-size: 1em" }, [text("Refresh?")]),
                div(undefined, [text("In order for the theme to change the song must refresh. If you refresh on your own after canceling your theme will still update.")]),
				div(undefined, [text("Would you like to refresh now?")]),
                this._refreshButton,
				this._cancelButton,
            ]);
            this._close = function () {
                _this._doc.undo();
				_this._doc.undo();
            };
            this.cleanUp = function () {
				_this._cancelButton.removeEventListener("click", _this._close);
				_this._refreshButton.removeEventListener("click",refreshNow);
            };
            this._cancelButton.addEventListener("click", this._close);
			this._refreshButton.addEventListener("click", refreshNow);
        }
        return RefreshPrompt;
    }());
    beepbox.RefreshPrompt = RefreshPrompt;
})(beepbox || (beepbox = {}));
var beepbox;


(function (beepbox) {
    var button = beepbox.html.button, div = beepbox.html.div, span = beepbox.html.span, select = beepbox.html.select, option = beepbox.html.option, input = beepbox.html.input, text = beepbox.html.text;
    function buildOptions(menu, items) {
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            menu.appendChild(option(item, item, false, false));
        }
        return menu;
    }
    function setSelectedIndex(menu, index) {
        if (menu.selectedIndex != index)
            menu.selectedIndex = index;
    }
    var SongEditor = (function () {
        function SongEditor(_doc) {
            var _this = this;
            this._doc = _doc;
            this.prompt = null;
            this._width = 887;
            this._height = 645;
            this._patternEditor = new beepbox.PatternEditor(this._doc);
            this._trackEditor = new beepbox.TrackEditor(this._doc, this);
            this._loopEditor = new beepbox.LoopEditor(this._doc);
            this._barScrollBar = new beepbox.BarScrollBar(this._doc);
            this._octaveScrollBar = new beepbox.OctaveScrollBar(this._doc);
            this._piano = new beepbox.Piano(this._doc);
            this._editorBox = div({ style: "width: 512px;" }, [
                div({ style: "width: 512px; height: 481px; display: flex; flex-direction: row;" }, [
                    this._piano.container,
                    this._patternEditor.container,
                    this._octaveScrollBar.container,
                ]),
                div({ style: "width: 512px; height: 6px;" }),
                div({ style: "width: 512px;" }, [
                    this._trackEditor.container,
                    div({ style: "width: 512px; height: 5px;" }),
                    this._loopEditor.container,
                    div({ style: "width: 512px; height: 5px;" }),
                    this._barScrollBar.container,
                ]),
            ]);
            this._playButton = button({ style: "width: 34px; margin: 0px", type: "button" });
            this._volumeSlider = input({ title: "main volume", style: "width: 9em; flex-shrink: 0; margin: 0px;", type: "range", min: "0", max: "100", value: "50", step: "1" });
            this._editButton = select({ style: "width:100%;" }, [
                option("", "Edit Menu", true, true),
                option("undo", "Undo (Z)", false, false),
                option("redo", "Redo (Y)", false, false),
                option("copy", "Copy Pattern (C)", false, false),
                option("paste", "Paste Pattern (V)", false, false),
                option("transposeUp", "Shift Notes Up (+)", false, false),
                option("transposeDown", "Shift Notes Down (-)", false, false),
                option("duration", "Custom song size...", false, false),
                option("import", "Import JSON...", false, false),
                option("clean", "Clean Slate", false, false),
            ]);
            this._optionsButton = select({ style: "width:100%;" }, [
                option("", "Preferences Menu", true, true),
                option("showLetters", "Show Piano", false, false),
                option("showFifth", "Highlight 'Fifth' Notes", false, false),
				option("showMore", "Advanced Color Scheme", false, false),
                option("showChannels", "Show All Channels", false, false),
                option("showScrollBar", "Octave Scroll Bar", false, false),
            ]);
            this._exportButton = button({ style: "margin: 5px 0;", type: "button" }, [text("Export")]);
            this._scaleDropDown = buildOptions(select({ style: "width:9em;" }), beepbox.Config.scaleNames);
			this._aSettingsDropDown = buildOptions(select({ style: "width:9em;" }), beepbox.Config.aSettingsNames);
            this._keyDropDown = buildOptions(select({ style: "width:9em;" }), beepbox.Config.keyNames);
			this._themeDropDown = buildOptions(select({ style: "width:9em;" }), beepbox.Config.themeNames);
            this._tempoSlider = input({ style: "width: 9em; margin: 0px;", type: "range", min: "0", max: "25", value: "7", step: "1" });
            this._reverbSlider = input({ style: "width: 9em; margin: 0px;", type: "range", min: "0", max: "4", value: "0", step: "1" });
			
			this._blendSlider = input({ style: "width: 9em; margin: 0px;", type: "range", min: "0", max: "3", value: "0", step: "1" });			this._riffSlider = input({ style: "width: 9em; margin: 0px;", type: "range", min: "0", max: "10", value: "0", step: "1" });
			this._decayslSlider = input({ style: "width: 9em; margin: 0px;", type: "range", min: "0", max: "3", value: "0", step: "1" });
            this._advancedInstrumentSettingsLabel = div({ style: "margin: 3px 0; text-align: center;" }, [text("Advanced Instrument Settings")]);
			this._cleanButton = button({ style: "margin: 5px 0;", type: "button" }, [text("New Song")]);
			this._backwardButton = button({ style: "width:45%;", type: "button" }, [text("l<< ")]);
			this._forwardButton = button({ style: "width:45%;", type: "button" }, [text(">>l")]);
			this._undoButton = button({ style: "width:45%;", type: "button" }, [text("Undo")]);
			this._redoButton = button({ style: "width:45%;", type: "button" }, [text("Redo")]);
			this._customizeButton = button({ style: "margin: 5px 0;", type: "button" }, [text("Customize Song Size")]);
		
			this._partDropDown = buildOptions(select({ style: "width:9em;" }), beepbox.Config.partNames);
            this._patternSettingsLabel = div({ style: "visibility: hidden; margin: 3px 0; text-align: center;" }, [text("Pattern Settings")]);
            this._instrumentDropDown = select({ style: "width:9em;" });
            this._instrumentDropDownGroup = div({ className: "selectRow", style: "visibility: hidden;" }, [span({}, [text("Instrument: ")]), div({ className: "selectContainer" }, [this._instrumentDropDown])]);
            this._instrumentSettingsLabel = div({ style: "margin: 3px 0; text-align: center;" }, [text("Instrument Settings")]);
            this._channelVolumeSlider = input({ style: "width: 9em; margin: 0px;", type: "range", min: "-5", max: "0", value: "0", step: "1" });
            this._waveNames = buildOptions(select({ style: "width:9em;" }), beepbox.Config.waveNames);
            this._drumNames = buildOptions(select({ style: "width:9em;" }), beepbox.Config.drumNames);
            this._envelopeDropDown = buildOptions(select({ style: "width:9em;" }), beepbox.Config.envelopeNames);
            this._filterDropDown = buildOptions(select({ style: "width:9em;" }), beepbox.Config.filterNames);
            this._filterDropDownGroup = div({ className: "selectRow" }, [span({}, [text("Filter: ")]), div({ className: "selectContainer" }, [this._filterDropDown])]);
            this._chorusDropDown = buildOptions(select({ style: "width:9em;" }), beepbox.Config.chorusNames);
            this._chorusDropDownGroup = div({ className: "selectRow" }, [span({}, [text("Chorus: ")]), div({ className: "selectContainer" }, [this._chorusDropDown])]);
            this._effectDropDown = buildOptions(select({ style: "width:9em;" }), beepbox.Config.effectNames);
            this._effectDropDownGroup = div({ className: "selectRow" }, [span({}, [text("Effect: ")]), div({ className: "selectContainer" }, [this._effectDropDown])]);
            this._harmDropDown = buildOptions(select({ style: "width:9em;" }), beepbox.Config.harmNames);
			this._harmDropDownGroup = div({ className: "selectRow" }, [span({}, [text("Harmony: ")]), div({ className: "selectContainer" }, [this._harmDropDown])]);
			this._offOneDropDown = buildOptions(select({ style: "width:9em;" }), beepbox.Config.offOneNames);
			this._offOneDropDownGroup = div({ className: "selectRow" }, [span({}, [text("Offset Octave: ")]), div({ className: "selectContainer" }, [this._offOneDropDown])]);
			
			this._instrumentSettingsGroup = div({}, [
				 this._instrumentSettingsLabel,
				div({ className: "selectRow" }, [
                    span({}, [text("Volume: ")]),
                    this._channelVolumeSlider,
                ]),
                div({ className: "selectRow" }, [
                    span({}, [text("Wave: ")]),
                    div({ className: "selectContainer" }, [this._waveNames, this._drumNames]),
                ]),
                div({ className: "selectRow" }, [
                    span({}, [text("Envelope: ")]),
                    div({ className: "selectContainer" }, [this._envelopeDropDown]),
                ]),
                this._filterDropDownGroup,
                this._chorusDropDownGroup,
                this._effectDropDownGroup,
            ]);
			this._advancedInstrumentSettingsGroup = div({}, [
				this._advancedInstrumentSettingsLabel,
				this._harmDropDownGroup,
				this._offOneDropDownGroup,
            ]);
			this._advancedSettingsGroup = div({}, [
				div({ style: "text-align: center; color: ;" }, [text("Advanced Song Settings")]),
					div({ className: "selectRow" }, [span({}, [text("Blending: ")]), this._blendSlider]),
					div({ className: "selectRow" }, [span({}, [text("Riff: ")]), this._riffSlider]),
					div({ className: "selectRow" }, [span({}, [text("Decay: ")]), this._decayslSlider]),
					
            ]);
            this._promptContainer = div({ className: "promptContainer", style: "display: none;" });
            this.mainLayer = div({ className: "beepboxEditor", tabIndex: "0" }, [
                this._editorBox,
                div({ className: "editor-right-side" }, [
                    div({ style: "text-align: center; color: ;" }, [text("Openbox's Return")]),
                    div({ style: "margin: 5px 0; display: flex; flex-direction: row; align-items: center;" }, [
                        this._playButton,
                        div({ style: "width: 1px; height: 10px;" }),
                        beepbox.svgElement("svg", { width: "2em", height: "2em", viewBox: "0 0 26 26" }, [
                            beepbox.svgElement("path", { d: "M 4 17 L 4 9 L 8 9 L 12 5 L 12 21 L 8 17 z", fill: volumeColorPallet[_this._doc.song.theme] }),
                            beepbox.svgElement("path", { d: "M 15 11 L 16 10 A 7.2 7.2 0 0 1 16 16 L 15 15 A 5.8 5.8 0 0 0 15 12 z", fill: volumeColorPallet[_this._doc.song.theme] }),
                            beepbox.svgElement("path", { d: "M 18 8 L 19 7 A 11.5 11.5 0 0 1 19 19 L 18 18 A 10.1 10.1 0 0 0 18 8 z", fill: volumeColorPallet[_this._doc.song.theme] }),
                        ]),
                        div({ style: "width: 1px; height: 10px;" }),
                        this._volumeSlider,
                    ]),
                    div({ className: "selectContainer", style: "margin: 5px 0;" }, [this._editButton]),
                    div({ className: "selectContainer", style: "margin: 5px 0;" }, [this._optionsButton]),
                    this._exportButton,
                    div({ style: "flex: 1 1 110px;" }),
                    div({ style: "margin: 3px 0; text-align: center;" }, [text("Song Settings")]),
                    div({ className: "selectRow" }, [
                        span({}, [text("Settings: ")]),
                        div({ className: "selectContainer" }, [this._aSettingsDropDown]),
                    ]),
					div({ className: "selectRow" }, [
                        span({}, [text("Theme: ")]),
                        div({ className: "selectContainer" }, [this._themeDropDown]),
                    ]),
					div({ className: "selectRow" }, [
                        span({}, [text("Scale: ")]),
                        div({ className: "selectContainer" }, [this._scaleDropDown]),
                    ]),
                    div({ className: "selectRow" }, [
                        span({}, [text("Key: ")]),
                        div({ className: "selectContainer" }, [this._keyDropDown]),
                    ]),
                    div({ className: "selectRow" }, [
                        span({}, [text("Tempo: ")]),
                        this._tempoSlider,
                    ]),
                    div({ className: "selectRow" }, [
                        span({}, [text("Reverb: ")]),
                        this._reverbSlider,
                    ]),
                    div({ className: "selectRow" }, [
                        span({}, [text("Rhythm: ")]),
                        div({ className: "selectContainer" }, [this._partDropDown]),
                    ]),
                    div({ style: "flex: 1 1 25px;" }),
                    this._patternSettingsLabel,
                    this._instrumentDropDownGroup,
                    div({ style: "flex: 1 1 25px;" }),
                    this._instrumentSettingsGroup,
                ]),
				this._advacnedSettingsContainer = div({ className: "editor-right-most-side", style: "margin: 0px 5px;"}, [
                    div({ style: "text-align: center; color: ;" }, [text("Advanced Settings")]),
					this._cleanButton,
					this._customizeButton,
					div({ style: "margin: 5px 0; display: flex; flex-direction: row; justify-content: space-between;" }, [
                    this._backwardButton,
					this._undoButton,
					this._redoButton,
					this._forwardButton,
					]),
					div({ style: "width: 182px; height: 55px;" }),
					this._advancedSettingsGroup,
					div({ style: "width: 182px; height: 3px;" }),
					div({ style: "flex: 1 1 85px;" }),
					this._advancedInstrumentSettingsGroup,
					div({ style: "flex: 1 1 25px;" }),
				]),
                this._promptContainer,
            ]);
            this._changeTranspose = null;
            this._changeTempo = null;
            this._changeReverb = null;
			this._changeBlend = null;
			this._changeRiff = null;
			this._changeDecaysl = null;
            this._changeVolume = null;
            this._refocusStage = function (event) {
                _this.mainLayer.focus();
            };
            this._whenUpdated = function () {
                var optionCommands = [
                    (_this._doc.showLetters ? "[] " : "") + "Show Piano",
                    (_this._doc.showFifth ? "[] " : "") + "Highlight 'Fifth' Notes",
					(_this._doc.showMore ? "[] " : "") + "Advanced Color Scheme",
                    (_this._doc.showChannels ? "[] " : "") + "Show All Channels",
                    (_this._doc.showScrollBar ? "[] " : "") + "Octave Scroll Bar",
                ];
                for (var i = 0; i < optionCommands.length; i++) {
                    var option_1 = _this._optionsButton.children[i + 1];
                    if (option_1.innerText != optionCommands[i])
                        option_1.innerText = optionCommands[i];
                }
				setSelectedIndex(_this._aSettingsDropDown, _this._doc.song.aSettings);
				setSelectedIndex(_this._themeDropDown, _this._doc.song.theme);
                setSelectedIndex(_this._scaleDropDown, _this._doc.song.scale);
                setSelectedIndex(_this._keyDropDown, _this._doc.song.key);
                _this._tempoSlider.value = "" + _this._doc.song.tempo;
                _this._reverbSlider.value = "" + _this._doc.song.reverb;
			
			_this._advacnedSettingsContainer.style.visibility = aListHidden[_this._doc.song.aSettings];
				_this._blendSlider.value = "" + _this._doc.song.blend;
				_this._riffSlider.value = "" + _this._doc.song.riff;
				_this._decayslSlider.value = "" + _this._doc.song.decaysl;
                setSelectedIndex(_this._partDropDown, beepbox.Config.partCounts.indexOf(_this._doc.song.partsPerBeat));				
				
				if (_this._doc.song.getChannelIsDrum(_this._doc.channel)) {

					_this._filterDropDownGroup.style.visibility = "hidden";
                    _this._chorusDropDownGroup.style.visibility = "hidden";
                    _this._effectDropDownGroup.style.visibility = "hidden";
					_this._harmDropDownGroup.style.visibility = "hidden";
					_this._offOneDropDownGroup.style.visibility = "hidden";
                    _this._waveNames.style.display = "none";
                    _this._drumNames.style.display = "block";
                }
                else {
                    _this._harmDropDownGroup.style.visibility = aListHidden[_this._doc.song.aSettings];
					_this._offOneDropDownGroup.style.visibility = aListHidden[_this._doc.song.aSettings];
					_this._filterDropDownGroup.style.visibility = "visible";
                    _this._chorusDropDownGroup.style.visibility = "visible";
                    _this._effectDropDownGroup.style.visibility = "visible";
                    _this._waveNames.style.display = "block";
                    _this._drumNames.style.display = "none";
                }
                var pattern = _this._doc.getCurrentPattern();
                _this._patternSettingsLabel.style.visibility = (_this._doc.song.instrumentsPerChannel > 1 && pattern != null) ? "visible" : "hidden";
                _this._instrumentDropDownGroup.style.visibility = (_this._doc.song.instrumentsPerChannel > 1 && pattern != null) ? "visible" : "hidden";
                if (_this._instrumentDropDown.children.length != _this._doc.song.instrumentsPerChannel) {
                    while (_this._instrumentDropDown.firstChild)
                        _this._instrumentDropDown.removeChild(_this._instrumentDropDown.firstChild);
                    var instrumentList = [];
                    for (var i = 0; i < _this._doc.song.instrumentsPerChannel; i++) {
                        instrumentList.push(i + 1);
                    }
                    buildOptions(_this._instrumentDropDown, instrumentList);
                }
                _this._instrumentSettingsGroup.style.color = _this._doc.song.getNoteColorBright(_this._doc.channel);
                _this._advancedInstrumentSettingsGroup.style.color = _this._doc.song.getNoteColorBright(_this._doc.channel);
				_this._advancedSettingsGroup.style.color = _this._doc.song.getNoteColorDim(_this._doc.channel);
				var instrument = _this._doc.getCurrentInstrument();
                setSelectedIndex(_this._waveNames, _this._doc.song.instrumentWaves[_this._doc.channel][instrument]);
                setSelectedIndex(_this._drumNames, _this._doc.song.instrumentWaves[_this._doc.channel][instrument]);
                setSelectedIndex(_this._filterDropDown, _this._doc.song.instrumentFilters[_this._doc.channel][instrument]);
                setSelectedIndex(_this._envelopeDropDown, _this._doc.song.instrumentEnvelopes[_this._doc.channel][instrument]);
                setSelectedIndex(_this._effectDropDown, _this._doc.song.instrumentEffects[_this._doc.channel][instrument]);
                setSelectedIndex(_this._chorusDropDown, _this._doc.song.instrumentChorus[_this._doc.channel][instrument]);
				setSelectedIndex(_this._harmDropDown, _this._doc.song.instrumentHarm[_this._doc.channel][instrument]);
				setSelectedIndex(_this._offOneDropDown, _this._doc.song.instrumentOffOne[_this._doc.channel][instrument]);
                _this._channelVolumeSlider.value = -_this._doc.song.instrumentVolumes[_this._doc.channel][instrument] + "";
                setSelectedIndex(_this._instrumentDropDown, instrument);
                _this._piano.container.style.display = _this._doc.showLetters ? "block" : "none";
                _this._octaveScrollBar.container.style.display = _this._doc.showScrollBar ? "block" : "none";
                _this._barScrollBar.container.style.display = _this._doc.song.barCount > 16 ? "block" : "none";
                var patternWidth = 512;
                if (_this._doc.showLetters)
                    patternWidth -= 32;
                if (_this._doc.showScrollBar)
                    patternWidth -= 20;
                _this._patternEditor.container.style.width = String(patternWidth) + "px";
                _this._volumeSlider.value = String(_this._doc.volume);
                _this._setPrompt(_this._doc.prompt);
            };
            this._whenKeyPressed = function (event) {
                if (_this.prompt) {
                    if (event.keyCode == 27) {
                        window.history.back();
                    }
                    return;
                }
                _this._trackEditor.onKeyPressed(event);
                switch (event.keyCode) {
                    case 32:
                        _this._togglePlay();
                        event.preventDefault();
                        break;
                    case 90:
                        if (event.shiftKey) {
                            _this._doc.redo();
                        }
                        else {
                            _this._doc.undo();
                        }
                        event.preventDefault();
                        break;
                    case 89:
                        _this._doc.redo();
                        event.preventDefault();
                        break;
                    case 67:
                        _this._copy();
                        event.preventDefault();
                        break;
                    case 86:
                        _this._paste();
                        event.preventDefault();
                        break;
                    case 219:
                        _this._doc.synth.prevBar();
                        event.preventDefault();
                        break;
                    case 221:
                        _this._doc.synth.nextBar();
                        event.preventDefault();
                        break;
                    case 81:
                        _this._openPrompt("duration");
                        event.preventDefault();
                        break;
                    case 189:
                    case 173:
                        _this._transpose(false);
                        event.preventDefault();
                        break;
                    case 187:
                    case 61:
                        _this._transpose(true);
                        event.preventDefault();
                        break;
                }
            };
            this._togglePlay = function () {
                if (_this._doc.synth.playing) {
                    _this._pause();
                }
                else {
                    _this._play();
                }
            };
            this._setVolumeSlider = function () {
                _this._doc.setVolume(Number(_this._volumeSlider.value));
            };
            this._openExportPrompt = function () {
                _this._openPrompt("export");
            };
			this._shiftForward = function () {
                _this._doc.synth.nextBar();
            };
			this._shiftBackward = function () {
                _this._doc.synth.prevBar();
            };
			this._advancedUndo = function () {
                _this._doc.undo();
            };
			this._advancedRedo = function () {
                _this._doc.redo();
            };
			this._customize = function () {
                _this._openPrompt("duration");
            };
			this._cleanEverything = function () {
                _this._cleanSlate();
            };
			this._whenSetASettings = function () {
                _this._doc.history.record(new beepbox.ChangeASettings(_this._doc, _this._aSettingsDropDown.selectedIndex));
            };
			refresh = function () {
			_this._openPrompt("refresh");
			};
			refreshNow = function () {
			location.reload();
			};
			this._whenSetTheme = function () {
                _this._doc.history.record(new beepbox.ChangeTheme(_this._doc, _this._themeDropDown.selectedIndex));
            };
            this._whenSetScale = function () {
                _this._doc.history.record(new beepbox.ChangeScale(_this._doc, _this._scaleDropDown.selectedIndex));
            };
            this._whenSetKey = function () {
                _this._doc.history.record(new beepbox.ChangeKey(_this._doc, _this._keyDropDown.selectedIndex));
            };
            this._whenSetTempo = function () {
                var continuousChange = _this._doc.history.lastChangeWas(_this._changeTempo);
                var oldValue = continuousChange ? _this._changeTempo.oldValue : _this._doc.song.tempo;
                _this._changeTempo = new beepbox.ChangeTempo(_this._doc, oldValue, parseInt(_this._tempoSlider.value));
                _this._doc.history.record(_this._changeTempo, continuousChange);
            };
            this._whenSetReverb = function () {
                var continuousChange = _this._doc.history.lastChangeWas(_this._changeReverb);
                var oldValue = continuousChange ? _this._changeReverb.oldValue : _this._doc.song.reverb;
                _this._changeReverb = new beepbox.ChangeReverb(_this._doc, oldValue, parseInt(_this._reverbSlider.value));
                _this._doc.history.record(_this._changeReverb, continuousChange);
            };
			this._whenSetBlend = function () {
                var continuousChange = _this._doc.history.lastChangeWas(_this._changeBlend);
                var oldValue = continuousChange ? _this._changeBlend.oldValue : _this._doc.song.blend;
                _this._changeBlend = new beepbox.ChangeBlend(_this._doc, oldValue, parseInt(_this._blendSlider.value));
                _this._doc.history.record(_this._changeBlend, continuousChange);
            };
			this._whenSetRiff = function () {
                var continuousChange = _this._doc.history.lastChangeWas(_this._changeRiff);
                var oldValue = continuousChange ? _this._changeRiff.oldValue : _this._doc.song.riff;
                _this._changeRiff = new beepbox.ChangeRiff(_this._doc, oldValue, parseInt(_this._riffSlider.value));
                _this._doc.history.record(_this._changeRiff, continuousChange);
            };
			this._whenSetDecaysl = function () {
                var continuousChange = _this._doc.history.lastChangeWas(_this._changeDecaysl);
                var oldValue = continuousChange ? _this._changeDecaysl.oldValue : _this._doc.song.decaysl;
                _this._changeDecaysl = new beepbox.ChangeDecaysl(_this._doc, oldValue, parseInt(_this._decayslSlider.value));
                _this._doc.history.record(_this._changeDecaysl, continuousChange);
            };

            this._whenSetPartsPerBeat = function () {
                _this._doc.history.record(new beepbox.ChangePartsPerBeat(_this._doc, beepbox.Config.partCounts[_this._partDropDown.selectedIndex]));
            };
            this._whenSetWave = function () {
                _this._doc.history.record(new beepbox.ChangeWave(_this._doc, _this._waveNames.selectedIndex));
            };
            this._whenSetDrum = function () {
                _this._doc.history.record(new beepbox.ChangeWave(_this._doc, _this._drumNames.selectedIndex));
            };
            this._whenSetFilter = function () {
                _this._doc.history.record(new beepbox.ChangeFilter(_this._doc, _this._filterDropDown.selectedIndex));
            };
            this._whenSetEnvelope = function () {
                _this._doc.history.record(new beepbox.ChangeEnvelope(_this._doc, _this._envelopeDropDown.selectedIndex));
            };
            this._whenSetEffect = function () {
                _this._doc.history.record(new beepbox.ChangeEffect(_this._doc, _this._effectDropDown.selectedIndex));
            };
            this._whenSetChorus = function () {
                _this._doc.history.record(new beepbox.ChangeChorus(_this._doc, _this._chorusDropDown.selectedIndex));
            };
			this._whenSetHarm = function () {
                _this._doc.history.record(new beepbox.ChangeHarm(_this._doc, _this._harmDropDown.selectedIndex));
            };
			this._whenSetOffOne = function () {
                _this._doc.history.record(new beepbox.ChangeOffOne(_this._doc, _this._offOneDropDown.selectedIndex));
            };
            this._whenSetVolume = function () {
                var continuousChange = _this._doc.history.lastChangeWas(_this._changeVolume);
                var oldValue = continuousChange ? _this._changeVolume.oldValue : _this._doc.song.instrumentVolumes[_this._doc.channel][_this._doc.getCurrentInstrument()];
                _this._changeVolume = new beepbox.ChangeVolume(_this._doc, oldValue, -parseInt(_this._channelVolumeSlider.value));
                _this._doc.history.record(_this._changeVolume, continuousChange);
            };
            this._whenSetInstrument = function () {
                var pattern = _this._doc.getCurrentPattern();
                if (pattern == null)
                    return;
                _this._doc.history.record(new beepbox.ChangePatternInstrument(_this._doc, _this._instrumentDropDown.selectedIndex, pattern));
            };
            this._editMenuHandler = function (event) {
                switch (_this._editButton.value) {
                    case "undo":
                        _this._doc.undo();
                        break;
                    case "redo":
                        _this._doc.redo();
                        break;
                    case "copy":
                        _this._copy();
                        break;
                    case "paste":
                        _this._paste();
                        break;
                    case "transposeUp":
                        _this._transpose(true);
                        break;
                    case "transposeDown":
                        _this._transpose(false);
                        break;
                    case "import":
                        _this._openPrompt("import");
                        break;
                    case "clean":
                        _this._cleanSlate();
                        break;
                    case "duration":
                        _this._openPrompt("duration");
                        break;
                }
                _this._editButton.selectedIndex = 0;
            };
            this._optionsMenuHandler = function (event) {
                switch (_this._optionsButton.value) {
                    case "showLetters":
                        _this._doc.showLetters = !_this._doc.showLetters;
                        break;
                    case "showFifth":
                        _this._doc.showFifth = !_this._doc.showFifth;
                        break;
						case "showMore":
                        _this._doc.showMore = !_this._doc.showMore;
                        break;
                    case "showChannels":
                        _this._doc.showChannels = !_this._doc.showChannels;
                        break;
                    case "showScrollBar":
                        _this._doc.showScrollBar = !_this._doc.showScrollBar;
                        break;
						
                }
                _this._optionsButton.selectedIndex = 0;
                _this._doc.notifier.changed();
                _this._doc.savePreferences();
            };
            this._doc.notifier.watch(this._whenUpdated);
            this._whenUpdated();
            this._editButton.addEventListener("change", this._editMenuHandler);
            this._optionsButton.addEventListener("change", this._optionsMenuHandler);
            this._aSettingsDropDown.addEventListener("change", this._whenSetASettings);
			this._themeDropDown.addEventListener("change", this._whenSetTheme);
			this._scaleDropDown.addEventListener("change", this._whenSetScale);
            this._keyDropDown.addEventListener("change", this._whenSetKey);
            this._tempoSlider.addEventListener("input", this._whenSetTempo);
            this._reverbSlider.addEventListener("input", this._whenSetReverb);
			this._blendSlider.addEventListener("input", this._whenSetBlend);
			this._riffSlider.addEventListener("input", this._whenSetRiff);
			this._decayslSlider.addEventListener("input", this._whenSetDecaysl);
            this._partDropDown.addEventListener("change", this._whenSetPartsPerBeat);
            this._instrumentDropDown.addEventListener("change", this._whenSetInstrument);
            this._channelVolumeSlider.addEventListener("input", this._whenSetVolume);
            this._waveNames.addEventListener("change", this._whenSetWave);
            this._drumNames.addEventListener("change", this._whenSetDrum);
            this._envelopeDropDown.addEventListener("change", this._whenSetEnvelope);
            this._filterDropDown.addEventListener("change", this._whenSetFilter);
            this._chorusDropDown.addEventListener("change", this._whenSetChorus);
			this._harmDropDown.addEventListener("change", this._whenSetHarm);
			this._offOneDropDown.addEventListener("change", this._whenSetOffOne);
            this._effectDropDown.addEventListener("change", this._whenSetEffect);
            this._playButton.addEventListener("click", this._togglePlay);
            this._exportButton.addEventListener("click", this._openExportPrompt);
			this._cleanButton.addEventListener("click", this._cleanEverything);
			this._forwardButton.addEventListener("click", this._shiftForward);
			this._backwardButton.addEventListener("click", this._shiftBackward);
			this._undoButton.addEventListener("click", this._advancedUndo);
			this._redoButton.addEventListener("click", this._advancedRedo);
			this._customizeButton.addEventListener("click", this._customize);
            this._volumeSlider.addEventListener("input", this._setVolumeSlider);
            this._editorBox.addEventListener("mousedown", this._refocusStage);
            this.mainLayer.addEventListener("keydown", this._whenKeyPressed);
        }
        SongEditor.prototype._openPrompt = function (promptName) {
            this._doc.openPrompt(promptName);
            this._setPrompt(promptName);
        };
        SongEditor.prototype._setPrompt = function (promptName) {
            if (this.prompt) {
                if (this._wasPlaying)
                    this._play();
                this._wasPlaying = false;
                this._promptContainer.style.display = "none";
                this._promptContainer.removeChild(this.prompt.container);
                this.prompt.cleanUp();
                this.prompt = null;
                this.mainLayer.focus();
            }
            if (promptName) {
                switch (promptName) {
                    case "export":
                        this.prompt = new beepbox.ExportPrompt(this._doc, this);
                        break;
                    case "import":
                        this.prompt = new beepbox.ImportPrompt(this._doc, this);
                        break;
                    case "duration":
                        this.prompt = new beepbox.SongDurationPrompt(this._doc, this);
                        break;
					case "refresh":
                        this.prompt = new beepbox.RefreshPrompt(this._doc, this);
                        break;
                }
                if (this.prompt) {
                    this._wasPlaying = this._doc.synth.playing;
                    this._pause();
                    this._promptContainer.style.display = null;
                    this._promptContainer.appendChild(this.prompt.container);
                }
            }
        };
        SongEditor.prototype.updatePlayButton = function () {
            if (this._doc.synth.playing) {
                this._playButton.classList.remove("playButton");
                this._playButton.classList.add("pauseButton");
                this._playButton.title = "Pause";
            }
            else {
                this._playButton.classList.remove("pauseButton");
                this._playButton.classList.add("playButton");
                this._playButton.title = "Play";
            }
        };
        SongEditor.prototype._play = function () {
            this._doc.synth.play();
            this.updatePlayButton();
        };
        SongEditor.prototype._pause = function () {
            this._doc.synth.pause();
            this._doc.synth.snapToBar();
            this.updatePlayButton();
        };
        SongEditor.prototype._copy = function () {
            var pattern = this._doc.getCurrentPattern();
            if (pattern == null)
                return;
            var patternCopy = {
                notes: pattern.notes,
                beatsPerBar: this._doc.song.beatsPerBar,
                partsPerBeat: this._doc.song.partsPerBeat,
                drums: this._doc.song.getChannelIsDrum(this._doc.channel),
            };
            window.localStorage.setItem("patternCopy", JSON.stringify(patternCopy));
        };
        SongEditor.prototype._paste = function () {
            var pattern = this._doc.getCurrentPattern();
            if (pattern == null)
                return;
            var patternCopy = JSON.parse(String(window.localStorage.getItem("patternCopy")));
            if (patternCopy != null && patternCopy.drums == this._doc.song.getChannelIsDrum(this._doc.channel)) {
                this._doc.history.record(new beepbox.ChangePaste(this._doc, pattern, patternCopy.notes, patternCopy.beatsPerBar, patternCopy.partsPerBeat));
            }
        };
        SongEditor.prototype._cleanSlate = function () {
            this._doc.history.record(new beepbox.ChangeSong(this._doc, ""));
            this._patternEditor.resetCopiedPins();
        };
        SongEditor.prototype._transpose = function (upward) {
            var pattern = this._doc.getCurrentPattern();
            if (pattern == null)
                return;
            var continuousChange = this._doc.history.lastChangeWas(this._changeTranspose);
            this._changeTranspose = new beepbox.ChangeTranspose(this._doc, pattern, upward);
            this._doc.history.record(this._changeTranspose, continuousChange);
        };
        return SongEditor;
    }());
    beepbox.SongEditor = SongEditor;
    var doc = new beepbox.SongDocument(location.hash);
    var editor = new SongEditor(doc);
    var beepboxEditorContainer = document.getElementById("beepboxEditorContainer");
    beepboxEditorContainer.appendChild(editor.mainLayer);
    editor.mainLayer.focus();
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|android|ipad|playbook|silk/i.test(navigator.userAgent)) {
        function autoplay() {
            if (!document.hidden) {
                doc.synth.play();
                editor.updatePlayButton();
                window.removeEventListener("visibilitychange", autoplay);
            }
        }
        if (document.hidden) {
            window.addEventListener("visibilitychange", autoplay);
        }
        else {
            autoplay();
        }
        editor.updatePlayButton();
    }
})(beepbox || (beepbox = {}));
