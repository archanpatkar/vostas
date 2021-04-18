const { dpll, Clause, Formula, printClause, printFormula, parse } = require("./index");

const test1 = [
    Clause.Clause([Clause.Lit("a",false),Clause.Lit("b",false)]),
    Clause.Clause([Clause.Lit("b",true),Clause.Lit("c",false)]),
    Clause.Lit("c",true)
];

const test2 = [
    Clause.Clause([Clause.Lit("a",false),Clause.Lit("b",true),Clause.Lit("c",true)]),
    Clause.Clause([Clause.Lit("a",false),Clause.Lit("c",false)]),
    Clause.Clause([Clause.Lit("b",false),Clause.Lit("c",true)])
];

let o1 = dpll(test1);
let o2 = dpll(test2);


// { ¬x1 ∨ ¬ x2, ¬x1 ∨ x2, x1 ∨ ¬x2, x2 ∨ ¬x3, x1 ∨ x3 }
const test3 = [
    Clause.Clause([Clause.Lit("x1",true),Clause.Lit("x2",true)]),
    Clause.Clause([Clause.Lit("x1",true),Clause.Lit("x2",false)]),
    Clause.Clause([Clause.Lit("x1",false),Clause.Lit("x2",true)]),
    Clause.Clause([Clause.Lit("x2",false),Clause.Lit("x3",true)]),
    Clause.Clause([Clause.Lit("x1",false),Clause.Lit("x3",false)])
];

// console.log("{ ¬x1 ∨ ¬x2, ¬x1 ∨ x2, x1 ∨ ¬x2, x2 ∨ ¬x3, x1 ∨ x3 }")
// console.log(printClause(test3));
let o3 = dpll(test3);


// { ¬x1 ∨ ¬x2, x1 ∨ ¬x2, ¬x1 ∨ ¬x3 }
const test4 = [
    Clause.Clause([Clause.Lit("x1",true),Clause.Lit("x2",true)]),
    Clause.Clause([Clause.Lit("x1",false),Clause.Lit("x2",true)]),
    Clause.Clause([Clause.Lit("x1",true),Clause.Lit("x3",true)])
];
let o4 = dpll(test4);

// { ¬x1 ∨ x3 ∨ x4, ¬x2 ∨ x6 ∨ x4, ¬x2 ∨ ¬x6 ∨ ¬x3,
//   ¬x4 ∨ ¬x2, x2 ∨ ¬x3 ∨ ¬x1, x2 ∨ x6 ∨ x3,
//   x2 ∨ ¬x6 ∨ ¬x4, x1 ∨ x5, x1 ∨ x6,
//   ¬x6 ∨ x3 ∨ ¬x5, x1 ∨ ¬x3 ∨ ¬x5 }
const test5 = [
    Clause.Clause([Clause.Lit("x1",true),Clause.Lit("x3",false),Clause.Lit("x4",false)]),
    Clause.Clause([Clause.Lit("x2",true),Clause.Lit("x6",false),Clause.Lit("x4",false)]),
    Clause.Clause([Clause.Lit("x2",true),Clause.Lit("x6",true),Clause.Lit("x3",true)]),
    Clause.Clause([Clause.Lit("x4",true),Clause.Lit("x2",true)]),
    Clause.Clause([Clause.Lit("x2",false),Clause.Lit("x3",true),Clause.Lit("x1",true)]),
    Clause.Clause([Clause.Lit("x2",false),Clause.Lit("x6",false),Clause.Lit("x3",false)]),
    Clause.Clause([Clause.Lit("x2",false),Clause.Lit("x6",true),Clause.Lit("x4",true)]),
    Clause.Clause([Clause.Lit("x1",false),Clause.Lit("x5",false)]),
    Clause.Clause([Clause.Lit("x1",false),Clause.Lit("x6",false)]),
    Clause.Clause([Clause.Lit("x6",true),Clause.Lit("x3",false),Clause.Lit("x5",true)]),
    Clause.Clause([Clause.Lit("x1",false),Clause.Lit("x3",true),Clause.Lit("x5",true)]),
];
// console.log(`
// { 
//   ¬x1 ∨ x3 ∨ x4, 
//   ¬x2 ∨ x6 ∨ x4,
//   ¬x2 ∨ ¬x6 ∨ ¬x3,
//   ¬x4 ∨ ¬x2, 
//   x2 ∨ ¬x3 ∨ ¬x1, 
//   x2 ∨ x6 ∨ x3,
//   x2 ∨ ¬x6 ∨ ¬x4, 
//   x1 ∨ x5, 
//   x1 ∨ x6,
//   ¬x6 ∨ x3 ∨ ¬x5, 
//   x1 ∨ ¬x3 ∨ ¬x5 
// }
// `)
// console.log(test5.map(printClause));

let o5 = dpll(test5);

const test6 = [
    Clause.Clause([Clause.Lit("tie",false),Clause.Lit("shirt",false)]),
    Clause.Clause([Clause.Lit("tie",true),Clause.Lit("shirt",false)]),
    Clause.Clause([Clause.Lit("tie",true),Clause.Lit("shirt",true)])
];
let o6 = dpll(test6);

console.log("Final SAT")
console.log(o1);
console.log(o2);
console.log(o3);
console.log(o4);
console.log(o5);
console.log(o6);

console.log(Formula.Not(Formula.Or([Formula.Var("a"),Formula.Var("b"),Formula.Not(Formula.Var("c"))])).convert().toString())
console.log(Formula.Or([Formula.Var("p"),Formula.And([Formula.Var("q"),Formula.Var("r")])]).convert().toString())

const f1 = Formula.fromSexps(parse(`(or (and x1 x2) x3 (not x5))`));
console.log(printFormula(f1));
console.log(printClause(f1.map(f => f.convert())[0]));
console.log(printClause(Formula.Or([Formula.Or([Formula.Var("x"), Formula.Var("y")]),Formula.Var("z")]).convert()));