var TreeRing = function (angles) {
	this.angles = angles ? new THREE.Vector3(angles[0], angles[1], angles[2]) : new THREE.Vector3();
	this.radius = 0;
	this.maxRadius = 2; // TODO: Valeur à ajuster
	this.sectors = 32;

	this.absPos = new THREE.Vector3();
	this.absAngle = new THREE.Vector3();
};

TreeRing.prototype = {
	grow: function (deltaTime) {
		this.radius += 0.05 * (this.maxRadius - this.radius) * deltaTime;
	},

	updateAbsolutePos: function (pos, angle) {
		this.absPos = pos.clone();
		this.absAngle = angle.clone();
	},

	getVertices: function (height) {
		var vertices = [];
		var angle = 0;
		var inc = 2.0 * Math.PI / this.sectors;
		for (var i = 0; i < this.sectors; i++) {
			var vec = new THREE.Vector3(this.radius * Math.cos(angle), height, this.radius * Math.sin(angle));
			vec.applyEuler(this.eulerAngles());
			vertices[i] = [vec.x, vec.y, vec.z];
			angle += inc;
		}
		return vertices;
	},

	eulerAngles: function () {
		return new THREE.Euler().setFromVector3(this.angles, "YXZ");
	}
};