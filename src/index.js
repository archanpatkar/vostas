const {equal} = require("saman");
const {sum, tagged} = require("styp");

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

function printClause(c) {
    if(Array.isArray(c)) {
        let str = "{";
        for(let cl in c) str += printClause(c[cl]) + (cl+1 < c.length?", ":"")
        str += "}"
        return str
    }
    if(Clause.Lit.is(c)) return `${c.neg?"¬":""}${c.name}`
    if(Clause.Clause.is(c)) {
        let str = "";
        for(let cl in c.lits) str += printClause(c.lits[cl]) + (cl+1 < c.lits.length?" ∨ ":"");
        return str
    }
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
    // console.log("Partial Interpretation")
    // console.log(i)
    return this.cata({
        // Clause.Lit(name,neg)
        Lit: ({ name, neg }) => (name in i)? (neg?!i[name]:i[name]):StillPartial,
        Clause: ({ lits }) => {
            let out = lits.map(v => Clause.is(v)?v.reduce(i):v)
                          .reduce((acc,v) => acc + v, 0);
            return typeof out === "number"?out?true:false:StillPartial;
        }
    });
}

Clause.prototype.eliminate = function(l) {
    return this.cata({
        Lit: curr => {
            if(curr.name === l.name && curr.neg === !l.neg) return null;
            return curr;
        },
        Clause: ({ lits }) => {
            let out = lits.filter(v => Clause.is(v)?v.eliminate(l):v)
                          .filter(v => v !== null);
            // console.log("eliminating:")
            // console.log(out);
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

// function cnf(formula) {
// }


// Formula.prototype.replace = function(varn, val) {
//     return this.cata({
//         Var: ({ name }) => name === varn? val: Formula.Var(name),
//         And: ({op1, op2}) => Formula.And(
//             Formula.is(op1)?op1.replace(varn,val):op1,
//             Formula.is(op1)?op2.replace(varn,val):op2
//         ),
//         Or: ({op1, op2}) => Formula.Or(
//             Formula.is(op1)?op1.replace(varn,val):op1,
//             Formula.is(op1)?op2.replace(varn,val):op2
//         ),
//         Not: ({ v }) => Formula.Not(Formula.is(v)?v.replace(varn,val):v)
//     });
// };

// function dpll(clauses) {
//     if(clauses.reduce((acc,v) => acc + v, 0)) return true;
//     else if(clauses.includes(empty)) return false;
//     const uc = clauses.filter(isunit);
//     for(let l of uc) clauses = unitpropgation(l,clauses);
//     const pl = clauses.filter(ispure);
//     for(let l of pl) clauses = pureliteralassign(l,clauses);
//     const l = chooseliteral(clauses);
//     return dpll(replaceVar(l,true,clauses)) || dpll(replaceVar(l,false,clauses));
// }

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
    console.log("Unit Propogation");
    console.log(clauses);
    const uc = clauses.filter(isunit);
    for(let v in i) {
        if(i[v]) uc.append(Clause.Lit(v,false))
        else uc.append(Clause.Lit(v,true))
    }
    console.log("Units ===>");
    console.log(uc)
    const out = clauses.filter(p => !uc.includes(p));
    for(let c in out) {
        console.log("here1:")
        console.log(out[c])
        for(let u of uc) {
            const r = out[c].eliminate(u);
            if(r !== null) out[c] = r;
        } 
    }
    console.log("Final Filtered");
    console.log(printClause(out));
    return {clauses: out, i};
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
    const purelits = Array.from(lits).filter(l => !notpure.has(l));
    let out = [];
    for(let c in out) {
        for(let u of purelits) {
            const r = out[c].eliminate(u);
            if(r !== null) out[c] = r;
        } 
    }
    console.log("object p ======>")
    console.log(p);
    for(let v of purelits) {
        i[v] = p[v]?false:true;
    }
    console.log(purelits);
    console.log(notpure);
    console.log("removing pure literals");
    console.log(out);
    return {clauses: out, i};
}

function dpll(clauses, i = {}) {
    console.log("Clauses ===>")
    console.log(printClause(clauses.map(p => p.replace(i))))
    console.log("Parital Interpretation ===>")
    console.log(i)
    const c = isconsistant(clauses,i);
    console.log("Is Consistent ===>")
    console.log(c);
    if((typeof c) === "boolean") return c;
    ({clauses, i} = unitpropgation(clauses,i));
    console.log("Parital Interpretation 1 ===>")
    console.log(i)
    if(isconsistant(clauses,i,true) === false) return false;
    ({clauses, i} = pure(clauses,i));
    console.log("Parital Interpretation 2 ===>")
    console.log(i)
    if(clauses.length === 0) return true;
    const lit = chooseliteral(clauses,i);
    console.log("Choosen Literal ===>")
    console.log(lit);
    const ct = Object.assign({},i)
    ct[lit] = true;
    console.log(ct)
    if(dpll(clauses,ct)) return true;
    const cf = Object.assign({},i)
    cf[lit] = false;
    console.log(cf)
    if(dpll(clauses,cf)) return true;
    return false;
}


const test1 = [
    Clause.Clause([Clause.Lit("a",false),Clause.Lit("b",false)]),
    Clause.Clause([Clause.Lit("b",true),Clause.Lit("c",false)]),
    Clause.Lit("c",true)
];

console.log(printClause(test1));
console.log(dpll(test1));