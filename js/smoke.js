export function createPuff({ wrap, game, smoke }, later) {
	const puff = document.createElement('i');
	const size = 26 + Math.random() * 50;
	const flying = wrap.classList.contains('fly');
	const side = Math.random() < 0.5 ? -1 : 1;

	let nozzle = 176;
	if (flying) {
		const gameRect = game.getBoundingClientRect();
		const wrapRect = wrap.getBoundingClientRect();
		nozzle = Math.max(120, gameRect.bottom - wrapRect.bottom + 24);
	}

	const spread = flying
		? 12 + Math.random() * 36
		: 55 + Math.random() * 95;

	puff.className = 'smoke';
	puff.style.width = puff.style.height = size + 'px';
	puff.style.left = `calc(50% + ${side * spread}px - ${size / 2}px)`;
	puff.style.bottom = nozzle + Math.random() * 16 + 'px';

	if (flying) {
		puff.style.setProperty('--x', side * (12 + Math.random() * 48) + 'px');
		puff.style.setProperty('--y', 18 + Math.random() * 46 + 'px');
		puff.style.setProperty('--sx', 1.5 + Math.random());
		puff.style.setProperty('--sy', 1.7 + Math.random());
	} else {
		puff.style.setProperty('--x', side * (100 + Math.random() * 220) + 'px');
		puff.style.setProperty('--y', 6 + Math.random() * 58 + 'px');
		puff.style.setProperty('--sx', 2.5 + Math.random() * 1.8);
		puff.style.setProperty('--sy', 1.15 + Math.random() * 0.7);
	}

	smoke.appendChild(puff);
	later(() => puff.remove(), 1800);
}
