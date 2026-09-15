import { createPuff } from './smoke.js';

export function initGame() {
	const elements = {
		launch: document.querySelector('#launch'),
		reset: document.querySelector('#reset'),
		rocket: document.querySelector('#rocket'),
		wrap: document.querySelector('#rocketWrap'),
		smoke: document.querySelector('#smoke'),
		game: document.querySelector('#game'),
		statusEl: document.querySelector('#status'),
		count: document.querySelector('#count'),
	};

	let busy = false;
	let puffTimer = null;
	let timers = [];

	function later(fn, ms) {
		const t = setTimeout(fn, ms);
		timers.push(t);
	}

	function puff() {
		createPuff(elements, later);
	}

	function start() {
		if (busy) return;
		busy = true;
		elements.launch.disabled = true;
		elements.statusEl.textContent = '카운트다운';
		let n = 3;
		elements.count.textContent = n;

		const timer = setInterval(() => {
			n--;
			if (n) {
				elements.count.textContent = n;
				return;
			}

			clearInterval(timer);
			elements.count.textContent = '';
			elements.statusEl.textContent = '엔진 점화! 🔥';
			elements.rocket.classList.add('ignited');

			for (let i = 0; i < 24; i++) later(puff, i * 40);
			puffTimer = setInterval(puff, 45);

			later(() => {
				elements.statusEl.textContent = '발사! 🚀';
				elements.wrap.classList.add('fly');
			}, 800);

			later(() => {
				clearInterval(puffTimer);
				puffTimer = null;
				elements.statusEl.textContent = '우주를 향해 상승 중! ✨';
			}, 3600);
		}, 700);
	}

	function restart() {
		timers.forEach(clearTimeout);
		timers = [];
		if (puffTimer) clearInterval(puffTimer);
		puffTimer = null;
		busy = false;
		elements.launch.disabled = false;
		elements.rocket.classList.remove('ignited');
		elements.wrap.classList.remove('fly');
		elements.smoke.innerHTML = '';
		elements.count.textContent = '';
		elements.statusEl.textContent = '발사 준비 완료';
		void elements.wrap.offsetWidth;
	}

	elements.launch.addEventListener('click', start);
	elements.reset.addEventListener('click', restart);
}
