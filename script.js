//Victor Plugin documentation http://victorjs.org/


const fps = 10;
const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext('2d');

let centerX;
let centerY;
let starScape;
let celestialBodies= [];

const g = 6.6743e-11; // Gravitational Constant
const au = 150000000; // One Astronomical unit is 150 million km REMEMBER TO CONVERT TO Meters WHEN NEEDED!!
const mindTerrestrialPlanetMass = 6e20;
const minGasGiantMass= 6e25;
const minStarMass = 2.3e27;

let vectorDisplayScale = 100;
let orbitalPathLength = 10000;
let orbitalPathPointDistance = 5;
let timeScale;
let pixelsPerAU = 100;
let distanceScale = au / pixelsPerAU; // 1 au / numb of pixels to represent 1 au

let mSun = 2e30;
let mEarth = 6e24;

let rightArrow = "<ion-icon name=\"caret-forward-outline\"></ion-icon>";
let leftArrow = "<ion-icon name=\"caret-back-outline\"></ion-icon>"

let settings = {
	paused: false,
	displayVectors: false,
	displayOrbitalPath: true
}

let spawnTool;
let deleteTool;
let preSetTool;

// ===== Classes ===== //

class StarScape {
	constructor() {
		this.stars = [];
		this.resizeStarScape();
	}
	resizeStarScape() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		centerX = canvas.width / 2;
		centerY = canvas.height / 2;

		this.starts = [];
		this.generateStars();

	}
	generateStars() {
		let n = canvas.width * canvas.height / 750;
		for (let i = 0; i < n; i++) {
			this.stars[i] = {
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				radius: Math.sqrt(Math.random() * 2),
				alpha: 1.0,
				decreasing: true,
				dRatio: Math.random() * 0.01
			};
		}
	}
	drawStarScape() {
		let stars = this.stars;

		ctx.save();
		ctx.fillStyle = "black"
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		for (let i = 0; i < stars.length; i++) {
			let star = stars[i];

			ctx.beginPath();
			ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
			ctx.closePath();
			ctx.fillStyle = "rgba(255, 255, 255, " + star.alpha + ")";

			if (star.decreasing == true) {
				star.alpha -= star.dRatio;
				if (star.alpha < 0.1) {
					star.decreasing = false;
				}
			} else {
				star.alpha += star.dRatio;
				if (star.alpha > 0.95) {
					star.decreasing = true;
				}
			}

			ctx.fill();
		}
		ctx.restore();
	}
	render() {
		this.drawStarScape();
	}
}

class Style {
	constructor(r = "255", g = "255", b = "255", hasAtmosphere = false) {
		this.r = r,
		this.g = g,
		this.b = b,
		this.radius = 0,
		this.hasAtmosphere = hasAtmosphere;
	}
	getRGB() {
		return `${this.r}, ${this.g}, ${this.b}`;
	}
	getDarkRGB() {
		return `${this.r - 50}, ${this.g - 50}, ${this.b - 50}`;
	}
}

