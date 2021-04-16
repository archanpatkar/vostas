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

const StillPartial = {};

Clause.prototype.reduce = function(i) {
    if(Object.keys(i).length === 0) null;
    // console.log("Partial Interpretation")
    // console.log(i)
    return this.cata({
        // Clause.Lit(name,neg)
        Lit: ({ name, neg }) => (name in i)? (neg?!i[name]:i[name]):StillPartial,
        Clause: ({ lits }) => {
            // console.log("lits ->")
            // console.log(lits);
            let out = lits.map(v => Clause.is(v)?v.reduce(i):v);
            console.log(out);
            out = out.reduce((acc,v) => acc + v, 0);
            console.log(out);
            if(typeof out === "number") return out?true:false;
            return StillPartial;
        },
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

function isconsistant(clauses,i) {
    // console.log("Checking if consistent");
    // console.log(clauses)
    let out = true;
    for(let c of clauses){
        const temp = c.reduce(i);
        console.log("temp: ")
        console.log(temp);
        if((typeof temp) !== "boolean") return temp;
        out = out && temp;
        if(!out) return false;
    }
    return out;
}

// if(Array.isArray(clause)) {
// return clause.reduce((acc,v) => acc && dpll(v),true);
// } 

function dpll(clauses, i = {}) {
    console.log("Clauses ===>")
    console.log(printClause(clauses.map(p => p.replace(i))))
    console.log("Parital Interpretation ===>")
    console.log(i)
    const c = isconsistant(clauses,i);
    console.log("Is Consistent ===>")
    console.log(c);
    if((typeof c) === "boolean") return c;
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
    Clause.Clause([Clause.Lit("b",true),Clause.Lit("c",false)])
];

console.log(printClause(test1));
// console.log(isconsistant(test1,{ a:false, b:false, c:false }));
// console.log(chooseliteral(test1,{}));
console.log(dpll(test1));