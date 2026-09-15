import { createPuff } from './smoke.js';
import {
	animalById,
	clearPassenger,
	moveToWindow,
	nextToBoard,
	renderRemaining,
	seatPassenger,
} from './animals.js';

const IDLE_STATUS = '달의 동물들을 구출하세요';

export function initGame() {
	const elements = {
		board: document.querySelector('#board'),
		launch: document.querySelector('#launch'),
		reset: document.querySelector('#reset'),
		rocket: document.querySelector('#rocket'),
		wrap: document.querySelector('#rocketWrap'),
		smoke: document.querySelector('#smoke'),
		game: document.querySelector('#game'),
		statusEl: document.querySelector('#status'),
		count: document.querySelector('#count'),
		animals: document.querySelector('#animals'),
		windowPassengers: document.querySelector('#windowPassengers'),
	};

	let busy = false;
	let puffTimer = null;
	let countdownTimer = null;
	let timers = [];
	let rescued = new Set();
	let boardedId = null;
	let didLaunch = false;
	let boardToken = 0;

	function later(fn, ms) {
		const t = setTimeout(fn, ms);
		timers.push(t);
		return t;
	}

	function puff() {
		createPuff(elements, later);
	}

	function allRescued() {
		return rescued.size === 10;
	}

	function syncButtons() {
		if (allRescued()) {
			elements.board.disabled = true;
			elements.launch.disabled = true;
			return;
		}
		elements.board.disabled = busy || Boolean(boardedId);
		elements.launch.disabled = busy || !boardedId;
	}

	function setIdleStatus() {
		if (allRescued()) {
			elements.statusEl.textContent = '모두 구출했어요!';
			return;
		}
		elements.statusEl.textContent = IDLE_STATUS;
	}

	function board() {
		if (busy || boardedId || allRescued()) return;
		const animal = nextToBoard(rescued, boardedId);
		if (!animal) return;

		busy = true;
		const token = ++boardToken;
		syncButtons();
		elements.statusEl.textContent = `${animal.name}${animal.particle} 태우는 중…`;

		const animalEl = elements.animals.querySelector(`[data-id="${animal.id}"]`);
		if (!animalEl) {
			busy = false;
			syncButtons();
			return;
		}

		moveToWindow(elements.game, animalEl, elements.windowPassengers).then(
			() => {
				if (token !== boardToken) return;
				animalEl.remove();
				seatPassenger(elements.windowPassengers, animal);
				boardedId = animal.id;
				busy = false;
				elements.statusEl.textContent = '탑승 완료! 발사하세요';
				syncButtons();
			}
		);
	}

	function start() {
		if (busy || !boardedId) return;
		busy = true;
		didLaunch = false;
		syncButtons();
		elements.statusEl.textContent = '카운트다운';
		let n = 3;
		elements.count.textContent = n;

		countdownTimer = setInterval(() => {
			n--;
			if (n) {
				elements.count.textContent = n;
				return;
			}

			clearInterval(countdownTimer);
			countdownTimer = null;
			elements.count.textContent = '';
			elements.statusEl.textContent = '엔진 점화! 🔥';
			elements.rocket.classList.add('ignited');

			for (let i = 0; i < 24; i++) later(puff, i * 40);
			puffTimer = setInterval(puff, 45);

			later(() => {
				elements.statusEl.textContent = '발사! 🚀';
				elements.wrap.classList.add('fly');
				didLaunch = true;
			}, 800);

			later(() => {
				clearInterval(puffTimer);
				puffTimer = null;
				const animal = animalById(boardedId);
				elements.statusEl.textContent = animal
					? `${animal.name}${animal.particle} 구출 중! ✨`
					: '우주를 향해 상승 중! ✨';
			}, 3600);
		}, 700);
	}

	function restart() {
		boardToken += 1;
		timers.forEach(clearTimeout);
		timers = [];
		if (puffTimer) clearInterval(puffTimer);
		puffTimer = null;
		if (countdownTimer) clearInterval(countdownTimer);
		countdownTimer = null;

		if (allRescued()) {
			rescued = new Set();
		} else if (didLaunch && boardedId) {
			rescued.add(boardedId);
		}

		boardedId = null;
		clearPassenger(elements.windowPassengers);
		renderRemaining(elements.animals, rescued);

		busy = false;
		didLaunch = false;
		elements.rocket.classList.remove('ignited');
		elements.wrap.classList.remove('fly');
		elements.smoke.innerHTML = '';
		elements.count.textContent = '';
		setIdleStatus();
		syncButtons();
		void elements.wrap.offsetWidth;
	}

	renderRemaining(elements.animals, rescued);
	syncButtons();
	elements.board.addEventListener('click', board);
	elements.launch.addEventListener('click', start);
	elements.reset.addEventListener('click', restart);
}
