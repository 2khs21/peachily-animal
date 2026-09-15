const CELL_COUNT = 10;
const FILL_MS = 420;
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
			cell.classList.add('added');
			cell.textContent = String(position - a);
			return;
		}

		if (state.confirmed && total < 10) {
			cell.classList.add('warn');
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

	function copyText() {
		if (state.status === 'readyToLaunch' && sum() !== 10) {
			return COPY.retry;
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
		equation.classList.toggle(
			'is-wrong',
			state.status === 'readyToLaunch' && total !== 10
		);

		copyEl.textContent = copyText();
		confirmBtn.disabled = state.locked || state.status !== 'readyToLaunch';
		if (confirmBtn.disabled && document.activeElement === confirmBtn) {
			confirmBtn.blur();
		}
	}

	function stopFill() {
		if (state.fillTimer) {
			clearInterval(state.fillTimer);
			state.fillTimer = null;
		}
	}

	function resetInput() {
		stopFill();
		state.status = 'waitingInput';
		state.b = null;
		state.added = 0;
		state.confirmed = false;
		render();
	}

	function stepFill() {
		if (state.b == null) return;

		state.added += 1;
		if (state.added >= state.b) {
			stopFill();
			state.status = 'readyToLaunch';
		}
		render();
	}

	function startFill(digit) {
		state.status = 'fillingFuel';
		state.b = digit;
		state.added = 0;
		state.confirmed = false;
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

	confirmBtn.addEventListener('click', confirm);
	document.addEventListener('keydown', onKeyDown, true);
	render();

	return {
		reset: resetInput,
		setA,
		setLocked,
	};
}