class CelestialBody {
	constructor(name = "unnamed", mass = 1, x = centerX, y = centerY, vector = new Victor(0, 0), style = new Style()) {
		this.name = name,
		this.mass = mass,
		this.x = x,
		this.y = y,
		this.style = style,
		this.vector = vector,
		this.orbitalPath = [[this.x, this.y]],
		this.isSelected = false;
		this.updateRadius();
	}
	drawCircle(x, y, radius, style) {
		ctx.beginPath();
		ctx.fillStyle = style;
		ctx.strokeStyle = style;
		ctx.arc(x, y, radius, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.fill();
	}
	drawBody() {
		ctx.lineWidth = 0;
		if (this.mass < mindTerrestrialPlanetMass) { //Is Asteroid?
			this.drawAsteroid();
		} else if (this.mass <= minGasGiantMass) { //Is Terrestrial Planet?
			this.drawTerrestrialPlanet();
		} else if (this.mass <= 2.3e27) { //Is Gas Giant?
			this.drawGasGiant();
		} else { //Is Star?
			this.drawStar();
		}
		ctx.lineWidth = 1;
	}
	drawStar() {
		let rgb = this.style.getRGB(),
			radius = this.style.radius;
		ctx.shadowColor = `rgb(${rgb})`;
		ctx.shadowBlur = radius * 5;
		this.drawCircle(this.x, this.y, radius * 1.2, `rgba(${rgb}, 0.2)`);
		this.drawCircle(this.x, this.y, radius, `rgba(${rgb}, 0.5)`);
		this.drawCircle(this.x, this.y, radius * 0.8, `rgb(${rgb})`);
		this.drawCircle(this.x, this.y, radius * 0.8, `rgba( 255, 255, 255, 0.5)`);
		this.drawCircle(this.x, this.y, radius * 0.6, "white");
	}
	drawGasGiant() {
		let rgb = this.style.getRGB(),
			darkRbg = this.style.getDarkRGB(),
			radius = this.style.radius;
		this.drawCircle(this.x, this.y, radius * 1.1, `rgba(${rgb}, 0.3)`);
		this.drawCircle(this.x, this.y, radius, `rgb(${rgb})`);
		this.drawCircle(this.x, this.y, radius * 0.85, `rgba(${darkRbg}, 0.9)`);
		this.drawCircle(this.x, this.y, radius * 0.75, `rgba(255, 255, 255, 0.5)`);
		this.drawCircle(this.x, this.y, radius * 0.6, `rgb(${rgb})`);
		this.drawCircle(this.x, this.y, radius * 0.55, `rgb(255, 255, 255, 0.5)`);
		this.drawCircle(this.x, this.y, radius * 0.45, `rgba(${darkRbg}, 0.5)`);
		this.drawCircle(this.x, this.y, radius * 0.35, `rgba(${rgb}, 0.6)`);
		this.drawCircle(this.x, this.y, radius * 0.3, `rgba(${darkRbg}, 0.5)`);
	}
	drawTerrestrialPlanet() {
		let rgb = this.style.getRGB(),
			darkRbg = this.style.getDarkRGB(),
			radius = this.style.radius;
		this.style.hasAtmosphere && this.drawCircle(this.x, this.y, radius * 1.25, `rgba(${rgb}, 0.3)`);
		this.drawCircle(this.x, this.y, radius, `rgb(${rgb})`);
		this.drawCircle(this.x, this.y, radius * 0.8, `rgba(${darkRbg}, 0.15)`);
		this.drawCircle(this.x, this.y, radius * 0.6, `rgba(${darkRbg}, 0.15)`);
		this.drawCircle(this.x, this.y, radius * 0.4, `rgba(${darkRbg}, 0.15)`);
	}
	drawAsteroid() {
		let rgb = this.style.getRGB(),
			darkRbg = this.style.getDarkRGB(),
			radius = this.style.radius;
		this.drawCircle(this.x, this.y, radius, `rgb(${rgb})`);
		this.drawCircle(this.x, this.y, radius * 0.8, `rgba(${darkRbg}, 0.15)`);
		this.drawCircle(this.x, this.y, radius * 0.6, `rgba(${darkRbg}, 0.15)`);
		this.drawCircle(this.x, this.y, radius * 0.4, `rgba(${darkRbg}, 0.15)`);
	}
	drawVector(targetVector = this.vector) {
		let lineWidth = 3;
		let headlen = 10; // length of head in pixels
		let fromx = this.x,
			fromy = this.y,
			tox = ((targetVector.x * vectorDisplayScale) + this.x), 
			toy = ((targetVector.y * vectorDisplayScale)  + this.y);

		let dx = (tox - fromx);
		let dy = (toy - fromy);
		let angle = Math.atan2(dy, dx);

		ctx.save()
		ctx.beginPath();
		ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
		ctx.fillStyle = `rgba(255, 255, 255, 0.5)`;
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
		ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));	
		ctx.lineTo(tox, toy);
		ctx.stroke();
		ctx.fill();
		ctx.restore();
	}
	drawOrbitalPath() {
		let pointCount = this.orbitalPath.length;
		let startingOpacity = 0.5;
		let opacity = startingOpacity;
		let startPoint = [this.x, this.y];

		ctx.save();
		this.orbitalPath.forEach((coords) => {
			ctx.beginPath();
			ctx.strokeStyle = "rgba(255, 255, 255, " + opacity + ")";
			ctx.moveTo(startPoint[0], startPoint[1]);
			ctx.lineTo(coords[0], coords[1]);
			ctx.stroke();
			startPoint = coords;
			opacity -= startingOpacity / pointCount; 
		});
		ctx.restore();
	}
	drawSelected() {

		ctx.beginPath();
		ctx.lineWidth = 3;
		ctx.setLineDash([10, 5, 5, 5]);
		ctx.strokeStyle = `rgba(255, 0, 0, 0.5)`;
		ctx.arc(this.x, this.y, findBodyRadius(this.mass) + 10, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.lineWidth = 1;
		ctx.setLineDash([])
		
	}
	manageOrbitalPath() {
		if (Math.hypot(this.x - this.orbitalPath[0][0], this.y - this.orbitalPath[0][1]) >= orbitalPathPointDistance) { // If the distance since the last point is greater than a certain distance (orbitalPathPointDistance), record the current position
			this.orbitalPath.unshift([this.x, this.y])
			this.orbitalPath.length > orbitalPathLength && this.orbitalPath.pop();
		}
	}
	updateRadius() {
		this.style.radius = findBodyRadius(this.mass);
	}
	move() {
		this.manageOrbitalPath();
		this.x += this.vector.x;
		this.y += this.vector.y;
	}
	render() {
		ctx.save();
		settings.displayOrbitalPath && this.drawOrbitalPath();
		this.drawBody();
		this.isSelected && this.drawSelected();
		settings.displayVectors && this.drawVector();
		ctx.restore();
	}
	update() {
		this.render();
		this.move();
	}
}

