export function createPuff({ wrap, game, smoke }, later) {
	const puff = document.createElement('i');
	const rocketSize = wrap.offsetWidth || 240;
	const scale = rocketSize / 240;
	const size = (26 + Math.random() * 50) * scale;
	const flying = wrap.classList.contains('fly');
	const side = Math.random() < 0.5 ? -1 : 1;

	const gameRect = game.getBoundingClientRect();
	const wrapRect = wrap.getBoundingClientRect();
	const wrapBottom = gameRect.bottom - wrapRect.bottom;
	let nozzle = wrapBottom + rocketSize * 0.16;
	if (flying) {
		nozzle = Math.max(120, wrapBottom + 24);
	}

	const spread = flying
		? (12 + Math.random() * 36) * scale
		: (55 + Math.random() * 95) * scale;

	puff.className = 'smoke';
	puff.style.width = puff.style.height = size + 'px';
	puff.style.left = `calc(50% + ${side * spread}px - ${size / 2}px)`;
	puff.style.bottom = nozzle + Math.random() * 16 + 'px';

	if (flying) {
		puff.style.setProperty('--x', side * (12 + Math.random() * 48) * scale + 'px');
		puff.style.setProperty('--y', (18 + Math.random() * 46) * scale + 'px');
		puff.style.setProperty('--sx', 1.5 + Math.random());
		puff.style.setProperty('--sy', 1.7 + Math.random());
	} else {
		puff.style.setProperty('--x', side * (100 + Math.random() * 220) * scale + 'px');
		puff.style.setProperty('--y', (6 + Math.random() * 58) * scale + 'px');
		puff.style.setProperty('--sx', 2.5 + Math.random() * 1.8);
		puff.style.setProperty('--sy', 1.15 + Math.random() * 0.7);
	}

	smoke.appendChild(puff);
	later(() => puff.remove(), 1800);
}
