const STATUS = {
	PRE_START: 0,
	RUNNING: 1,
	GAME_OVER: 2,
};
const Constants = { pipesGap: 130, framesPerPipes: 200 };

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let elements;

const state = {
	status: STATUS.PRE_START,
	gravity: 0.18,
	pipesPositions: [],
	frames: 0,
};

main();

function main() {
	initGame();
	canvas.addEventListener('click', clickEvent);
	interval();
}

function interval() {
	updateElements();
	draw();
	state.frames++;
	requestAnimationFrame(interval);
}

//update all the relevant elements positions and images
//called in every frame
function updateElements() {
	if (state.status === STATUS.RUNNING) {
		//bird update
		elements['bird'].speed += state.gravity;
		elements['bird'].y += elements['bird'].speed;
		elements['bird'].collided();

		//land update
		elements['land'].x =
			(elements['land'].x - elements['land'].dx) % (elements['land'].width / 4);

		if (state.frames % Constants.framesPerPipes == 0) {
			generatePipes();
		}

		//pipes update
		for (let position of state.pipesPositions) {
			position.x = position.x - elements['pipes'].upper.dx;

			//remove the pipes if it leaves the frame
			if (position.x + elements['pipes'].upper.width <= 0) {
				state.pipesPositions.shift();
				// elements['pipes'].shift();
			}
		}
	}
}

//draw all the canvas elements
//called in every frame
function draw() {
	//clear the canvas
	ctx.fillStyle = '#87CEEB';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	//draw the elements by layers order
	elements.background.draw();

	// for (let { upper, lower } of elements['pipes']) {
	// 	upper.draw();
	// 	lower.draw();
	// }

	for (let position of state.pipesPositions) {
		console.log(position);
		elements.pipes.upper.draw({ x: position.x, y: position.upperY });
		elements.pipes.lower.draw({ x: position.x, y: position.lowerY });
	}

	elements.startButton.draw();
	elements.gameOver.draw();
	elements.land.draw();
	elements.bird.draw();
}

function clickEvent() {
	switch (state.status) {
		case STATUS.PRE_START:
			state.status = STATUS.RUNNING;
			break;
		case STATUS.RUNNING:
			elements.bird.flyUp();
			break;
		case STATUS.GAME_OVER:
			initGame();
			break;
	}
}

function initGame() {
	state.gravity = 0.18;
	state.frames = 0;
	state.status = STATUS.PRE_START;
	state.pipesPositions = [];
	elements = initElements();
}

//init all the elements positions and srcPaths
function initElements() {
	elements = {
		bird: {},
		background: {},
		land: {},
		pipes: { upper: {}, lower: {} },
	};

	Object.assign(elements['background'], {
		width: canvas.width,
		height: canvas.height / 2,
		x: 0,
		y: canvas.height - canvas.height / 2,
	});

	Object.assign(elements['land'], {
		width: canvas.width * 2,
		height: canvas.height / 4,
		x: 0,
		y: canvas.height - canvas.height / 4,
		dx: 2,
	});

	Object.assign(elements['pipes'].upper, {
		width: 55,
		height: 400,
		dx: 2,
	});

	Object.assign(elements['pipes'].lower, {
		width: 55,
		height: 400,
		dx: 2,
	});

	Object.assign(elements['bird'], {
		width: 47,
		height: 35,
		x: canvas.width / 6,
		y: canvas.height / 3,
		speed: 0,
		jump: 4.5,
		flyUp: () => {
			elements.bird.speed -= elements.bird.jump;
		},
		collided: () => {
			let bird = elements.bird;
			let gameOver = false;
			let lastPosition;

			//bird collided with the floor
			if (bird.y + bird.height >= canvas.height - elements['land'].height) {
				lastPosition = {
					x: bird.x,
					y: canvas.height - elements['land'].height - bird.height,
				};
				gameOver = true;
			}

			//bird collided with the top of the frame
			else if (bird.y <= 0) {
				lastPosition = {
					x: bird.x,
					y: 0,
				};
				gameOver = true;
			} else {
				//bird collided with one of the pipes
				for (let { x, upperY, lowerY } of state.pipesPositions) {
					let pipe = elements['pipes'].upper;
					if (bird.x + bird.width >= x && bird.x <= x + pipe.width) {
						let safeYTopBar = upperY + pipe.height;
						let safeYBottomBar = safeYTopBar + Constants.pipesGap;
						if (
							bird.y <= safeYTopBar ||
							bird.y + bird.height >= safeYBottomBar
						) {
							lastPosition = { x: bird.x, y: bird.y };
							gameOver = true;
						}
					}
				}
			}
			if (gameOver) {
				bird.speed = 0;
				state.gravity = 0;
				bird.x = lastPosition.x;
				bird.y = lastPosition.y;
				state.status = STATUS.GAME_OVER;
			}
		},
	});

	generatePipes();
	elements = initImagesAndDraw(elements);
	elements.startButton = initStartButton();
	elements.gameOver = initGameOver();
	return elements;
}

//init images elements
function initImagesAndDraw(elements) {
	for (let key of Object.keys(elements)) {
		if (key === 'pipes') break;

		let elem = elements[key];
		elem.img = new Image();
		elem.img.src = `images/${key}.png`;
		elem.draw = function () {
			ctx.drawImage(elem.img, elem.x, elem.y, elem.width, elem.height);
		};
	}

	let upper = elements['pipes'].upper;
	upper.img = new Image();
	upper.img.src = 'images/upperPipe.png';
	upper.draw = function (position) {
		ctx.drawImage(upper.img, position.x, position.y, upper.width, upper.height);
	};

	let lower = elements['pipes'].lower;
	lower.img = new Image();
	lower.img.src = 'images/lowerPipe.png';
	lower.draw = function (position) {
		ctx.drawImage(lower.img, position.x, position.y, lower.width, lower.height);
	};

	return elements;
}

function initStartButton() {
	let startImg = new Image();
	startImg.src = 'images/startButton.png';

	return {
		img: startImg,
		draw: function () {
			if (state.status === STATUS.PRE_START) {
				const imgWidth = this.img.width / 5;
				const imgHeight = this.img.height / 5;
				const x = canvas.width / 2 - imgWidth / 2;
				const y = canvas.height / 4 - imgHeight / 2;
				ctx.drawImage(this.img, x, y, imgWidth, imgHeight);
			}
		},
	};
}

function initGameOver() {
	let gameOverImg = new Image();
	gameOverImg.src = 'images/gameOver.png';

	return {
		img: gameOverImg,
		draw: function () {
			if (state.status === STATUS.GAME_OVER) {
				const imgWidth = this.img.width / 5;
				const imgHeight = this.img.height / 5;
				const x = canvas.width / 2 - imgWidth / 2;
				const y = canvas.height / 4 - imgHeight / 2;
				ctx.drawImage(this.img, x, y, imgWidth, imgHeight);
			}
		},
	};
}

function generatePipes() {
	const upperY = generateHigherPipeYPos();
	const lowerY = generateLowerPipesYPos(upperY);

	state.pipesPositions.push({
		x: canvas.width,
		upperY: upperY,
		lowerY: lowerY,
	});
}

function generateHigherPipeYPos() {
	const higherBar = 300;
	const lowerBar = 60;
	const yPos = Math.random() * (higherBar - lowerBar) + lowerBar;

	return -yPos;
}

function generateLowerPipesYPos(upperPipeY) {
	let pipe = elements['pipes'].upper;
	return upperPipeY + pipe.height + Constants.pipesGap;
}
