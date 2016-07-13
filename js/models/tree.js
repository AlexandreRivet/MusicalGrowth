var Tree = function () {
	this.trunk = new TreeBranch();
	this.activeBranches = [this.trunk];
	this._allBranches = [this.trunk];
	this._cameraPos = new THREE.Vector3();
};

Tree.prototype = {
	grow: function (deltaTime, factor) {
		for (var i = 0; i < this._allBranches.length; i++) {
			this._allBranches[i].grow(deltaTime, factor);
		}

		/*
		if (DELTATIME_SPLIT > TIME_BETWEEN_TWO_SPLIT) {
			this.checkDeadBranchs();
		}
		*/

	},

	render: function () {
		for (var i = 0; i < this._allBranches.length; i++) {
			this._allBranches[i].render();
		}
	},

	checkDeadBranchs: function () {
		var newActiveBranches = [];
		var oldCanGrowBranches = [];
		for (var i = 0; i < this.activeBranches.length; i++) {

			if (this.activeBranches[i].canGrow) {
				oldCanGrowBranches.push(this.activeBranches[i]);
				continue;
			}

			var newBranches = this.activeBranches[i].appendChildBranches(2, undefined);
			newActiveBranches = newActiveBranches.concat(newBranches);
		}

		if (newActiveBranches.length > 0) {

			this.activeBranches = newActiveBranches;
			this.activeBranches.concat(oldCanGrowBranches);
			this._allBranches = this._allBranches.concat(newActiveBranches);

			DELTATIME_SPLIT = 0;
		}

	},

	splitActiveBranches: function (branchAmount, angles) {
        
        if (this.activeBranches.length > 15)
            return;
        
		var newActiveBranches = [];
		for (var i = 0; i < this.activeBranches.length; i++) {
			var newBranches = this.activeBranches[i].appendChildBranches(branchAmount || 2, angles);
			newActiveBranches = newActiveBranches.concat(newBranches);
		}
		this.activeBranches = newActiveBranches;
		this._allBranches = this._allBranches.concat(newActiveBranches);
	},

	getMeshes: function () {
		var meshes = [];
		for (var i = 0; i < this._allBranches.length; i++) {
			meshes = meshes.concat(this._allBranches[i].getMeshes());
		}
		return meshes;
	},

	getCameraData: function () {
		var len = this.activeBranches.length;
		if (len > 0) {
			this._cameraPos.set(0, 0, 0);
			for (var i = 0; i < len; i++) {
				this._cameraPos.add(this.activeBranches[i].getLastFragment().topRing.absPos);
			}
			this._cameraPos.multiplyScalar(1 / len);
		}
		return this._cameraPos;
	}
};