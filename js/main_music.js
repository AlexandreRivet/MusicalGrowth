function init() {

	AudioManager.begin();
	AudioManager.setFFTSize(2048);
	AudioManager.setSmoothingTimeConstant(0.8);

	ResourceManager.begin();

	ResourceManager.addResource('Ethereal', 'musics/I Took A Pill In Ibiza.mp3', ResourceType.MUSIC);

	ResourceManager.run(function (percent) {
		progress(percent);
	}, null, finished);
}

function progress(percent) {
	var finalPercent = percent * 100;
	var str = finalPercent + '%';

	$('#loading_1').css({
		'background': 'linear-gradient(0, #95a5a6 ' + str + ', #ecf0f1 0%)'
	});
}

function finished() {
	$('#loading_1').css({
		'background': 'linear-gradient(0, #95a5a6 0%, #ecf0f1 0%)'
	});
	$('#loading').addClass('flipper');
	$('#loading').addClass('cursor');

	$('#loading').on('dragover', function (event) {
		event.preventDefault();
		event.stopPropagation();
		event.originalEvent.dataTransfer.dropEffect = 'copy';
	});

	$('#loading').on('dragleave', function (event) {
		event.preventDefault();
		event.stopPropagation();
	});

	$('#loading').on('drop', function (event) {
		event.preventDefault();
		event.stopPropagation();
		var files, file, type, i;

		$('#loading').removeClass('flipper');

		files = event.originalEvent.dataTransfer.files;

		var nbFiles = files.length;
		for (var i = 0; i < nbFiles; i++) {
			var file = files[i];
			var elements = file.name.split('.');
			elements.pop();
			var name = elements.join('');
			ResourceManager.addResource(name, 'musics/' + file.name, ResourceType.MUSIC);
		}

		ResourceManager.run(function (percent) {
			progress(percent);
		}, null, launchExperience);

	});

	// Ici on dit que si on clique dessus on lance l'app 
	$('#loading').click(function () {

		launchExperience();

	});


}

function launchExperience() {
	AudioManager.togglePlayPause();

	$('#intro').hide();
	$('#main').show();
	render();

	$('#music-name').html(AudioManager.currentStream.name);

}

function render() {

	requestAnimationFrame(render);

	var canvas = document.getElementById('canvas-sound-visualization');
	var ctx = canvas.getContext('2d');

	var width = canvas.clientWidth;
	var height = canvas.clientHeight;
	canvas.width = width;
	canvas.height = height;

	ctx.fillStyle = 'rgb(0, 0, 0)';
	ctx.fillRect(0, 0, width, height);

	// timeline
	renderTimeline(ctx, width, height);

	// Draw de la barre de séparation
	drawLine(ctx, [0, height * 0.9], [width, height * 0.9], 'white');

	// frequency domain
	renderFrequencyDomain(ctx, width, height);

	// Draw de la barre de séparation
	drawLine(ctx, [0, height * 0.4], [width, height * 0.4], 'white');

	// spectrum variations
	renderSpectrumVariations(ctx, width, height);
	
	// render average frequency
	renderAverageFrequency(ctx, width, height);

}

function renderTimeline(ctx, w, h) {

	// Draw du curseur de la musique
	var duration = AudioManager.currentStream.buffer.duration;
	var currentTimeMusic = (AudioManager.audioCtx.currentTime - AudioManager.startTime) % duration;
	var cursorPos = (currentTimeMusic / duration) * w;

	// Draw des peaks
	var peaks = AudioManager.currentStream.peaks;
	var sampleRate = AudioManager.currentStream.buffer.sampleRate;

	if (peaks) {

		ctx.strokeStyle = 'white';
		for (var i = 0; i < peaks.length; i++) {

			var current = ((peaks[i] / sampleRate) / duration) * w;
			drawLine(ctx, [current, h * 0.9], [current, h * 1.00]);

		}

	}

	// Draw du cursor
	drawLine(ctx, [cursorPos, h * 0.9], [cursorPos, h * 1.00], 'red');

	// Mise à jour de l'info
	$('#music-time').html(formatSecond(currentTimeMusic) + ' / ' + formatSecond(duration));


}

