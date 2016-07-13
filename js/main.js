function init() {
	AudioManager.begin();
	AudioManager.setFFTSize(2048);
	AudioManager.setSmoothingTimeConstant(0.8);

	ResourceManager.begin();
	ResourceManager.addResource('Lucidity', 'musics/Lucidity (Dan Negovan Remix).mp3', ResourceType.MUSIC);
	//ResourceManager.addResource('DJ Sona Ethereal', 'musics/DJ Sona Ethereal (Nosaj Thing x Pretty Lights).mp3', ResourceType.MUSIC);
	ResourceManager.run(function (percent) {
		progress(percent);
	}, null, finished);

	RenderingManager.initScene();
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

	$('#intro').hide();
	$('#main').show();
	$('#music-name').html(AudioManager.currentStream.name);

	AudioManager.togglePlayPause();
	GrowthManager.begin();
	render();
}

function render() {

	requestAnimationFrame(render);

	var time = Date.now() * 0.001;
	var deltaTime = lastTime ? time - lastTime : 1;
	GrowthManager.update(deltaTime);
	lastTime = time;

	RenderingManager.render();

	// Mise à jour temps musique
	var duration = AudioManager.currentStream.buffer.duration;
	var currentTimeMusic = (AudioManager.audioCtx.currentTime - AudioManager.startTime) % duration;
	$('#music-time').html(formatSecond(currentTimeMusic) + ' / ' + formatSecond(duration));

}

$(document).ready(function () {

	init();

});


function formatSecond(seconds) {
	var minutes = Math.floor(seconds / 60);
	seconds = Math.floor(seconds % 60);

	return ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
}
