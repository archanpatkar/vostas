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

Clause.prototype.replace = function(varn, val) {
    return this.cata({
        Lit: ({ name, neg }) => name === varn? (neg?!val:val):Clause.Lit(name,neg),
        Clause: ({ lits }) => Clause.Clause(lits.map(v => Clause.is(v)?v.replace(varn,val):v)),
    });
};

Clause.prototype.reduce = function(i) {
    return this.cata({
        Lit: ({ name, neg }) => name === varn? (neg?!val:val):Clause.Lit(name,neg),
        Clause: ({ lits }) => Clause.Clause(lits.map(v => Clause.is(v)?v.replace(varn,val):v)),
    });
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

// Placeholder
function unitpropgation(l, clauses) {
    // todo
}

function ispure(clause) {
    // todo 
}

function pureliteralassign(l, clauses) {
    // todo
}


function replaceVar(l,val,clauses) {
    // todo
}

// const empty = new Set(null);

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

function chooseliteral(clause) {
    // console.log("Choosing Literal");
    // console.log(clause);
    if(Clause.Clause.is(clause)) {
        for(let c of clause.lits) {
            if(Clause.Lit.is(c)) return c.name;
            if(typeof c === "bool" && c) {
                // console.log("found bool in formula");
                return c;
            }
        }
        // console.log("after")
    }
    throw new Error("Expected Clause!");
}

function dpll(clause) {
    if(typeof clause === "bool") return clause;
    if(Array.isArray(clause)) return clause.reduce((acc,v) => acc && dpll(v),true);
    if(Clause.Clause.is(clause) && clause.lits.includes(true)) return true;
    else {
        const lit = chooseliteral(clause);
        // console.log("The choosen literal is:" + lit);
        if(typeof lit === "bool") return lit;
        const ct = clause.replace(lit,true);
        // console.log(printClause(ct));
        const cf = clause.replace(lit,false);
        // console.log(printClause(cf));
        return dpll(ct) || dpll(cf);
    }
}


const test1 = [
    Clause.Clause([Clause.Lit("a",false),Clause.Lit("b",false)]),
    Clause.Clause([Clause.Lit("b",true),Clause.Lit("c",false)])
];

console.log(printClause(test1));
console.log(dpll(test1));