class Tool {
	constructor() {
		this.isActive = false;
	}
	selectBody(event) {
		let clickRange = 25;
		let closestBody;
		let closestDistSqr;

		for (let i in celestialBodies) {
			let body = celestialBodies[i];
			body.isSelected = false;
			let distanceSqr = (Math.abs(event.clientX - body.x)**2 + Math.abs(event.clientY - body.y)**2);

			if (distanceSqr <= clickRange**2) {
				if (closestBody == undefined || distanceSqr > closestDistSqr) {
					closestBody = body;
					console.log("body close enough")
				}
			}
		}
		closestBody.isSelected = true;
		deleteTool.selectedBody = closestBody;
		deleteTool.handleDeleteMessage();
	}

}

class SpawnTool extends Tool {
	constructor() {
		super();
		this.mousePositionMode = false,
		this.previewOpacity = 0.8;
		this.clearValues();
		this.updateColorDisplay();
	}
	updateName() {
		this.name = document.getElementById("spawnName").value;
	}
	updatePosition() {
		this.x = parseFloat(document.getElementById("spawnXPos").value);
		this.y = parseFloat(document.getElementById("spawnYPos").value);
	}
	updateMass() {
		this.mass = parseFloat(document.getElementById("spawnMassDec").value) * 10 ** parseFloat(document.getElementById("spawnMassPow").value);
		if (this.mass >= mindTerrestrialPlanetMass && this.mass <minGasGiantMass) {
			this.canHaveAtmosphere = true;
		} else {
			this.canHaveAtmosphere = false;
		}
		this.handleAtmosphereCheckboxDisplay();
		updateRenderOnly();
	}
	updateVector() {
		let xPosFactor;
		let yPosFactor
		let angle = parseInt(document.getElementById("spawnVecDir").value);
		(angle > 90 && angle < 270) ? xPosFactor = -1 : xPosFactor = 1;
		//(angle > 180 && angle < 270) ? yPosFactor = -1 : yPosFactor = 1;
		angle = angle * (Math.PI / 180);
		console.log(xPosFactor)

		let force = parseFloat(document.getElementById("spawnVecStr").value) / au * 100000;
		let forceY = force * Math.sin(angle); //Solve for force in Y direction  B = A(sin(angleAC))
		let forceX = (Math.sqrt(force ** 2 - forceY ** 2)) * xPosFactor; //Solve for force in X direction root(C^2 = A^2 - B^)

		

		this.vector = new Victor(forceX , forceY) ;
		updateRenderOnly();
	}
	updateColorFromSlider() {
		this.hasAtmosphere = document.getElementById("spawnHasAtmosphere").checked;

		this.r = document.getElementById("spawnColorSlideR").value;
		this.g = document.getElementById("spawnColorSlideG").value;
		this.b = document.getElementById("spawnColorSlideB").value;

		this.updateColorDisplay();
	}
	updateColorFromNumber() {
		this.hasAtmosphere = document.getElementById("spawnHasAtmosphere").checked;

		this.r = document.getElementById("spawnColorValR").value;
		this.g = document.getElementById("spawnColorValG").value;
		this.b = document.getElementById("spawnColorValB").value;

		this.updateColorDisplay();
	}
	updateColorDisplay() {

		document.getElementById("spawnColorSlideR").value = this.r;
		document.getElementById("spawnColorSlideG").value = this.g;
		document.getElementById("spawnColorSlideB").value = this.b;

		document.getElementById("spawnColorValR").value = this.r;
		document.getElementById("spawnColorValG").value = this.g;
		document.getElementById("spawnColorValB").value = this.b;

		document.getElementById("spawnColorDisplay").style.background = `rgb(${this.r}, ${this.g}, ${this.b})`;
		this.handleAtmosphereCheckboxDisplay();
	}
	handleAtmosphereCheckboxDisplay() {
		let el = document.getElementById("spawnAtmosphereCheckboxDisplay");
		if (this.canHaveAtmosphere) {
			el.style.display = "flex";
		} else {
			el.style.display = "none";
		}
	}

