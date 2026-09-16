const ASSET = (id) => `public/assets/animals/${id}.webp`;

export const ANIMALS = [
	{
		id: 'cat',
		name: '고양이',
		particle: '를',
		side: 'left',
		row: 'front',
		x: 34,
		bottom: 15.5,
	},
	{
		id: 'dog',
		name: '강아지',
		particle: '를',
		side: 'right',
		row: 'front',
		x: 34,
		bottom: 14,
	},
	{
		id: 'fox',
		name: '여우',
		particle: '를',
		side: 'left',
		row: 'front',
		x: 10,
		bottom: 14,
	},
	{
		id: 'rabbit',
		name: '토끼',
		particle: '를',
		side: 'left',
		row: 'back',
		x: 16,
		bottom: 19,
	},
	{
		id: 'pig',
		name: '돼지',
		particle: '를',
		side: 'left',
		row: 'front',
		x: 21.5,
		bottom: 14.5,
	},
	{
		id: 'bear',
		name: '곰',
		particle: '을',
		side: 'left',
		row: 'back',
		x: 28,
		bottom: 18,
	},
	{
		id: 'monkey',
		name: '원숭이',
		particle: '를',
		side: 'right',
		row: 'back',
		x: 28,
		bottom: 21,
	},
	{
		id: 'sheep',
		name: '양',
		particle: '을',
		side: 'right',
		row: 'front',
		x: 22.5,
		bottom: 15,
	},
	{
		id: 'raccoon',
		name: '너구리',
		particle: '를',
		side: 'right',
		row: 'back',
		x: 16,
		bottom: 19,
	},
	{
		id: 'tiger',
		name: '호랑이',
		particle: '를',
		side: 'right',
		row: 'front',
		x: 9,
		bottom: 15.5,
	},
];

export const BOARD_ORDER = [
	'cat',
	'dog',
	'bear',
	'monkey',
	'pig',
	'sheep',
	'rabbit',
	'raccoon',
	'fox',
	'tiger',
];

export function animalById(id) {
	return ANIMALS.find((animal) => animal.id === id);
}

export function placeGroundAnimal(container, animal) {
	const el = document.createElement('img');
	el.className = 'animal ' + (animal.row === 'back' ? 'back' : 'front');
	el.dataset.id = animal.id;
	el.src = ASSET(animal.id);
	el.alt = animal.name;
	if (animal.side === 'left') el.style.left = animal.x + '%';
	else el.style.right = animal.x + '%';
	el.style.bottom = animal.bottom + 'vh';
	container.appendChild(el);
	return el;
}

export function renderRemaining(container, rescued) {
	container.innerHTML = '';
	const remaining = ANIMALS.filter((animal) => !rescued.has(animal.id));
	for (const animal of remaining.filter((animal) => animal.row === 'back')) {
		placeGroundAnimal(container, animal);
	}
	for (const animal of remaining.filter((animal) => animal.row !== 'back')) {
		placeGroundAnimal(container, animal);
	}
}

export function nextToBoard(rescued, boardedId) {
	return BOARD_ORDER.map(animalById).find(
		(animal) => animal && !rescued.has(animal.id) && animal.id !== boardedId,
	);
}

export function seatPassenger(windowEl, animal) {
	windowEl.innerHTML = '';
	const img = document.createElement('img');
	img.className = 'passenger-img';
	img.src = ASSET(animal.id);
	img.alt = animal.name;
	windowEl.appendChild(img);
}

export function clearPassenger(windowEl) {
	windowEl.innerHTML = '';
}

export function moveToWindow(game, animalEl, windowEl) {
	return new Promise((resolve) => {
		const gameRect = game.getBoundingClientRect();
		const from = animalEl.getBoundingClientRect();
		const to = windowEl.getBoundingClientRect();
		const startLeft = from.left - gameRect.left;
		const startBottom = gameRect.bottom - from.bottom;
		const targetSize = to.width;
		const targetLeft = to.left - gameRect.left + to.width / 2 - targetSize / 2;
		const targetBottom =
			gameRect.bottom - (to.top + to.height / 2) - targetSize / 2;

		animalEl.style.zIndex = '8';
		animalEl.style.right = 'auto';
		animalEl.style.left = startLeft + 'px';
		animalEl.style.bottom = startBottom + 'px';
		animalEl.style.width = from.width + 'px';
		void animalEl.offsetWidth;

		let settled = false;
		const done = () => {
			if (settled) return;
			settled = true;
			animalEl.removeEventListener('transitionend', done);
			resolve();
		};
		animalEl.addEventListener('transitionend', done);
		animalEl.style.left = targetLeft + 'px';
		animalEl.style.bottom = targetBottom + 'px';
		animalEl.style.width = targetSize + 'px';
		setTimeout(done, 600);
	});
}
