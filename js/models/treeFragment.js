var TreeFragment = function (bottomRing, angles) {
	this.height = 0;
	this.maxHeight = 8; // TODO: Valeur à ajuster, peut être pas nécessaire

	this.bottomRing = bottomRing || new TreeRing();
	this.topRing = new TreeRing(angles);

	this._buildMesh();
};

TreeFragment.prototype = {
	grow: function (deltaTime, factor) {

		if (this.height < this.maxHeight) {
			this.height += factor * deltaTime;
			if (this.height >= this.maxHeight)
				this.height = this.maxHeight;
		}

		this.bottomRing.grow(deltaTime);
		this.topRing.grow(deltaTime);
	},

	render: function () {
		this._updateGeometry();
	},

	_buildMesh: function () {
		this._geometry = new THREE.BufferGeometry();
		this._positionAttribute = new THREE.BufferAttribute([], 3);
		this._indexAttribute = new THREE.BufferAttribute([], 1);
		this._normalAttribute = new THREE.BufferAttribute([], 3);
		this._textureAttribute = new THREE.BufferAttribute([], 2);
		this._colorAttribute = new THREE.BufferAttribute([], 3);
		this._geometry.addAttribute('position', this._positionAttribute);
		this._geometry.setIndex(this._indexAttribute);
		this._geometry.addAttribute('normal', this._normalAttribute);
		this._geometry.addAttribute('uv', this._textureAttribute);
		this._geometry.addAttribute('color', this._colorAttribute);

		this.mesh = new THREE.Mesh(this._geometry, RenderingManager.treeMaterial());
		RenderingManager.scene.add(this.mesh);
	},

	_updateGeometry: function () {
		var obj = this._getTriangles();

		this.mesh.position.copy(this.bottomRing.absPos);

		this._positionAttribute.array = obj.vertices;
		this._positionAttribute.needsUpdate = true;
		this._normalAttribute.array = obj.normals;
		this._normalAttribute.needsUpdate = true;
		if (this._indexAttribute.array.length != obj.indices.length) {
			this._indexAttribute.array = obj.indices;
			this._indexAttribute.needsUpdate = true;
			this._textureAttribute.array = obj.uv;
			this._textureAttribute.needsUpdate = true;
			this._colorAttribute.array = obj.colors;
			this._colorAttribute.needsUpdate = true;
		}

		this._geometry.boundingSphere = new THREE.Sphere(ZEROVEC, Math.max(this.topRing.radius * this.height, this.bottomRing.radius * this.height, this.height));
	},

	_getTriangles: function () {
		var vertices1 = this.bottomRing.getVertices(0);
		var vertices2 = this.topRing.getVertices(this.height);
		var len1 = vertices1.length;
		var len2 = vertices2.length;

		var vertCount = len1 + len2;
		var vertices = new Float32Array(3 * vertCount);
		var indices = new Uint32Array(3 * vertCount);
		var normals = new Float32Array(3 * vertCount);
		var uv = new Float32Array(2 * vertCount);
		var colors = new Float32Array(3 * vertCount);

		for (var i = 0; i < len1; i++) {
			vertices[6 * i + 0] = vertices1[i][0];
			vertices[6 * i + 1] = vertices1[i][1];
			vertices[6 * i + 2] = vertices1[i][2];

			vertices[6 * i + 3] = vertices2[i][0];
			vertices[6 * i + 4] = vertices2[i][1];
			vertices[6 * i + 5] = vertices2[i][2];

			indices[6 * i + 0] = (2 * i + 2) % vertCount;
			indices[6 * i + 1] = (2 * i + 3) % vertCount;
			indices[6 * i + 2] = (2 * i + 1) % vertCount;

			indices[6 * i + 3] = (2 * i + 1) % vertCount;
			indices[6 * i + 4] = (2 * i + 0) % vertCount;
			indices[6 * i + 5] = (2 * i + 2) % vertCount;

			normals[6 * i + 0] = vertices1[i][0] / (this.bottomRing.radius || 1);
			normals[6 * i + 1] = vertices1[i][1] / (this.bottomRing.radius || 1);
			normals[6 * i + 2] = vertices1[i][2] / (this.bottomRing.radius || 1);

			normals[6 * i + 3] = vertices2[i][0] / (this.topRing.radius || 1);
			normals[6 * i + 4] = vertices2[i][1] / (this.topRing.radius || 1);
			normals[6 * i + 5] = vertices2[i][2] / (this.topRing.radius || 1);

			uv[4 * i + 0] = i / len1;
			uv[4 * i + 1] = 0.0;

			uv[4 * i + 2] = i / len1;
			uv[4 * i + 3] = 1.0;

			// Trunk color: 0x53350A
			colors[6 * i + 0] = 0.33;
			colors[6 * i + 1] = 0.21;
			colors[6 * i + 2] = 0.04;

			colors[6 * i + 3] = 0.33;
			colors[6 * i + 4] = 0.21;
			colors[6 * i + 5] = 0.04;
		}

		return {
			vertices: vertices,
			indices: indices,
			normals: normals,
			uv: uv,
			colors: colors
		};
	},

	getCenter: function () {
		var center = this.bottomRing.absPos.clone();
		center.addScaledVector(this.topRing.absPos, 0.5);
		return center;
	}
};