	toggleMousePositionMode() {
		let btn = document.getElementById("spawnPosPickerBtn");
		if (this.mousePositionMode) {
			btn.classList.remove("selected");
			this.mousePositionMode = false;
		} else {
			btn.classList.add("selected") 
			this.mousePositionMode = true;
		}
		
	}

	selectPositionWithMouse(event) {
		if (this.isActive && this.mousePositionMode){
			this.x = event.clientX;
			this.y = event.clientY;
			document.getElementById("spawnXPos").value = this.x;
			document.getElementById("spawnYPos").value = this.y;
			updateRenderOnly();
		}
	}
	selectVecWithMouse(event) {}

	clearValues() {
		this.name = "Unnamed Body";
		this.x = centerX;
		this.y = centerY;
		this.mass = 1;
		this.hasAtmosphere = false;
		this.canHaveAtmosphere = false;
		this.vector = new Victor(0,0);
		this.r = "255";
		this.g = "255";
		this.b = "255";
		this.updateColorFromSlider();
		this.updateColorFromNumber();

		document.getElementById("spawnVecDir").value = "";
		document.getElementById("spawnVecStr").value = "";
		document.getElementById("spawnVecDir").value = "";
		document.getElementById("spawnMassDec").value = "";
		document.getElementById("spawnMassPow").value = "";
		document.getElementById("spawnXPos").value = this.x;
		document.getElementById("spawnYPos").value = this.y;
	}
	spawnBody() {
			celestialBodies.push(
			new CelestialBody(this.name, this.mass, this.x, this.y, this.vector, new Style(this.r, this.g, this.b))
			);
			this.clearValues();
	}

