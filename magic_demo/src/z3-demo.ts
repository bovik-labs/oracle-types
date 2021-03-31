import { Plus, LessEq, infer } from './z3';

function test_cases(x: LessEq<5>) {

  //// Error, because <= x (+ 2 3) is not the same as <= x 5!
  { const bad: LessEq<Plus<2, 3>> = x; }

  // However:
  { const good: LessEq<Plus<2, 3>> = infer(x); }

  //// Error, because not sound to infer <= (+ 2 2) from <= 5!
  { const bad: LessEq<Plus<2, 2>> = infer(x); }

  // <= 5 implies <= 6
  { const good: LessEq<Plus<2, 4>> = infer(x); }

}
