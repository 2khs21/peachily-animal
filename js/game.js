import { createPuff } from './smoke.js';
import {
	animalById,
	clearPassenger,
	moveToWindow,
	nextToBoard,
	renderRemaining,
	seatPassenger,
} from './animals.js';
import { initTensComplement } from './tensComplement.js';
import { problemAt } from './problems.js';

const ROCKET_PAUSE_MS = 600;
const ANNOUNCE_HOLD_MS = 3000;
const INTRO_TEXT = '달에 있는 동물 친구들을\n구해 주세요.';

export function initGame() {
	const elements = {
		rocket: document.querySelector('#rocket'),
		wrap: document.querySelector('#rocketWrap'),
		smoke: document.querySelector('#smoke'),
		game: document.querySelector('#game'),
		announceEl: document.querySelector('#announce'),
		widget: document.querySelector('#widget'),
		animals: document.querySelector('#animals'),
		windowPassengers: document.querySelector('#windowPassengers'),
		earth: document.querySelector('#earth'),
	};

	let busy = false;
	let puffTimer = null;
	let timers = [];
	let rescued = new Set();
	let boardedId = null;
	let didLaunch = false;
	let boardToken = 0;
	let launchToken = 0;
	let transferAnim = null;

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

	function hideWidget() {
		elements.widget.hidden = true;
		fuel.setLocked(true);
	}

	function showWidget() {
		elements.widget.hidden = false;
		fuel.setLocked(false);
	}

	function playAnnounce(text, { intro = false } = {}) {
		return new Promise((resolve) => {
			const el = elements.announceEl;
			let settled = false;

			const finish = () => {
				if (settled) return;
				settled = true;
				el.removeEventListener('animationend', onEnd);
				el.hidden = true;
				el.classList.remove('is-grow', 'is-shrink', 'is-intro');
				el.textContent = '';
				resolve();
			};

			const onEnd = (event) => {
				if (event.animationName !== 'announce-out') return;
				finish();
			};

			el.textContent = text;
			el.hidden = false;
			el.classList.remove('is-grow', 'is-shrink', 'is-intro');
			el.classList.toggle('is-intro', intro);
			void el.offsetWidth;
			el.classList.add('is-grow');
			el.addEventListener('animationend', onEnd);

			later(() => {
				el.classList.remove('is-grow');
				el.classList.add('is-shrink');
				later(finish, 500);
			}, ANNOUNCE_HOLD_MS);
		});
	}

	function board() {
		if (busy || boardedId || allRescued()) return;
		const animal = nextToBoard(rescued, boardedId);
		if (!animal) return;

		busy = true;
		const token = ++boardToken;
		hideWidget();

		const animalEl = elements.animals.querySelector(`[data-id="${animal.id}"]`);
		if (!animalEl) {
			busy = false;
			return;
		}

		moveToWindow(elements.game, animalEl, elements.windowPassengers).then(
			() => {
				if (token !== boardToken) return;
				animalEl.remove();
				seatPassenger(elements.windowPassengers, animal);
				boardedId = animal.id;
				busy = false;
				showWidget();
			}
		);
	}

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	function cubicPoint(t, p0, p1, p2, p3) {
		const u = 1 - t;
		return (
			u * u * u * p0 +
			3 * u * u * t * p1 +
			3 * u * t * t * p2 +
			t * t * t * p3
		);
	}

	function cubicTangent(t, p0, p1, p2, p3) {
		const u = 1 - t;
		return (
			3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2)
		);
	}

	function orbitScale(t) {
		if (t < 0.45) {
			const k = t / 0.45;
			const e = 1 - (1 - k) * (1 - k);
			return lerp(0.32, 1.25, e);
		}
		const k = (t - 0.45) / 0.55;
		return lerp(1.25, 0.1, k * k);
	}

	function orbitFrames() {
		const gameRect = elements.game.getBoundingClientRect();
		const earthRect = elements.earth.getBoundingClientRect();
		const size = elements.rocket.offsetWidth;
		const w = gameRect.width;
		const h = gameRect.height;
		const p0 = { x: 0.04 * w, y: 0.78 * h };
		const p1 = { x: 0.34 * w, y: 0.5 * h };
		const p2 = { x: 0.58 * w, y: 0.2 * h };
		const p3 = {
			x: earthRect.left - gameRect.left + earthRect.width / 2,
			y: earthRect.top - gameRect.top + earthRect.height / 2,
		};

		const frames = [];
		const steps = 24;
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const x = cubicPoint(t, p0.x, p1.x, p2.x, p3.x);
			const y = cubicPoint(t, p0.y, p1.y, p2.y, p3.y);
			const tx = cubicTangent(t, p0.x, p1.x, p2.x, p3.x);
			const ty = cubicTangent(t, p0.y, p1.y, p2.y, p3.y);
			const angle = (Math.atan2(tx, -ty) * 180) / Math.PI;
			const scale = orbitScale(t);
			const opacity = t < 0.82 ? 1 : lerp(1, 0.35, (t - 0.82) / 0.18);
			frames.push({
				left: `${x - size / 2}px`,
				top: `${y - size / 2}px`,
				transform: `rotate(${angle}deg) scale(${scale})`,
				opacity: String(opacity),
				offset: t,
			});
		}
		return frames;
	}

	function beginTransfer(token) {
		if (token !== launchToken) return;
		if (puffTimer) {
			clearInterval(puffTimer);
			puffTimer = null;
		}

		if (transferAnim) {
			transferAnim.cancel();
			transferAnim = null;
		}

		elements.rocket.classList.add('transferring');
		elements.wrap.classList.add('to-earth');
		elements.wrap.classList.remove('fly');
		void elements.wrap.offsetWidth;

		transferAnim = elements.wrap.animate(orbitFrames(), {
			duration: 3200,
			easing: 'ease-in-out',
			fill: 'forwards',
		});
		transferAnim.onfinish = () => finishTransfer(token);
	}

	function finishTransfer(token) {
		if (token !== launchToken) return;
		const animal = animalById(boardedId);
		const text = animal
			? `${animal.name}${animal.particle} 지구에 데려다줬어요!`
			: '지구에 도착했어요!';
		const isLast = rescued.size === 9;

		elements.game.classList.add('is-announcing');
		playAnnounce(text).then(() => {
			if (token !== launchToken) return;
			if (isLast) {
				location.href = 'success.html';
				return;
			}
			restart();
			elements.game.classList.remove('is-announcing');
			later(board, ROCKET_PAUSE_MS);
		});
	}

	function onWrapAnimationEnd(event) {
		if (event.target !== elements.wrap) return;
		if (event.animationName === 'fly') {
			beginTransfer(launchToken);
		}
	}

	function start() {
		if (busy || !boardedId) return;
		busy = true;
		didLaunch = false;
		launchToken += 1;
		const token = launchToken;
		fuel.setLocked(true);
		elements.widget.hidden = true;
		elements.rocket.classList.add('ignited');

		for (let i = 0; i < 24; i++) later(puff, i * 40);
		puffTimer = setInterval(puff, 45);

		later(() => {
			if (token !== launchToken) return;
			elements.wrap.classList.add('fly');
			didLaunch = true;
		}, 800);
	}

	function restart() {
		boardToken += 1;
		launchToken += 1;
		timers.forEach(clearTimeout);
		timers = [];
		if (puffTimer) clearInterval(puffTimer);
		puffTimer = null;

		if (allRescued()) {
			rescued = new Set();
		} else if (didLaunch && boardedId) {
			rescued.add(boardedId);
		}

		if (transferAnim) {
			transferAnim.cancel();
			transferAnim = null;
		}
		elements.wrap.getAnimations().forEach((anim) => anim.cancel());

		boardedId = null;
		clearPassenger(elements.windowPassengers);
		renderRemaining(elements.animals, rescued);

		busy = false;
		didLaunch = false;
		elements.rocket.classList.remove('ignited', 'transferring');
		elements.wrap.classList.remove('fly', 'to-earth');
		elements.wrap.style.removeProperty('left');
		elements.wrap.style.removeProperty('top');
		elements.wrap.style.removeProperty('transform');
		elements.wrap.style.removeProperty('opacity');
		elements.smoke.innerHTML = '';
		hideWidget();
		loadProblem();
		void elements.wrap.offsetWidth;
	}

	const fuel = initTensComplement({
		onConfirm(total) {
			if (total === 10) start();
		},
	});

	function loadProblem() {
		fuel.setA(problemAt(rescued.size).a);
	}

	renderRemaining(elements.animals, rescued);
	hideWidget();
	loadProblem();
	playAnnounce(INTRO_TEXT, { intro: true }).then(board);
	elements.wrap.addEventListener('animationend', onWrapAnimationEnd);
}
