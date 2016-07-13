var SpectrumData = function (freqMin, freqMax, indexMin, indexMax, weight, values, averages, variations) {

	this.freqMin = freqMin || 0;
	this.freqMax = freqMax || 0;
	this.indexMin = indexMin || 0;
	this.indexMax = indexMax || 0;
	this.weight = weight || 0;

	//Array of array of values because each frame need an array
	if (values != undefined) {
		//Copy all of data
		this.values = values.splice();

		for (var i = 0; i < values.length; ++i) {
			this.values[i] = values[i].splice();
		}
	} else {
		this.values = [];
	}

	//Each index are one frame processing
	this.averages = averages ? averages.splice() : [];
	this.variations = variations ? variations.splice() : [];
}

SpectrumData.prototype.clone = function () {
	return new SpectrumData(this.freqMin, this.freqMax, this.indexMin, this.indexMax, this.weight, this.values, this.averages, this.variations);
}

var AudioManager = {
	begin: function () {
		// Create all variables we need to init AudioManager

		this.audioCtx = new(window.AudioContext || window.webkitAudioContext)();
		this.audioAnalyser = this.audioCtx.createAnalyser();
		this.audioAnalyser.connect(this.audioCtx.destination);
		this.audioAnalyser.minDecibels = -140;
		this.audioAnalyser.maxDecibels = 0;

		this.frequencies = new Uint8Array(this.audioAnalyser.frequencyBinCount);
		this.times = new Uint8Array(this.audioAnalyser.frequencyBinCount);

		this.currentStream = null;
		this.isPlaying = false;
		this.startTime = 0;
		this.startOffset = 0;

		//All spectrum data
		this.spectrums = [];

		//Size of one frequency (bar in draw spectrum)
		this.frequencySize = 0.0;

		//Value are in Hertz
		this.humanAudibleSpectrumTable = [
			[0, 40],
			[40, 160],
			[160, 315],
			[315, 2500],
			[2500, 5000],
			[5000, 10000],
			[10000, 20000]
		];
		
		this.averageFrequencies = [];
	},

	loadSound: function (name, url, onprogress, onload) {
		// Load a sound

		var self = this;

		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.responseType = "arraybuffer";

		xhr.onprogress = function (e) {

			// If we don't have this information we can't compute progress information
			if (e.lengthComputable) {

				var percentComplete = Math.floor((e.loaded / e.total) * 100) / 100;

				if (onprogress)
					onprogress(percentComplete);

			} else {

				console.warn('We can\'t compute progress information');

			}
		};

		xhr.onload = function () {

			self.audioCtx.decodeAudioData(
				xhr.response,
				function (buffer) {

					if (!buffer) {
						alert('error decoding file data: ' + url);
						return;
					}

					self.currentStream = {
						'name': name,
						'buffer': buffer,
						'peaks': null,
						'beat': null
					};

					//All spectrum data
					self.spectrums = [];

					//Size of one frequency (bar in draw spectrum)
					self.frequencySize = 0.0;

					self.computeSound();
					self.calculatePeaksAndBeat(xhr.response, onload);

				},
				function (error) {

					console.error('decodeAudioData error', error);

				}
			);

		};

		xhr.onerror = function () {

			console.log('Error with ' + url);

		};

		xhr.send();


	},

	computeSound: function () {
		this.frequencySize = (this.currentStream.buffer.sampleRate / 2.0) / (this.audioAnalyser.fftSize / 2.0);

		for (var i = 0; i < this.humanAudibleSpectrumTable.length; ++i) {
			var minMaxFreq = this.humanAudibleSpectrumTable[i];

			var indexMin = Math.floor(minMaxFreq[0] / this.frequencySize);
			var indexMax = Math.floor(minMaxFreq[1] / this.frequencySize);
			var weight = 1.0;

			if (this.spectrums.length > 0) {
				if (indexMin <= this.spectrums[this.spectrums.length - 1].indexMax) {
					indexMin = this.spectrums[this.spectrums.length - 1].indexMax + 1;
				}

				weight = (minMaxFreq[1] - minMaxFreq[0]) / (this.spectrums[0].freqMax - this.spectrums[0].freqMin);

			}

			this.spectrums.push(new SpectrumData(minMaxFreq[0], minMaxFreq[1], indexMin, indexMax, weight));

		}

		var lastSpectrum = this.spectrums[this.spectrums.length - 1];
		this.spectrums.push(new SpectrumData(lastSpectrum.freqMax, this.currentStream.buffer.sampleRate / 2.0, lastSpectrum.indexMax + 1, this.audioAnalyser.fftSize / 2.0 - 1));
	},

	play: function () {
		// Load a music

		if (!this.currentStream || this.isPlaying)
			return;

		this.isPlaying = true;

		this.startTime = this.audioCtx.currentTime;
		this.source = this.audioCtx.createBufferSource();
		this.source.connect(this.audioAnalyser);
		this.source.buffer = this.currentStream.buffer;
		this.source.loop = true;

		//this.source[this.source.start ? 'start' : 'noteOn'](0, this.startOffset % this.currentStream.buffer.duration);
		this.source[this.source.start ? 'start' : 'noteOn'](0, this.startOffset % this.currentStream.buffer.duration);
	},

	pause: function () {
		// Pause a music

		if (!this.currentStream || !this.isPlaying)
			return;

		this.isPlaying = false;

		this.source[this.source.stop ? 'stop' : 'noteOff'](0);
		this.startOffset += this.audioCtx.currentTime - this.startTime;
	},

	stop: function () {
		// Stop a music

		if (!this.currentStream || !this.isPlaying)
			return;

		this.isPlaying = false;

		this.source[this.source.stop ? 'stop' : 'noteOff'](0);

		this.isPlaying = false;
		this.startTime = 0;
		this.startOffset = 0;
	},

	togglePlayPause: function () {
		// Swap between play and pause

		if (this.isPlaying)
			this.pause();
		else
			this.play();
	},

	getFrequencies: function () {
		// Return frequency domain for the frame

		if (!this.currentStream || !this.isPlaying)
			return null;

		this.audioAnalyser.getByteFrequencyData(this.frequencies);

		return this.frequencies;

	},

	getTimes: function () {
		// Return time domain for the frame

		if (!this.currentStream || !this.isPlaying)
			return null;

		this.audioAnalyser.getByteTimeDomainData(this.times);

		return this.times;

	},

	setFFTSize: function (size) {

		this.audioAnalyser.fftSize = size;

	},

	setSmoothingTimeConstant: function (smooth) {

		this.audioAnalyser.smoothingTimeConstant = smooth;

	},

	calculatePeaksAndBeat: function (decodedData, onload) {

		var offlineCtx = new(window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 2, this.currentStream.buffer.sampleRate);

		var self = this;

		offlineCtx.decodeAudioData(decodedData, function (buffer) {

			// Create Buffer source
			var source = offlineCtx.createBufferSource();
			source.buffer = buffer;

			// Create filter
			var filter = offlineCtx.createBiquadFilter();
			filter.type = "lowpass";

			source.connect(filter);
			filter.connect(offlineCtx.destination);

			source.start(0);

			var peaks,
				initialThreshold = 0.9,
				threshold = initialThreshold,
				minThreshold = 0.3,
				minPeaks = 30;

			do {

				peaks = getPeaksAtThreshold(buffer.getChannelData(0), threshold);
				threshold -= 0.5;

			} while (peaks.length < minPeaks && threshold >= minThreshold);

			if (self.currentStream) {

				self.currentStream.peaks = peaks;

				if (onload)
					onload();

			}

		});

	},

	computeFrequency: function () {

		var curFreq = this.getFrequencies();
		var self = this;

		for (var spectrumIndex = 0; spectrumIndex < this.spectrums.length; ++spectrumIndex) {
			var curSpectrum = this.spectrums[spectrumIndex];

			var min = curSpectrum.indexMin;
			var max = curSpectrum.indexMax;

			var values = [];
			var average = 0;
			var variation = 0;

			for (var i = min; i <= max; ++i) {
				values.push(curFreq[i]);
				average += curFreq[i];
			}

			average /= values.length;

			variation = average - (curSpectrum.averages.length > 0 ? curSpectrum.averages[curSpectrum.averages.length - 1] : 0);

			curSpectrum.values.push(values);
			curSpectrum.averages.push(average);
			curSpectrum.variations.push(variation);
		}
	},

	getLastVariation: function () {

		return this.variations.length > 0 ? this.variations[this.variations.length - 1] : 0;
	},

	getAverageNormalisedVariation: function () {

		var average = 0;
		for (var i = 0; i < this.spectrums.length; i++) {

			var spectrum = this.spectrums[i];
			var nbVariations = spectrum.variations.length;

			average += spectrum.variations[nbVariations - 1] * spectrum.weight;

		}

		return average / this.spectrums.length;
	},

	getTimeMusic: function () {

		if (!this.currentStream)
			return 0;

		return this.audioCtx.currentTime - this.startTime % this.currentStream.buffer.duration;

	},
	
	getAverageFrequency: function() {
	
		var value = 0;
		var frequencies = this.getFrequencies();
		
		for(var i = 0, end = frequencies.length; i < end; ++i)
		{
			value += frequencies[i];	
		}
		value /= frequencies.length;
		
		this.averageFrequencies.push(value);
		
		return this.averageFrequencies;
	}

};

// Function to identify peaks
function getPeaksAtThreshold(data, threshold) {

	var peaksArray = [];
	var length = data.length;
	for (var i = 0; i < length;) {

		if (data[i] > threshold) {

			peaksArray.push(i);
			// Skip forward ~ 1/4s to get past this peak.
			i += 10000;

		}

		i++;

	}

	return peaksArray;

}