function renderFrequencyDomain(ctx, w, h) {

	// Draw du domaine de fréquence
	var frequencyBinCount = AudioManager.audioAnalyser.frequencyBinCount;
	var barWidth = w / frequencyBinCount;
	var frequencies = AudioManager.getFrequencies();
	var new_height = h * 0.9;
	var height_bars = h * 0.5;

	for (var i = 0; i < frequencyBinCount; i++) {
		var value = frequencies[i];
		var percent = value / 256;
		var height_tmp = height_bars * percent;
		var offset = new_height - height_tmp - 1;
		var hue = i / frequencyBinCount * 360;

		ctx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
		ctx.fillRect(i * barWidth, offset, barWidth, height_tmp);
	}

	// Draw de la waveform
	var times = AudioManager.getTimes();
	ctx.strokeStyle = 'white';
	ctx.beginPath();

	for (var i = 0; i < frequencyBinCount; i++) {
		var value = times[i];
		var percent = value / 256;
		var height_tmp = height_bars * percent;
		var offset = new_height - height_tmp - 1;

		if (i == 0)
			ctx.moveTo(i * barWidth, offset);
		else
			ctx.lineTo(i * barWidth, offset);
	}

	ctx.stroke();
	ctx.closePath();

}

function renderSpectrumVariations(ctx, w, h) {

	AudioManager.computeFrequency();

	var spectrums = AudioManager.spectrums;

	if (spectrums.length > 0) {

		var x = 0,
			y = 0;

		var nbSpectrum = spectrums.length;
		var nbSpectrum_2 = Math.ceil(nbSpectrum / 2);
		var width_divided = w / nbSpectrum_2;
		var height_divided = h * 0.2;
		var nbValuesPerSpectrum = 125;
		var colorList = ['white', 'red', 'blue', 'green', 'yellow', 'purple', 'cyan', 'pink'];

		for (var spectrumIndex = 0; spectrumIndex < nbSpectrum; ++spectrumIndex) {

			if (!AudioManager.humanAudibleSpectrumTable[spectrumIndex])
				continue;

			var curSpectrum = spectrums[spectrumIndex];

			var minMaxVariation = minMaxInLastNumberIntoVariation(curSpectrum.variations, nbValuesPerSpectrum);

			if (curSpectrum.variations.length > 1) {

				var begin = 0;
				var end = curSpectrum.variations.length;

				if (minMaxVariation[0] !== 0 || minMaxVariation[1] !== 0) {

					ctx.strokeStyle = colorList[spectrumIndex];
					ctx.beginPath();

					var index = 0;
					if (curSpectrum.variations.length >= nbValuesPerSpectrum) {

						index = curSpectrum.length - 1 - nbValuesPerSpectrum - 1;

					}

					var valueMoved = (curSpectrum.variations[index] - minMaxVariation[0]) / Math.abs(minMaxVariation[1] - minMaxVariation[0]) * height_divided;

					ctx.moveTo(x + 1, (y + height_divided) - valueMoved);

					var nbValuesAvailable = (curSpectrum.variations.length > nbValuesPerSpectrum - 1) ? nbValuesPerSpectrum - 1 : curSpectrum.variations.length - 1;
					var j = 0;

					for (var i = (curSpectrum.variations.length - nbValuesAvailable); i < curSpectrum.variations.length; ++i) {

						valueMoved = (curSpectrum.variations[i] - minMaxVariation[0]) / Math.abs(minMaxVariation[1] - minMaxVariation[0]) * height_divided;

						ctx.lineTo(x + (j * width_divided / nbValuesAvailable), (y + height_divided) - valueMoved);

						j++;
					}

					ctx.stroke();
					ctx.closePath();
				}
			}

			// Dessin de la légende
			ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
			ctx.fillRect(x + 1, y + 1, 120, 30);

			ctx.font = '14px Georgia';
			ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
			var str = AudioManager.humanAudibleSpectrumTable[spectrumIndex][0] + ' - ' + AudioManager.humanAudibleSpectrumTable[spectrumIndex][1] + 'Hz';
			ctx.fillText(str, x + 5, y + 20);

			ctx.font = '12px Georgia';
			ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
			var str = 'Min :' + minMaxVariation[0].toFixed(2) + '; Max :' + minMaxVariation[1].toFixed(2);
			ctx.fillText(str, x + width_divided - 150, y + 20);

			// Dessin de la barre verticale
			drawLine(ctx, [x, y], [x, y + height_divided], 'white');

			// Changement de cases
			if (spectrumIndex % nbSpectrum_2 == nbSpectrum_2 - 1) {

				x = 0;
				y += height_divided;
				drawLine(ctx, [0, y], [w, y], 'white');

			} else {

				x += width_divided;

			}
		}
	}
}