	drawVector(targetVector = this.vector) {
		let lineWidth = 3;
		let headlen = 10; // length of head in pixels
		let fromx = this.x,
			fromy = this.y,
			tox = ((targetVector.x * vectorDisplayScale) + this.x), 
			toy = ((targetVector.y * vectorDisplayScale)  + this.y);

		let dx = (tox - fromx);
		let dy = (toy - fromy);
		let angle = Math.atan2(dy, dx);

		ctx.save()
		ctx.beginPath();
		ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
		ctx.fillStyle = `rgba(255, 255, 255, 0.5)`;
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
		ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));	
		ctx.lineTo(tox, toy);
		ctx.stroke();
		ctx.fill();
		ctx.restore();
	}

	drawPreview () {
		let radius = findBodyRadius(this.mass);

		ctx.beginPath();
		ctx.setLineDash([2, 2]);
		ctx.strokeStyle = "white";
		ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, 0.5)`
		ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
		ctx.fill();
		ctx.stroke();

		ctx.beginPath();
		ctx.lineWidth = 3;
		ctx.setLineDash([10, 5, 5, 5]);
		ctx.strokeStyle = `rgba(255, 0, 0, 0.5)`;
		ctx.arc(this.x, this.y, 50, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.lineWidth = 1;
		ctx.setLineDash([])

		if (this.vector.x != 0 || this.vector.y != 0){this.drawVector();}
	}
	render() {
		if (this.mass > 0 && this.isActive)
			this.drawPreview();
		}
}

class DeleteTool extends Tool {
	constructor() {
		super();
	}
	handleDeleteMessage() {
		if (typeof this.selectedBody === undefined) {
			document.getElementById("deleteButton").innerHTML = "No Body Selected";
		} else {
			document.getElementById("deleteButton").innerHTML = `Delete ${this.selectedBody.name}?`;
		}
	}
	handleDeleteButton() {
			let i = celestialBodies.indexOf(this.selectedBody);
			celestialBodies.splice(i, 1);
			this.selectedBody = undefined;
	}
	handleDeleteAllButton() {
		celestialBodies = [];
	}

}

class PreSetTool extends Tool {
	constructor() {
		super();
	}
	handleSpawnPreSet(id) {
		deleteTool.handleDeleteAllButton();
		switch(id) {
			case "preSet01":
				celestialBodies.push(
					new CelestialBody("Solaris One", mSun * 0.8, centerX + 40, centerY, new Victor(0, 0.5), new Style("255", "200", "50")),
					new CelestialBody("Solaris Two", mSun * 0.9, centerX - 100, centerY, new Victor(-0.5, 0.2), new Style("50", "255", "255")),
					new CelestialBody("Solaris Three", mSun * 1.09, centerX - 150, centerY - 40, new Victor(0.9, -0.2), new Style("200", "50", "255"))
				)
				break;
			case "preSet02":
				celestialBodies.push(
					new CelestialBody("Sun", mSun, centerX, centerY, new Victor(0, 0), new Style("200", "200", "0")),
					new CelestialBody("Mercury", 0.33e24, centerX + 39, centerY, new Victor(0, 1.15), new Style("235", "85", "52")),
					new CelestialBody("Venus", 4.87e24, centerX + 72, centerY, new Victor(0, 0.85), new Style("180", "235", "52")),
					new CelestialBody("Earth", mEarth, centerX + 100, centerY, new Victor(0, 0.72), new Style("52", "104", "235")),
					new CelestialBody("Mars", 0.642e24, centerX + 152, centerY, new Victor(0, 0.55), new Style("235", "107", "52")),
					new CelestialBody("Jupiter", 1898e24, centerX + 519, centerY, new Victor(0, 0.4), new Style("235", "156", "52")),
					new CelestialBody("Saturn", 568e24, centerX + 955, centerY, new Victor(0, 0.25), new Style("211", "235", "52"))
					//TODO add more
				
					)
				break;
			case "preSet03":
				celestialBodies.push(
					new CelestialBody("Lavender", mSun, centerX + 50, centerY, new Victor(0, -0.4), new Style("0", "200", "200")),
					new CelestialBody("Turquoise", mSun, centerX - 50, centerY, new Victor(0, 0.4 ), new Style("200", "0", "200")),
					new CelestialBody("Asteroid 1", 2.2e19, centerX - 100, centerY, new Victor(0, -1.25 ), new Style("100", "0", "200")),
					new CelestialBody("Asteroid 2", 1e19, centerX - 103, centerY - 2, new Victor(0, -1.3 ), new Style("250", "0", "100")),
					new CelestialBody("Planet", 1e25, centerX - 150, centerY - 200, new Victor(-0.2, 0.8 ), new Style("250", "0", "100")),
					new CelestialBody("BigBoi", 1898e24, centerX + 300, centerY, new Victor(0, 0.6), new Style("235", "156", "52"))
				)
				break;
			default:
				console.log(`Error: passed in id "${id}" has no corresponding case`);
				break;
		}
	}
}
//=====Functions=====//

//--General

function init() {

	updateInputRanges();
	createTools();
	createCelestialObjects();
	requestAnimationFrame(update);
}
function update() {
	starScape.render();
	calculateVectors();
	celestialBodies.forEach((body) => body.update());
	spawnTool.render();
	testStuff();
	!settings.paused && requestAnimationFrame(update);
}
function updateRenderOnly() {
	starScape.render();
	celestialBodies.forEach((body) => body.render());
	spawnTool.render();
}
function createCelestialObjects() {
	starScape = new StarScape();
	preSetTool.handleSpawnPreSet("preSet03");
}
function testStuff() {
}
function calculateVectors() {
	celestialBodies.forEach(body => {
		celestialBodies.forEach(target => {
			if (body !== target) {
				let distanceX = convertPixelsToKm(target.x - body.x); // Gets the distance between the two bodies and converts them to km
				let distanceY = convertPixelsToKm(target.y - body.y);
				let angle = Math.atan2(distanceY, distanceX);// //Angle in rad to apply to new vector

				let distance = Math.sqrt((distanceX ** 2 + distanceY ** 2)) * 1000; //Distance between two bodies in meters
				let force = g * body.mass * target.mass / distance ** 2;  // Gravitational force equation

				let forceY = force * Math.sin(angle); //Solve for force in Y direction  B = A(sin(angleAC))
				let forceX = Math.sqrt(force ** 2 - forceY ** 2); //Solve for force in X direction root(C^2 = A^2 - B^)

				if (distanceX < 0 && forceX > 0) { //TODO Try to fix in the maths - inverts the x direction point towards target if needed
					forceX *= -1;
				}
				let accX = forceX / body.mass; //Converts force to acceleration A = F/M
				let accY = forceY / body.mass;

				body.vector.add(new Victor(accX, accY));
			}
		})
	})
}
function convertPixelsToKm(n) {
	return n * distanceScale;
}
function convertToCoords(n) {
	return n / distanceScale;
}
function updateInputRanges() {
	let el = document.getElementById('spawnXPos');
	el.max = canvas.width;
	el.placeholder = `0 - ${canvas.width}`;

	el = document.getElementById('spawnYPos');
	el.max = canvas.height;
	el.placeholder = `0 - ${canvas.height}`;
}
function createTools(){
	spawnTool = new SpawnTool();
	deleteTool = new DeleteTool();
	preSetTool = new PreSetTool();
}

function findBodyRadius(mass) {
	let radius;
		let relativeSize;

		if (mass < mindTerrestrialPlanetMass) {//Is Asteroid?
			radius = 1;
			relativeSize = (mass / mindTerrestrialPlanetMass) + 1;
		} else if (mass <= minGasGiantMass) { //Is Terrestrial Planet?
			radius = 5;
			relativeSize = (mass / minGasGiantMass) + 1;
		} else if (mass <= minStarMass) { //Is Gas Giant?
			radius = 10;
			relativeSize = (mass / minStarMass) + 1;
		} else { //Is Star?
			radius = 20;
			relativeSize = (minStarMass / mass) + 1;
		}
		return radius * relativeSize;
}

function handleCanvasClickEvents(event){
	updateRenderOnly();
	spawnTool.selectPositionWithMouse(event);
	deleteTool.isActive && deleteTool.selectBody(event);
}

//--Control Panel functions
function handleViewToggle(){}

function handleVectorToggle(){
	let element = document.getElementById('displayVectorsBtn');
	settings.displayVectors = !settings.displayVectors;
	settings.displayVectors ? element.classList.remove("disabled") : element.classList.add("disabled");

}
function handlePathToggle(){
	let element = document.getElementById('displayPathBtn');
	settings.displayOrbitalPath = !settings.displayOrbitalPath;
	settings.displayOrbitalPath ? element.classList.remove("disabled") : element.classList.add("disabled");
}
function handlePauseToggle(){
	let pauseButton = document.getElementById("pauseBtn");
	let pauseIcon = "<ion-icon name=\"pause-circle-outline\"></ion-icon>";
	let playIcon = "<ion-icon name=\"play-circle-outline\"></ion-icon>";
	settings.paused = !settings.paused;
	settings.paused ? pauseButton.innerHTML = playIcon : pauseButton.innerHTML = pauseIcon
	requestAnimationFrame(update);
}
function handleManualNextFrame(){
	requestAnimationFrame(update);
}
function handleToolSelect(){
	function clearAllStatus() {
		document.getElementById('toolSelectionContainer').childNodes.forEach((child) => {child.classList && child.classList.remove("selected")});
		document.getElementById('toolContainer').childNodes.forEach((child) => {child.classList && child.classList.add("hidden")});
		spawnTool.isActive = false;
		deleteTool.isActive = false;
		celestialBodies.forEach((body) => {
			body.isSelected = false;
		});
	}


	if (!this.classList.value.includes('selected')) {
		clearAllStatus();
		this.classList.add("selected");
		switch(this.id) {
			case 'spawnBtn':
				document.getElementById('spawnTool').classList.remove('hidden');
				spawnTool.isActive = true;
				break;
			case 'deleteBtn':
				document.getElementById('deleteTool').classList.remove('hidden');
				deleteTool.isActive = true;
				break;
			case 'inspectBtn':
				document.getElementById('inspectTool').classList.remove('hidden');
				break;
			case 'preSetBtn':
				document.getElementById('preSetTool').classList.remove('hidden');		
				break;
			case 'infoBtn':
				document.getElementById('infoTool').classList.remove('hidden');
				break;
			}
		} else {
			clearAllStatus();
		}
}
function handleToggleHidePanel() {
	console.log("toggling")
	let hiddenBtn = document.getElementById("hiddenCollapseBtn");
	let panelBtn = document.getElementById("collapseBtn");
	let panel = document.getElementById("controlPanel");

	if (panel.classList.contains("collapsed")) {
		panel.classList.remove("collapsed");
		hiddenBtn.classList.remove("panel-hidden");
	} else {
		panel.classList.add("collapsed");
		hiddenBtn.classList.add("panel-hidden");
	}
}
//=====||=====//
window.addEventListener('load', (event) => {
	init();
});
window.addEventListener('resize', (event) => {
	starScape.resizeStarScape();
	updateInputRanges();
});
window.addEventListener('keydown', (event) => { //Handles shortcut control keys
	if (event.keyCode == 80) {
		handlePauseToggle();
	}
	if (event.keyCode === 78 && settings.paused == true) {
		handleManualNextFrame();
	}
	if (event.keyCode === 86) {
		handleVectorToggle();
		let vecBtnClasses = document.getElementById('displayVectorsBtn').classList;
		vecBtnClasses.includes('disabled') ? vecBtnClasses.remove('disabled') : vecBtnClasses.add('disabled');
	}
	if (event.keyCode === 79) {
		handlePathToggle();
		let vecBtnClasses = document.getElementById('displayVectorsBtn').classList;
		vecBtnClasses.includes('disabled') ? vecBtnClasses.remove('disabled') : vecBtnClasses.add('disabled');
	}
});

document.getElementById("displayPathBtn").onclick = handlePathToggle;
document.getElementById("displayVectorsBtn").onclick = handleVectorToggle;
document.getElementById("pauseBtn").onclick = handlePauseToggle;
document.getElementById("toolSelectionContainer").childNodes.forEach(el => {el.onclick = handleToolSelect})

//TODO problem with vector direction :180 should be opposite direction
//TODO update when not playing
