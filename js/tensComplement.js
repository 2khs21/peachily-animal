const CELL_COUNT = 10;
const FILL_MS = 420;
const HIT_TEN_HOLD_MS = 280;
const COPY = {
	waitingInput: '숫자 키패드로 연료를 넣어 주세요',
	fillingFuel: '연료를 채우는 중…',
	readyToLaunch: '준비 완료! 발사해 볼까요?',
	retry: '다시 생각해 보세요!',
};

export function initTensComplement({ onConfirm, a: startA = 8 } = {}) {
	const gauge = document.querySelector('#gauge');
	const rowMain = document.querySelector('#rowMain');
	const rowOver = document.querySelector('#rowOver');
	const termA = document.querySelector('#termA');
	const termB = document.querySelector('#termB');
	const termSum = document.querySelector('#termSum');
	const equation = document.querySelector('#equation');
	const copyEl = document.querySelector('#copy');
	const confirmBtn = document.querySelector('#confirm');

	let a = clampA(startA);

	const mainCells = [];
	for (let i = 0; i < CELL_COUNT; i++) {
		mainCells.push(createUnit(rowMain, i + 1));
	}

	const state = {
		status: 'waitingInput',
		b: null,
		added: 0,
		confirmed: false,
		showRemain: false,
		fillTimer: null,
		locked: false,
	};

	function clampA(value) {
		const n = Number(value);
		if (!Number.isInteger(n) || n < 1 || n > 9) return 8;
		return n;
	}

	function createUnit(parent, tick) {
		const unit = document.createElement('div');
		unit.className = 'unit';

		const label = document.createElement('span');
		label.className = 'tick';
		label.textContent = String(tick);

		const cell = document.createElement('div');
		cell.className = 'cell';

		unit.append(label, cell);
		parent.append(unit);
		return cell;
	}

	function sum() {
		return a + state.added;
	}

	function tone() {
		const n = sum();
		if (n < 10) return 'under';
		if (n === 10) return 'exact';
		return 'over';
	}

	function paintCell(cell, position, total) {
		cell.className = 'cell';
		cell.textContent = '';

		if (position <= a) {
			cell.classList.add('base');
			return;
		}

		if (position <= total) {
			cell.classList.add(position > CELL_COUNT ? 'excess' : 'added');
			cell.textContent = String(position - a);
			return;
		}

		if (state.showRemain && total < 10) {
			cell.classList.add('remain');
		}
	}

	function syncOverflow(total) {
		const extra = Math.max(0, total - CELL_COUNT);
		rowOver.hidden = extra === 0;
		rowOver.replaceChildren();
		if (!extra) return;

		for (let i = 0; i < extra; i++) {
			const position = CELL_COUNT + 1 + i;
			const cell = createUnit(rowOver, position);
			paintCell(cell, position, total);
		}
	}

	function isWrongFeedback(total) {
		if (total < 10) return state.showRemain;
		if (total > 10) return state.status === 'readyToLaunch';
		return false;
	}

	function copyText() {
		if (isWrongFeedback(sum())) return COPY.retry;
		if (state.status === 'readyToLaunch' && sum() !== 10) {
			return COPY.fillingFuel;
		}
		return COPY[state.status];
	}

	function render() {
		const total = sum();

		mainCells.forEach((cell, index) => {
			paintCell(cell, index + 1, total);
		});
		syncOverflow(total);

		termA.textContent = String(a);
		termB.textContent = state.b == null ? '' : String(state.b);
		termSum.textContent = String(total);

		const currentTone = tone();
		gauge.dataset.tone = currentTone;
		if (state.status === 'fillingFuel' && currentTone === 'over') {
			gauge.dataset.shake = 'gauge';
		} else {
			delete gauge.dataset.shake;
		}
		equation.dataset.tone = currentTone;
		equation.classList.toggle('is-wrong', isWrongFeedback(total));

		copyEl.textContent = copyText();
		confirmBtn.disabled = state.locked || state.status !== 'readyToLaunch';
		if (confirmBtn.disabled && document.activeElement === confirmBtn) {
			confirmBtn.blur();
		}
	}

	function stopFill() {
		if (state.fillTimer) {
			clearInterval(state.fillTimer);
			clearTimeout(state.fillTimer);
			state.fillTimer = null;
		}
	}

	function clearHitTen() {
		gauge.classList.remove('is-hit-ten');
		equation.classList.remove('is-hit-ten');
	}

	function triggerHitTen() {
		clearHitTen();
		void gauge.offsetWidth;
		void equation.offsetWidth;
		gauge.classList.add('is-hit-ten');
		equation.classList.add('is-hit-ten');
	}

	function resetInput() {
		stopFill();
		clearHitTen();
		state.status = 'waitingInput';
		state.b = null;
		state.added = 0;
		state.confirmed = false;
		state.showRemain = false;
		render();
	}

	function stepFill() {
		if (state.b == null) return;

		state.added += 1;
		const total = a + state.added;
		const moreToFill = state.added < state.b;

		if (!moreToFill) {
			stopFill();
			state.status = 'readyToLaunch';
		}

		render();

		if (!moreToFill && total < 10) {
			state.fillTimer = setTimeout(() => {
				if (state.status !== 'readyToLaunch') return;
				state.showRemain = true;
				render();
			}, FILL_MS);
		}

		if (total !== 10) return;

		triggerHitTen();
		if (!moreToFill) return;

		stopFill();
		state.fillTimer = setTimeout(() => {
			if (state.status !== 'fillingFuel' || state.b == null) return;
			stepFill();
			if (state.status === 'fillingFuel') {
				state.fillTimer = setInterval(stepFill, FILL_MS);
			}
		}, FILL_MS + HIT_TEN_HOLD_MS);
	}

	function startFill(digit) {
		state.status = 'fillingFuel';
		state.b = digit;
		state.added = 0;
		state.confirmed = false;
		state.showRemain = false;
		clearHitTen();
		render();
		state.fillTimer = setInterval(stepFill, FILL_MS);
	}

	function confirm() {
		if (state.locked || state.status !== 'readyToLaunch') return;
		state.confirmed = true;
		render();
		if (sum() === 10 && onConfirm) onConfirm(10);
	}

	function digitFromEvent(event) {
		if (event.key >= '1' && event.key <= '9') return Number(event.key);
		const match = event.code.match(/^(?:Digit|Numpad)([1-9])$/);
		return match ? Number(match[1]) : null;
	}

	function onKeyDown(event) {
		if (state.locked || event.repeat) return;

		const digit = digitFromEvent(event);

		if (state.status === 'fillingFuel') {
			if (state.fillTimer) return;
			resetInput();
		}

		if (state.status === 'readyToLaunch') {
			if (event.key === 'Backspace') {
				event.preventDefault();
				resetInput();
				return;
			}
			if (event.key === 'Enter') {
				event.preventDefault();
				confirm();
				return;
			}
			if (digit == null) return;
			event.preventDefault();
			resetInput();
			startFill(digit);
			return;
		}

		if (digit == null) return;
		event.preventDefault();
		startFill(digit);
	}

	function setA(next) {
		a = clampA(next);
		resetInput();
	}

	function setLocked(locked) {
		state.locked = locked;
		if (locked) stopFill();
		render();
		if (confirmBtn.disabled && document.activeElement === confirmBtn) {
			confirmBtn.blur();
		}
	}

	gauge.addEventListener('animationend', (event) => {
		if (event.target !== gauge) return;
		if (event.animationName === 'hit-ten-glow') {
			gauge.classList.remove('is-hit-ten');
		}
	});
	equation.addEventListener('animationend', (event) => {
		if (event.animationName !== 'hit-ten-glow') return;
		equation.classList.remove('is-hit-ten');
	});
	confirmBtn.addEventListener('click', confirm);
	document.addEventListener('keydown', onKeyDown, true);
	render();

	return {
		reset: resetInput,
		setA,
		setLocked,
	};
}
