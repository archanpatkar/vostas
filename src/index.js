const {equal} = require("saman");
const {sum, tagged} = require("styp");

// Currently written in an simple but slow and unoptimized way will make it efficient later
const Formula = sum("Formula", {
    Var:["name"],
    And:["oprs"],
    Or:["oprs"],
    Not:["v"]
});

const Clause = sum("Clause", {
    Lit:["name","neg"],
    Clause: ["lits"]
});

Formula.prototype.convert = function() {
    // WIP
    // Convert to cnf
    return this.cata({
        Var: ({ name }) => Clause.Lit(name,false),
        And: ({ oprs }) => [oprs.map(o => o.convert())].flat(),
        Or: ({ oprs }) => {
            const out = [];
            const each = [oprs.map(o => o.convert())];
            const len = Math.max(...(each.map(a => a.length)));
            for(let i = 0;i < len; i++) {
                const f = []
                for(let j in each) {
                    const e = each[j][i];
                    console.log("here:")
                    console.log(e);
                    if(e) f.push(e);
                }
                if(f.length == 1) out.push(f[0]);
                else out.push(Clause.Clause(f));
            }
            return out;
        },
        Not: ({ v }) => {
            return v.cata({
                Var: ({ name }) => Clause.Lit(name,true),
                Not: ({ v }) => v.convert(),
                And: ({ oprs }) => Formula.And(oprs.map(e => Formula.Not(e))).convert(),
                Or: ({ oprs }) => Formula.Or(oprs.map(e => Formula.Not(e))).convert(),
            })
        }
    });
};

function printClause(c) {
    if(Array.isArray(c)) return `{ ${c.map(printClause).join(", ")} }`;
    if(Clause.Lit.is(c)) return `${c.neg?"¬":""}${c.name}`;
    if(Clause.Clause.is(c)) return c.lits.map(printClause).join(" ∨ ");
    return c;
}

Clause.prototype.replace = function(i) {
    return this.cata({
        Lit: ({ name, neg }) => (name in i)? (neg?!i[name]:i[name]):Clause.Lit(name,neg),
        Clause: ({ lits }) => Clause.Clause(lits.map(v => Clause.is(v)?v.replace(i):v)),
    });
};

const StillPartial = "Partial";

Clause.prototype.reduce = function(i) {
    if(Object.keys(i).length === 0) null;
    return this.cata({
        Lit: ({ name, neg }) => (name in i)? (neg?!i[name]:i[name]):StillPartial,
        Clause: ({ lits }) => {
            let out = lits.map(v => Clause.is(v)?v.reduce(i):v)
            if(out.includes(true)) return true;
            out = out.reduce((acc,v) => acc + v, 0);
            return typeof out === "number"?out?true:false:StillPartial;
        }
    });
}

Clause.prototype.in = function(l) {
    return this.cata({
        Lit: curr => {
            return curr.name === l.name && curr.neg === l.neg;
        },
        Clause: ({ lits }) => {
            let out = lits.map(v => Clause.is(v)?v.in(l):v);
            if(out.includes(true)) return true;
            return false;
        }
    });
}

Clause.prototype.eliminate = function(l) {
    return this.cata({
        Lit: curr => {
            if(curr.name === l.name) return null;
            return curr;
        },
        Clause: ({ lits }) => {
            let out = lits.map(v => Clause.is(v)?v.eliminate(l):v)
                          .filter(v => v !== null);
            if(out.length === 1) return out[0];
            if(out.length === 0) return null;
            return Clause.Clause(out);
        }
    });
}

function findLits(clauses) {
    if(Array.isArray(clauses)) return new Set(clauses.map(findLits).flat());
    if(Clause.Clause.is(clauses)) return clauses.lits.map(findLits);
    if(Clause.Lit.is(clauses)) return clauses.name;
    return 0;
}

function eliminate(clauses,lits) {
    if(lits.length == 0) return clauses;
    const out = [];
    for(let c in clauses) {
        for(let u of lits) {
            const r = clauses[c].eliminate(u);
            if(r !== null) out[c] = r;
        } 
    }
    return out;
}

function isconsistant(clauses,i,check_all=false) {
    let out = true;
    for(let c of clauses) {
        const temp = c.reduce(i);
        if((typeof temp) !== "boolean" && !check_all) return temp;
        out = temp;
        if(!out) return false;
    }
    return out;
}

function chooseliteral(clauses, i) {
    for(let clause of clauses) 
    {
        if(Clause.Clause.is(clause)) {
            for(let c of clause.lits)  {
                if(Clause.Lit.is(c) && !(c.name in i)) return c.name; 
            }
        }
        else if(!(clause.name in i)) return clause.name;
    }
}

function isunit(clause) {
    return Clause.Lit.is(clause);
}

function unitpropgation(clauses,i) {
    const uc = clauses.filter(isunit);
    for(let v in i) {
        if(i[v]) uc.push(Clause.Lit(v,false))
    }
    const out = clauses.filter(p => !uc.includes(p));
    return {clauses: eliminate(out,uc), i};
}

function pure(clauses,i) {
    const lits = findLits(clauses);
    const notpure = new Set();
    const p = {};
    for(let c of clauses) {
        if(Clause.Lit.is(c)) {
            if(c.name in p && p[c.name] !== c.neg) notpure.add(c.name);
            else p[c.name] = c.neg;
        }
        else {
            for(let lc of c.lits) {
                if(lc.name in p && p[lc.name] !== lc.neg) notpure.add(lc.name);
                else p[lc.name] = lc.neg;
            }
        }
    }
    const purelits = Array.from(lits)
                          .filter(l => !notpure.has(l))
                          .map(l => Clause.Lit(l,p[l]));
    for(let v of purelits) i[v.name] = p[v.name]?false:true;
    let out = clauses;
    if(purelits.length > 0) {
        out = [];
        for(let c of clauses) {
            let add = false;
            for(let l of purelits) {
                if(!c.in(l)) add = true;
                else add = false;
            }
            if(add) out.push(c);
        }
    }
    return {clauses: out, i};
}

function dpll(clauses, i = {}) {
    const c = isconsistant(clauses,i);
    if(typeof c === "boolean") return c;
    ({clauses, i} = unitpropgation(clauses,i));
    if(isconsistant(clauses,i,true) === false) return false;
    ({clauses, i} = pure(clauses,i));
    if(clauses.length === 0) return true;
    const lit = chooseliteral(clauses,i);
    const ct = Object.assign({},i)
    ct[lit] = true;
    if(dpll(clauses,ct)) return true;
    const cf = Object.assign({},i)
    cf[lit] = false;
    if(dpll(clauses,cf)) return true;
    return false;
}

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

console.log(printClause(Formula.Or([Formula.Or([Formula.Var("x"), Formula.Var("y")]),Formula.Var("z")]).convert()));