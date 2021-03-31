// Strip trailing newline from a string literal type
type StripNl<T extends string> = T extends `${infer S}\n` ? S : T;

// Given a string type containing an sexp expressing a z3 program,
// return 'sat' or 'unsat'
type SolverResult<Z3 extends string> =
  StripNl<Shell<`echo '${Z3}' | z3 -in`>>;

// A phantom type used to express constraints about integer values
type Constr<T> = { constr: T };

// An integer value so constrained
type ConstrNum<T> = number & Constr<T>;

// Generate a Z3 assertion for constraint T
type GenAssert<T> = T extends string ? `(${T})` : 'false';

// Generate Z3 code that checks whether T implies U.
// Z3 will return 'unsat' if the implication *does* hold,
// because T && !U will be false.
type GenZ3<T, U> = `
(declare-const x Int)
(assert ${GenAssert<T>})
(assert (not ${GenAssert<U>}))
(check-sat)
`;

// If T => U, yields the appropriate result type for constraint U, otherwise unknown.
type InferCond<T, U> = SolverResult<GenZ3<T, U>> extends 'unsat' ? ConstrNum<U> : unknown;

// Convert x from one constraint type to another
export function infer<T, U>(x: ConstrNum<T>): InferCond<T, U> {
  return x as any;
}

type strish = string | number;
export type Plus<T extends strish, U extends strish> = `(+ ${T} ${U})`;
export type LessEq<T extends strish> = ConstrNum<`<= x ${T}`>;
