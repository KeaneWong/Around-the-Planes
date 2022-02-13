

var Colors = {
	red:0xf25346,
	white:0xd8d0d1,
	brown:0x59332e,
	pink:0xF5986E,
	brownDark:0x23190f,
	blue:0x68c3c0,
	wood:0x765c48,
	DarkPurple: 0x5D3FD3,
	lightPurple: 0xBF40BF,
	orchid: 0xDA70D6,
	mossGreen: 0x8A9A5B,
	oliveGreen: 0x808000,
	nightSky: 0x7b8993,
	nightSkyGradient:0x855988
};






var scene,
		camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
        renderer, container;
function createScene()
{
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;


    scene = new THREE.Scene();


	scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
	
	// Create the camera
	aspectRatio = WIDTH / HEIGHT;
	fieldOfView = 60;
	nearPlane = 1;
	farPlane = 10000;
	camera = new THREE.PerspectiveCamera(
		fieldOfView,
		aspectRatio,
		nearPlane,
		farPlane
		);
	
	// Set the position of the camera
    camera.position.x = 0;
	camera.position.z = 200;
    camera.position.y = 100;
    // Create the renderer
	renderer = new THREE.WebGLRenderer({ 
		// Allow transparency to show the gradient background
		// we defined in the CSS
		alpha: true, 

		// Activate the anti-aliasing; this is less performant,
		// but, as our project is low-poly based, it should be fine :)
		antialias: true 
	});

	// Define the size of the renderer; in this case,
	// it will fill the entire screen
	renderer.setSize(WIDTH, HEIGHT);
	
	// Enable shadow rendering
	renderer.shadowMap.enabled = true;
	
	// Add the DOM element of the renderer to the 
	// container we created in the HTML
	container = document.getElementById('world');
	container.appendChild(renderer.domElement);
	

	// Listen to the screen: if the user resizes it
	// we have to update the camera and the renderer size
	window.addEventListener('resize', handleWindowResize, false);

}

function handleWindowResize() {
	// update height and width of the renderer and the camera
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	renderer.setSize(WIDTH, HEIGHT);
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
}
var hemisphereLight, shadowLight;

function createLights() {
	// A hemisphere light is a gradient colored light; 
	// the first parameter is the sky color, the second parameter is the ground color, 
	// the third parameter is the intensity of the light
	hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)
	
	// A directional light shines from a specific direction. 
	// It acts like the sun, that means that all the rays produced are parallel. 
	shadowLight = new THREE.DirectionalLight(0xffffff, .9);

	// Set the direction of the light  
	shadowLight.position.set(150, 350, 350);
	
	// Allow shadow casting 
	shadowLight.castShadow = true;

	// define the visible area of the projected shadow
	shadowLight.shadow.camera.left = -400;
	shadowLight.shadow.camera.right = 400;
	shadowLight.shadow.camera.top = 400;
	shadowLight.shadow.camera.bottom = -400;
	shadowLight.shadow.camera.near = 1;
	shadowLight.shadow.camera.far = 1400;

	// define the resolution of the shadow; the higher the better, 
	// but also the more expensive and less performance
	shadowLight.shadow.mapSize.width = 2048;
	shadowLight.shadow.mapSize.height = 2048;

	// an ambient light modifies the global color of a scene and makes the shadows softer
	ambientLight = new THREE.AmbientLight(0xdc8874, .5);//original from example
	scene.add(ambientLight);

	// to activate the lights, just add them to the scene
	scene.add(hemisphereLight);  
	scene.add(shadowLight);
}

