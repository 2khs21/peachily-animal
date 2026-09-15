// 1번부터 10번. a = 시작 시 채워진 칸 수(1~9). 정답은 10 - a.
export const PROBLEMS = [
	{ a: 8 }, // 1번  8 + 2
	{ a: 7 }, // 2번  7 + 3
	{ a: 9 }, // 3번  9 + 1
	{ a: 5 }, // 4번  5 + 5
	{ a: 6 }, // 5번  6 + 4
	{ a: 4 }, // 6번  4 + 6
	{ a: 3 }, // 7번  3 + 7
	{ a: 2 }, // 8번  2 + 8
	{ a: 1 }, // 9번  1 + 9
	{ a: 8 }, // 10번 8 + 2
];

export function problemAt(index) {
	return PROBLEMS[index] ?? PROBLEMS[0];
}
