const TREE_SHADER = {
	uniforms: {
		"uDirLightPos":	{ type: "v3", value: new THREE.Vector3() },
		"uDirLightColor": { type: "c", value: new THREE.Color( 0xffffff ) },
		uKd: {
			type: "f",
			value: 0.7
		},
		uBorder: {
			type: "f",
			value: 0.4
		}
	},

	vertexShader: [
		"varying vec3 vNormal;",
		"varying vec3 vViewPosition;",
		"varying vec3 vColor;",

		"void main() {",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
			"vNormal = normalize( normalMatrix * normal );",
			"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
			"vViewPosition = -mvPosition.xyz;",
			"vColor = color;",
		"}"

	].join("\n"),

	fragmentShader: [
		"uniform vec3 uDirLightPos;",
		"uniform vec3 uDirLightColor;",

		"uniform float uKd;",
		"uniform float uBorder;",

		"varying vec3 vNormal;",
		"varying vec3 vViewPosition;",
		"varying vec3 vColor;",

		"void main() {",
			// compute direction to light
			"vec4 lDirection = viewMatrix * vec4( uDirLightPos, 0.0 );",
			"vec3 lVector = normalize( lDirection.xyz );",

			// diffuse: N * L. Normal must be normalized, since it's interpolated.
			"vec3 normal = normalize( vNormal );",
			//was: "float diffuse = max( dot( normal, lVector ), 0.0);",
			// solution
			"float diffuse = dot( normal, lVector );",
			"if ( diffuse > 0.6 ) { diffuse = 1.0; }",
			"else if ( diffuse > -0.2 ) { diffuse = 0.7; }",
			"else { diffuse = 0.3; }",

			"gl_FragColor = vec4( uKd * vColor * uDirLightColor * diffuse, 1.0 );",
		"}"
	].join("\n")
}

const ZEROVEC = new THREE.Vector3();

var RenderingManager = {
	treeMaterial: function () {
		if (!this._treeMaterial) {
            // MATERIALS
                var light = this.directionLight;

				var shader = TREE_SHADER;

				var u = THREE.UniformsUtils.clone(shader.uniforms);

				var vs = shader.vertexShader;
				var fs = shader.fragmentShader;

				var material = new THREE.ShaderMaterial({
					uniforms: u,
					vertexShader: vs,
					fragmentShader: fs,
					vertexColors: THREE.VertexColors
				});

				material.uniforms.uDirLightPos.value = light.position;
				material.uniforms.uDirLightColor.value = light.color;

				this._treeMaterial = material;
				this._treeMaterial.side = THREE.DoubleSide;
		}

		return this._treeMaterial;
	},

	initScene: function () {
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 20000 );
		this.camera.position.z = 30;
		this.camera.position.y = 30;

		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( this.renderer.domElement );

		this.orbit = new THREE.OrbitControls( this.camera, this.renderer.domElement );

		this.directionLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.directionLight.position.set(320, 390, 700);
		this.scene.add( this.directionLight );

        //Skybox
        //var texture = THREE.ImageUtils.loadTexture( 'images/dayfair_skydome_1.jpg', THREE.UVMapping);
        var texture = THREE.ImageUtils.loadTexture( 'images/skydowSwag.jpg', THREE.UVMapping);
        var mesh = new THREE.Mesh( new THREE.SphereGeometry( 5000, 60, 40 ), new THREE.MeshBasicMaterial( { map: texture } ) );
				mesh.scale.x = -1;
				this.scene.add( mesh );
        
       //--------Particule-------------------------------------------------------------------
        // create the particle variables
        this.particleCount = 10000,
            this.particles = new THREE.Geometry(),
            pMaterial = new THREE.ParticleBasicMaterial({
                color: 0xFFFFFF,
                size: 3,
                map: THREE.ImageUtils.loadTexture(
                    "images/particle.png"
                ),
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: false
            });

        // now create the individual particles
        for(var p = 0; p < this.particleCount; p++) {

            // create a particle with random
            // position values, -250 -> 250
            var pX = Math.random() * 1000 - 500,
                pY = Math.random() * 1000,
                pZ = Math.random() * 1000 - 500,
                particle = new THREE.Vector3(pX, pY, pZ);
                
            // create a velocity vector
            particle.velocity = new THREE.Vector3(
                0,				// x
                -Math.random(),	// y
                0);				// z

            // add it to the geometry
            this.particles.vertices.push(particle);
        }

        // create the particle system
        this.particleSystem = new THREE.ParticleSystem(
            this.particles,
            pMaterial);

        this.particleSystem.sortParticles = true;

        // add it to the scene
        this.scene.add(this.particleSystem);
        
        //--------------------------------------------------------------------------------------

        var geometry = new THREE.PlaneGeometry( 10000, 10000, 32 );
        var material = new THREE.MeshBasicMaterial( {color: 0x24201d, side: THREE.DoubleSide} );
        var plane = new THREE.Mesh( geometry, material );
        plane.rotation.x += Math.PI/2;
        plane.position.y += 2.0;
        this.scene.add( plane );

		var self = this;


		window.addEventListener( 'resize', function () {

			self.camera.aspect = window.innerWidth / window.innerHeight;
			self.camera.updateProjectionMatrix();

			self.renderer.setSize( window.innerWidth, window.innerHeight );

		}, false );
	},

	render: function () {
		 this.renderer.render(this.scene, this.camera);
        // animation loop
		
		// add some rotation to the system
		this.particleSystem.rotation.y += 0.001;
	   
	}
};
