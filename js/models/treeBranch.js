var TreeBranch = function (lastRing, startingAngles) {
	this.children = []; // Branches born from this one
	this._fragments = [new TreeFragment(lastRing, startingAngles)];
	this.canGrow = true;
	this.height = 0;
	this.maxHeight = 4.8 * 8.0;
};

TreeBranch.prototype = {
	grow: function (deltaTime, factor) {
		var offset = this._fragments[0].bottomRing.absPos.clone();
		var rotation = this._fragments[0].bottomRing.absAngle.clone();

		for (var i = 0; i < this._fragments.length; i++) {
			this._fragments[i].grow(deltaTime, factor);

			rotation.add(this._fragments[i].topRing.angles);
			offset.add(new THREE.Vector3(0, this._fragments[i].height, 0).applyEuler(this._fragments[i].topRing.eulerAngles()));

			this._fragments[i].topRing.updateAbsolutePos(offset, rotation);
		}

		if (!this.canGrow)
			return;

		var lastFragment = this.getLastFragment();
		if (lastFragment.height > 0.8 * lastFragment.maxHeight) {
			var newFragment = this._appendFragment(GrowthManager.randomGrowthAngle());

			rotation.add(newFragment.topRing.angles);
			offset.add(new THREE.Vector3(0, newFragment.height, 0).applyEuler(newFragment.topRing.eulerAngles()));

			newFragment.topRing.updateAbsolutePos(offset, rotation);
		}


		// Compute la taille d'une branche
		/*
		this.height = 0.0;
		for (var i = 0; i < this._fragments.length; i++) {
			this.height += this._fragments[i].height;
		}

		if (this.height > this.maxHeight)
			this.canGrow = false;
		*/

	},

	render: function () {
		for (var i = 0; i < this._fragments.length; i++) {
			this._fragments[i].render();
		}
	},

	appendChildBranches: function (amount, angles) {
		var topRing = this.getLastFragment().topRing;
		var newBranches = [];
		for (var i = 0; i < amount; i++) {
			var newBranch = new TreeBranch(topRing, angles ? angles[i] : GrowthManager.randomGrowthAngle());
			newBranches.push(newBranch);
		}
		this.children = this.children.concat(newBranch);
		return newBranches;
	},

	_appendFragment: function (angle) {
		var newFragment = new TreeFragment(this.getLastFragment().topRing, angle);
		this._fragments.push(newFragment);
		return newFragment;
	},

	getMeshes: function () {
		var meshes = [];
		for (var i = 0; i < this._fragments.length; i++) {
			meshes.push(this._fragments[i].mesh);
		}
		return meshes;
	},

	getLastFragment: function () {
		return this._fragments[this._fragments.length - 1];
	}
};