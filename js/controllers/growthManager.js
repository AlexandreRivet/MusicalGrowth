var GrowthManager = {
	begin: function () {
		this.tree = new Tree();

		this.factor = 1.0;
	},



	update: function (deltaTime) {

		AudioManager.computeFrequency();

		var avg = AudioManager.getAverageNormalisedVariation();
		this.factor += avg;

		DELTATIME_SPLIT += deltaTime;

		var peaks = AudioManager.currentStream.peaks;
		if (peaks && DELTATIME_SPLIT > TIME_BETWEEN_TWO_SPLIT) {

			var time = AudioManager.getTimeMusic();
			var sampleRate = AudioManager.currentStream.buffer.sampleRate;

			var oldPeak;
			for (var i = 0; i < peaks.length; i++) {

				var currentPeak = peaks[i] / sampleRate;

				if (currentPeak > time)
					break;

				oldPeak = peaks[i];
			}

			this.tree.splitActiveBranches(2);
			DELTATIME_SPLIT = 0;

		}



		this.tree.grow(deltaTime, (this.factor < 0) ? 0 : this.factor / 2500);
		this.tree.render();

		RenderingManager.orbit.target.copy(this.tree.getCameraData());
		RenderingManager.orbit.update();
	},

	randomGrowthAngle: function () {
		return [Math.random(), 0, Math.random()];
	}
};