
function initScene () {
	RenderingManager.initScene();
	GrowthManager.begin();

	setupDatGui();
}

function setupDatGui () {
	var gui = new dat.GUI();

	var folder = gui.addFolder( "General Options" );
}

var lastTime;
function render () {
	requestAnimationFrame( render );

	var time = Date.now() * 0.001;
	var deltaTime = lastTime ? time - lastTime : 1;
	GrowthManager.update(deltaTime);
	lastTime = time;

	RenderingManager.render(deltaTime);
};

initScene();
render();