function renderAverageFrequency(ctx, width, height) {
	
	var averageFrequencies = AudioManager.getAverageFrequency();
	var width_divided = width / 4;
	var height_divided = height * 0.2;
	var nbValues = 125;
	var x = 3 * width_divided, y = height_divided;
	var min = 0, max = 128;
	
	ctx.strokeStyle = "red";
	ctx.beginPath();

	var index = 0;
	if (averageFrequencies.length >= nbValues) {

		index = averageFrequencies.length - 1 - nbValues - 1;

	}

	var valueMoved = (averageFrequencies[index] - min) / Math.abs(min - max) * height_divided;

	ctx.moveTo(x + 1, (y + height_divided) - valueMoved);

	var nbValuesAvailable = (averageFrequencies.length > nbValues - 1) ? nbValues - 1 : averageFrequencies.length - 1;
	var j = 0;

	for (var i = (averageFrequencies.length - nbValuesAvailable); i < averageFrequencies.length; ++i) {

		valueMoved = (averageFrequencies[i] - min) / Math.abs(min - max) * height_divided;

		ctx.lineTo(x + (j * width_divided / nbValuesAvailable), (y + height_divided) - valueMoved);

		j++;
	}

	ctx.stroke();
	ctx.closePath();
	
}

function drawLine(ctx, start, end, color) {

	if (color)
		ctx.strokeStyle = color;

	ctx.beginPath();
	ctx.moveTo(start[0], start[1]);
	ctx.lineTo(end[0], end[1]);
	ctx.stroke();
	ctx.closePath();

}


function getMinMaxVariation(prev, cur, indexOfSpectrumData) {
	var min = Infinity;
	var max = -Infinity;
}

function minMaxInLastNumberIntoVariation(variations, number) {

	var minMaxVariation = [
		Infinity,
		-Infinity
	];

	var begin = 0;

	if (variations.length > number) {
		begin = variations.length - number;
	}

	var end = variations.length;

	for (var i = begin; i < end; ++i) {
		var value = variations[i];

		if (value < minMaxVariation[0])
			minMaxVariation[0] = value;

		if (value > minMaxVariation[1])
			minMaxVariation[1] = value;
	}

	return minMaxVariation;
}

function minMaxInLastNumberIntoVariationOfSpectrums(spectrums, number) {

	var minMaxVariation = [
		Infinity,
		-Infinity
	];

	for (var i = 0; i < spectrums.length; ++i) {
		var minMax = minMaxInLastNumberIntoVariation(spectrums.variation, number);

		if (minMax[0] < minMaxVariation[0])
			minMaxVariation[0] = minMax[0];

		if (minMax[1] > minMaxVariation[1])
			minMaxVariation[1] = minMax[1];
	}

	return minMaxVariation;
}

$(document).ready(function () {

	init();

});


function formatSecond(seconds) {
	var minutes = Math.floor(seconds / 60);
	seconds = Math.floor(seconds % 60);

	return ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
}