var SunCycleCount=0;
const BackgroundLightDay = new THREE.Color(0xdc8874);
const BackgroundLightNight = new THREE.Color(Colors.nightSky);
function UpdateSunCycle()  {
	shadowLight.position.set(150*Math.cos(SunCycleCount),350*Math.cos(SunCycleCount),315);
	shadowLight.intensity =(0.6 + .3*Math.sin(3.14*shadowLight.position.y/350));
	hemisphereLight.intensity = (0.6 + .3*Math.sin(3.14*shadowLight.position.y/350));
	//Ambient Light: change color to a more purple hue and reduce intensity as y position goes to 0, then stay low until
	//y position is no longer negative 
	ambientLight.intensity = (0.3 + .2*Math.sin(3.14*shadowLight.position.y/350));
	ambientLight.color.lerpColors(BackgroundLightNight, BackgroundLightNight, 0.5-0.5*Math.sin(-3.14*shadowLight.position.y/350));
	SunCycleCount+=0.003;
	if(SunCycleCount >= 62.8318530718)//resetting because I was originally an C and assembly programmer and paranoid about overflow
	{
		SunCycleCount = 0;
	}
	var setGradientTop = lerpColor('#7b8993', '#e4e0ba', 0.5-0.5*Math.sin(-3.14*shadowLight.position.y/350));
	var setGradientBottom = lerpColor('#855988','#f7d9aa', 0.5-0.5*Math.sin(-3.14*shadowLight.position.y/350));
	document.getElementById("gameholder").style.background = 'linear-gradient(' + setGradientTop + ',' + setGradientBottom+')';


	function lerpColor(a, b, amount) 
	{ 
    	var ah = parseInt(a.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        bh = parseInt(b.replace(/#/g, ''), 16),
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);
    	return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
	}

}

// First let's define a Sea object :
Sea = function(){
	var geom = new THREE.CylinderBufferGeometry(600,600,800,40,10);
	geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

	// important: by merging vertices we ensure the continuity of the waves
	//geom.mergeVertices();

	//console.log(geom);

	// get the vertices
	var l = geom.attributes.position.array.length;

	// create an array to store new data associated to each vertex
	this.waves = [];
	var i = 0 ;
	while( i < l){
		// get each vertex
		//var v = geom.vertices[i];

		this.waves.push({
			x:geom.attributes.position.array[i++],
			y:geom.attributes.position.array[i++],
			z:geom.attributes.position.array[i++],
			//random angle to send the wave
			ang: Math.random()*Math.PI*2,
			//random distance to send it
			amp:5 + Math.random()*15,
			//random speed to move the wave every frame between .016 and .048 rad/frame
			speed: 0.016 + Math.random() * 0.032
		});
	};
	var mat = new THREE.MeshPhongMaterial({
		color:Colors.blue,
		transparent:true,
		opacity:.8
		//shading:THREE.FlatShading,
	});
	mat.flatShading = true;

	this.mesh = new THREE.Mesh(geom, mat);
	this.mesh.receiveShadow = true;

}

// now we create the function that will be called in each frame 
// to update the position of the vertices to simulate the waves

Sea.prototype.moveWaves = function (){
	
	// get the vertices
	var verts = this.mesh.geometry.attributes.position.array;
	var l = this.waves.length;
	var i = 0;
	while(i<l){

		// get the data associated to it
		var vprops = this.waves[i];
		// update the position of the vertex
		//verts[i++] = vprops.x + Math.cos(vprops.ang)*vprops.amp;
		//verts[i++] = vprops.y + Math.sin(vprops.ang)*vprops.amp;
		//console.log(this.mesh.geometry.attributes.position.array[0]);
		this.mesh.geometry.attributes.position.array[i++] = vprops.x + Math.cos(vprops.ang)*vprops.amp;
		this.mesh.geometry.attributes.position.array[i++] = vprops.y + Math.sin(vprops.ang)*vprops.amp;
		i++;											//the 'z' component that we're skipping

		// increment the angle for the next frame
		vprops.ang += vprops.speed;

	}

	// Tell the renderer that the geometry of the sea has changed.
	// In fact, in order to maintain the best level of performance, 
	// three.js caches the geometries and ignores any changes
	// unless we add this line
	//console.log(this.mesh.geometry.verticesNeedUpdate);
	this.mesh.geometry.attributes.position.needsUpdate=true;


	if(idle)
	{
		sea.mesh.rotation.z += .0035;
	}
	else
	{
		sea.mesh.rotation.z += .005;	
	}
	
}

// Instantiate the sea and add it to the scene:

var sea;

function createSea(){
	sea = new Sea();

	// push it a little bit at the bottom of the scene
	sea.mesh.position.y = -600;

	// add the mesh of the sea to the scene
	scene.add(sea.mesh);
}

Cloud = function(){
	// Create an empty container that will hold the different parts of the cloud
	this.mesh = new THREE.Object3D();
	
	// create a cube geometry;
	// this shape will be duplicated to create the cloud
	var geom = new THREE.BoxGeometry(20,20,20);
	
	// create a material; a simple white material will do the trick
	var mat = new THREE.MeshPhongMaterial({
		color:Colors.white,  
	});
	
	// duplicate the geometry a random number of times
	var nBlocs = 3+Math.floor(Math.random()*3);
	for (var i=0; i<nBlocs; i++ ){
		
		// create the mesh by cloning the geometry
		var m = new THREE.Mesh(geom, mat); 
		
		// set the position and the rotation of each cube randomly
		m.position.x = i*15;
		m.position.y = Math.random()*10;
		m.position.z = Math.random()*10;
		m.rotation.z = Math.random()*Math.PI*2;
		m.rotation.y = Math.random()*Math.PI*2;
		
		// set the size of the cube randomly
		var s = .1 + Math.random()*.9;
		m.scale.set(s,s,s);
		
		// allow each cube to cast and to receive shadows
		m.castShadow = true;
		m.receiveShadow = true;
		
		// add the cube to the container we first created
		this.mesh.add(m);
	} 
}

// Define a Sky Object
Sky = function(){
	// Create an empty container
	this.mesh = new THREE.Object3D();
	
	// choose a number of clouds to be scattered in the sky
	this.nClouds = 20;
	
	// To distribute the clouds consistently,
	// we need to place them according to a uniform angle
	var stepAngle = Math.PI*2 / this.nClouds;
	
	// create the clouds
	for(var i=0; i<this.nClouds; i++){
		var c = new Cloud();
	 
		// set the rotation and the position of each cloud;
		// for that we use a bit of trigonometry
		var a = stepAngle*i; // this is the final angle of the cloud
		var h = 750 + Math.random()*200; // this is the distance between the center of the axis and the cloud itself

		// Trigonometry!!! I hope you remember what you've learned in Math :)
		// in case you don't: 
		// we are simply converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
		c.mesh.position.y = Math.sin(a)*h;
		c.mesh.position.x = Math.cos(a)*h;

		// rotate the cloud according to its position
		c.mesh.rotation.z = a + Math.PI/2;

		// for a better result, we position the clouds 
		// at random depths inside of the scene
		c.mesh.position.z = -400-Math.random()*400;
		
		// we also set a random scale for each cloud
		var s = 1+Math.random()*2;
		c.mesh.scale.set(s,s,s);

		// do not forget to add the mesh of each cloud in the scene
		this.mesh.add(c.mesh);  
	}  
}

// Now we instantiate the sky and push its center a bit
// towards the bottom of the screen

var sky;

function createSky(){
	sky = new Sky();
	sky.mesh.position.y = -600;
	scene.add(sky.mesh);
}

var AirPlane = function() {
	
	this.mesh = new THREE.Object3D();
	const geomHull = new THREE.Shape();
    geomHull.moveTo( 35,-25);
    geomHull.lineTo(-60,-25);  
	geomHull.moveTo(-60,-25);
	geomHull.lineTo(-60,-15);	
	geomHull.moveTo(-60,-15);
	geomHull.lineTo(-75,-15);	
	geomHull.moveTo(-75,-15);
	geomHull.lineTo(-75, 5);	
	geomHull.moveTo(-75, 5);
	geomHull.lineTo(-90, 5);	
	geomHull.moveTo(-90, 5);
	geomHull.lineTo(-90, 55);	
	geomHull.moveTo(-90, 55);
	geomHull.lineTo(-75, 55);
	geomHull.moveTo(-75, 55);
	geomHull.lineTo(-75, 45);
	geomHull.lineTo(-75, 45);
    geomHull.lineTo(-60, 45) ;
    geomHull.moveTo(-60, 45);
    geomHull.lineTo(-60, 30) ;
    geomHull.moveTo(-60, 30);
    geomHull.lineTo(-30, 30) ;   
	geomHull.moveTo(-30, 30);
	geomHull.lineTo( 35, 30);
	geomHull.moveTo( 35, 30);
    geomHull.lineTo( 35, 40);    
	geomHull.moveTo( 35, 40);
	geomHull.lineTo( 35,-25);
	const hullWidth = 50
	const extrudeSettingsHull = { depth: hullWidth, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
	const geometryHull = new THREE.ExtrudeGeometry( geomHull, extrudeSettingsHull );
	//console.log(geometryHull);
	var matHull = new THREE.MeshLambertMaterial({color:Colors.wood, shading:THREE.FlatShading});
	var hull = new THREE.Mesh(geometryHull, matHull);
	hull.castShadow = true;
	hull.receiveShadow = true;
	hull.translateZ(-(hullWidth/2));
	//console.log(hull);
	this.mesh.add(hull);

	const geomBow1 = new THREE.Shape();
	geomBow1.moveTo( 35, 40);
	geomBow1.lineTo( 60, 40);	
	geomBow1.moveTo( 60, 45);
	geomBow1.lineTo( 60,-20);	
	geomBow1.moveTo( 60,-20);
	geomBow1.lineTo( 35,-20);	
	geomBow1.moveTo( 35,-20);
	geomBow1.lineTo( 35, 40);	
	geomBow1.moveTo( 35, 40);
	const bow1Width = hullWidth*0.9;
	const extrudeSettingsBow1 = { depth: bow1Width, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
	const geometryBow1 = new THREE.ExtrudeGeometry(geomBow1, extrudeSettingsBow1);
	var bow1 = new THREE.Mesh(geometryBow1, matHull);
	bow1.castShadow = true;
	bow1.receiveShadow = true;
	bow1.translateZ(-(hullWidth/2));
	this.mesh.add(bow1);

	const geomBow2 = new THREE.Shape();
	geomBow2.moveTo( 60, 45);
	geomBow2.lineTo( 75, 45);	
	geomBow2.moveTo( 75, 45);
	geomBow2.lineTo( 75,-10);	
	geomBow2.moveTo( 75,-10);
	geomBow2.lineTo( 60,-10);	
	geomBow2.moveTo( 60,-10);
	geomBow2.lineTo( 60, 45);	
	geomBow2.moveTo( 60, 45);
	const bow2Width = hullWidth*0.75;
	const extrudeSettingsBow2 = { depth: bow2Width, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
	const geometryBow2 = new THREE.ExtrudeGeometry(geomBow2, extrudeSettingsBow2);
	var bow2 = new THREE.Mesh(geometryBow2, matHull);
	bow2.castShadow = true;
	bow2.receiveShadow = true;
	bow2.translateZ(-(hullWidth/2));
	this.mesh.add(bow2);

	const geomBow3 = new THREE.Shape();
    geomBow3.moveTo( 75, 50);
    geomBow3.lineTo( 90, 50);   
    geomBow3.moveTo( 90, 50);
    geomBow3.lineTo( 90, 5);   
    geomBow3.moveTo( 90, 5);
    geomBow3.lineTo( 75, 5);   
    geomBow3.moveTo( 75, 5);
    geomBow3.lineTo( 75, 50);   
    geomBow3.moveTo( 75, 50);
    const bow3Width = hullWidth*0.5;
    const extrudeSettingsBow3 = { depth: bow3Width, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
    const geometryBow3 = new THREE.ExtrudeGeometry(geomBow3, extrudeSettingsBow3);
    var bow3 = new THREE.Mesh(geometryBow3, matHull);
    bow3.castShadow = true;
    bow3.receiveShadow = true;
    bow3.translateZ(-(hullWidth/2));
    this.mesh.add(bow3);

	const geomBow4 = new THREE.Shape();
    geomBow4.moveTo( 90, 52);
    geomBow4.lineTo( 105, 52);   
    geomBow4.moveTo( 105, 52);
    geomBow4.lineTo( 105, 15);   
    geomBow4.moveTo( 105, 15);
    geomBow4.lineTo(  90, 15);   
    geomBow4.moveTo(  90, 15);
    geomBow4.lineTo( 90, 52);   
    geomBow4.moveTo( 90, 52);
    const bow4Width = hullWidth*0.25;
    const extrudeSettingsBow4 = { depth: bow4Width, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
    const geometryBow4 = new THREE.ExtrudeGeometry(geomBow4, extrudeSettingsBow4);
    var bow4 = new THREE.Mesh(geometryBow4, matHull);
    bow4.castShadow = true;
    bow4.receiveShadow = true;
    bow4.translateZ(-(hullWidth/2));
	this.mesh.add(bow4);


	//complete: Cabin box
	const geomCabin = new THREE.Shape();
	geomCabin.moveTo(30,30);
	geomCabin.lineTo(30,50);
	geomCabin.moveTo(30,50);
	geomCabin.lineTo(-20,50);
	geomCabin.moveTo(-20,50);
	geomCabin.lineTo(-20,30);
	geomCabin.moveTo(-20,30);
	geomCabin.lineTo(30,30);
	geomCabin.moveTo(30,30);
	const cabinWidth = 30
	const extrudeSettingsCabin = { depth: cabinWidth, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
	const geometryCabin = new THREE.ExtrudeGeometry(geomCabin,extrudeSettingsCabin);
	//var matCabin = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FLatShading});
	var cabin = new THREE.Mesh(geometryCabin, matHull);
	cabin.castShadow = true;
	cabin.receiveShadow = true;
	cabin.translateZ(-cabinWidth/2);
	this.mesh.add(cabin);
	

	// complete: mushroom
	
	const radiusTop = 12;
	const radiusBottom = 14;
	const mushHeight = 50;
	const radSegments = 6;
	const geomMushStem = new THREE.CylinderGeometry(radiusTop, radiusBottom, mushHeight, radSegments);
	const matMushStem = new THREE.MeshPhongMaterial({color: Colors.red, shading: THREE.FlatShading});
	var mushStem = new THREE.Mesh(geomMushStem, matMushStem);
	mushStem.castShadow = true;
	mushStem.receiveShadow = true;
	mushStem.translateY(55);
	mushStem.translateX(-40);
	//mushStem.translateZ(-radiusBottom);
	this.mesh.add(mushStem);
	

	
	const geomMushPoints = [];
	geomMushPoints.push( new THREE.Vector2( 0, 0 ));
	geomMushPoints.push( new THREE.Vector2( 0, 30 ));
	geomMushPoints.push( new THREE.Vector2( 20, 30 ))
	geomMushPoints.push( new THREE.Vector2( 30, 20 ));
	geomMushPoints.push( new THREE.Vector2( 40, 15 ));
	geomMushPoints.push( new THREE.Vector2( 40, 0 ));
	geomMushPoints.push( new THREE.Vector2( 33, -5 ));
	geomMushPoints.push( new THREE.Vector2( 27, -5 ));
	geomMushPoints.push( new THREE.Vector2( 27, 0 ));
	geomMushPoints.push( new THREE.Vector2( 0, 0 ));
	const geomMushCap = new THREE.LatheGeometry( geomMushPoints, 5,0, 2*3.14 );
	const matMushCap = new THREE.MeshBasicMaterial( { color: Colors.brownDark, shading: THREE.FlatShading} );
	this.mushCap = new THREE.Mesh( geomMushCap, matMushCap );
	this.mushCap.castShadow = true;
	this.mushCap.receiveShadow = true;
	this.mushCap.translateY(80);
	this.mushCap.translateX(-40);
	this.mushCap.translateZ(0);
	this.mesh.add( this.mushCap );
	
	// propeller
	var geomPropeller = new THREE.BoxGeometry(35,6,10,1,1,1);
	var matPropeller = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
	this.propeller = new THREE.Mesh(geomPropeller, matPropeller);

	this.propeller.castShadow = true;
	this.propeller.receiveShadow = true;
	// blades
	var geomBlade = new THREE.BoxGeometry(1,45,15,1,1,1);
	var matBlade = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
	
	var blade = new THREE.Mesh(geomBlade, matBlade);
	blade.position.set(-8,0,0);
	blade.castShadow = true;
	blade.receiveShadow = true;
	this.propeller.add(blade);
	this.propeller.position.set(-90,0,0);
	this.mesh.add(this.propeller);

};



var airplane;

function createPlane(){ 
	airplane = new AirPlane();
	airplane.mesh.scale.set(.25,.25,.25);
	airplane.mesh.position.y = 100;
	scene.add(airplane.mesh);
}


var mousePos = {x:0, y:0};
var clickPos = {x:0, y:0};

// now handle the mousemove event

function handleMouseMove(event) {

	// here we are converting the mouse position value received 
	// to a normalized value varying between -1 and 1;
	// this is the formula for the horizontal axis:
	
	var tx = -1 + (event.clientX / WIDTH)*2;

	// for the vertical axis, we need to inverse the formula 
	// because the 2D y-axis goes the opposite direction of the 3D y-axis
	
	var ty = 1 - (event.clientY / HEIGHT)*2;
	mousePos = {x:tx, y:ty};

}
var idle = true;
var idleAnimationCount = 0;
function handleClick(event) {
	if(idle == false)
	{
		//flag indicates that the idle animation is now on and that the boat must be put into a bobbing animation
		idle = true;
		idleAnimationCount = 0;
		clickPos.x = -1 + (event.clientX / WIDTH)*2;
		clickPos.y =  1 - (event.clientY / HEIGHT)*2;
	}
	else{
		idle = false;
		

	}
}


function followMouse(){
	var targetX = normalize(mousePos.x, -1, 1, -100, 100);
	var targetY = normalize(mousePos.y, -1, 1, 25, 175);
	

	return {targetX,targetY};
}


function idleAnimation(){
	var targetX = normalize(clickPos.x,-1,1,-100,100);
	var targetY = normalize(Math.sin(idleAnimationCount),-1,1,-15,15) + normalize(clickPos.y,-1,1,25,175);
	idleAnimationCount+= 0.01
	if(idleAnimationCount >= 62831.8)
	{
		idleAnimationCount = 0;
	}
	return {targetX, targetY};

	
}
function normalize(v,vmin,vmax,tmin, tmax){
	
	var nv = Math.max(Math.min(v,vmax), vmin);
	var dv = vmax-vmin;
	var pc = (nv-vmin)/dv;
	var dt = tmax-tmin;
	var tv = tmin + (pc*dt);
	return tv;

}


var flip = true;
var flipCount = 2*3.14;
const mushCapOriginalColor = new THREE.Color(Colors.mossGreen);
const mushCapChangeColor = new THREE.Color(Colors.oliveGreen);
function loop(){
	// Rotate the propeller, the sea and the sky
	//airplane.propeller.rotation.x += 0.3;
	//sea.mesh.rotation.z += .004;
	
	sea.moveWaves();
	if(idle)
	{
		sky.mesh.rotation.z+=.005;
	}
	else
	{
		sky.mesh.rotation.z += .008;
	}
	

	//update the sun
	UpdateSunCycle();

	// update the plane on each frame
	updatePlane();

	// render the scene
	renderer.render(scene, camera);


	// call the loop function again
	requestAnimationFrame(loop);

	function updatePlane(){
		if(idle == false)
		{
			targetCoord = followMouse();
			targetX = targetCoord.targetX;
			targetY = targetCoord.targetY;
		}
		else
		{
			targetCoord = idleAnimation();
			targetX = targetCoord.targetX;
			targetY = targetCoord.targetY;
		}
		
		// update the airplane's position, we use a different targetx and targety depending on whether we clicked or not
		// Move the plane at each frame by adding a fraction of the remaining distance
		airplane.mesh.position.y += (targetY-airplane.mesh.position.y)*0.035;
		airplane.mesh.position.x += (targetX-airplane.mesh.position.x)*0.07;
		// Rotate the plane proportionally to the remaining distance
		airplane.mesh.rotation.z = (targetY-airplane.mesh.position.y)*0.0090;
		airplane.mesh.rotation.x = (airplane.mesh.position.y-targetY)*0.0050;



		airplane.propeller.rotation.x += 0.4;

		if(flip)
		{
			flipCount += 0.02;	
			airplane.mushCap.scale.set(Math.sin(flipCount)/15+1, 1, Math.sin(flipCount)/15+1);	
			//airplane.mushCap.material.color.setHex(mushCapOriginalColor + flipCount*0x10);
			airplane.mushCap.material.color.lerpColors(mushCapOriginalColor, mushCapChangeColor , (1+Math.sin(flipCount))/2 );
			if(airplane.mushCap.position.y > 2*3.14)
			{
				flip = false;
			}
		}
		else
		{
			flipCount -= 0.02;
			airplane.mushCap.scale.set(Math.sin(flipCount)/15+1, 1 , Math.sin(flipCount)/15+1);
			//airplane.mushCap.material.color.setHex(mushCapOriginalColor + flipCount*0x10);
			airplane.mushCap.material.color.lerpColors(mushCapChangeColor ,mushCapOriginalColor , (1+Math.sin(flipCount))/2);
			if(airplane.mushCap.position.y < -2*3.14)
			{
				flip = true;
			}
		}
		
	}
	
}

function init()  
{

    //scene
    createScene();

    //lighting
    createLights();


    //objects
    createPlane();

    createSea();

    createSky();

	//add the listener
	document.addEventListener('mousemove', handleMouseMove, false);

	document.addEventListener('click', handleClick, false);



    //the loop that updates the objects per frame (i.e positions and animations)
    loop();
	
};

window.addEventListener('load', init, false);