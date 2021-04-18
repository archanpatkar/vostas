const fs = require("fs");
const {equal} = require("saman");
const {sum, tagged} = require("styp");

const white = [" ", "\n", "\b", "\t", "\r"];
function isWhite(c) {
    return white.includes(c);
}

const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
function isNumber(c) {
    return digits.includes(c);
}

function isAlphabet(c) {
    if (c) {
        const av = c.charCodeAt(0);
        return av >= "a".charCodeAt(0) && av <= "z".charCodeAt(0) ||
            av >= "A".charCodeAt(0) && av <= "Z".charCodeAt(0);
    }
    return false;
}

function isBool(s) {
    return s == "true" || s == "false";
}

function parseI(str,brackets=["(",")"]) {
    let curr = str[0];
    if(isWhite(curr)) {
        str.shift();
        curr = str[0];
        while(isWhite(curr)) {
            str.shift();
            curr = str[0];
        }
    }
    if(curr === brackets[0]) {
        str.shift();
        const out = [];
        let curr = str[0];
        while(curr !== brackets[1]) {
            out.push(parseI(str,brackets))
            curr = str[0];
        }
        str.shift();
        if(curr !== brackets[1]) throw new Error(`Expected ${brackets[1]}`);
        return out;
    }
    if(isAlphabet(curr) || curr === "_") {
        buff = str.shift();
        curr = str[0]; 
        while(isAlphabet(curr) || isNumber(curr) || curr === "_") {
            str.shift();
            buff += curr;
            curr = str[0];
        }
        if(isBool(buff)) return buff == "true"?true:false;
        return buff;
    }
    return curr;
}

function parse(str,brackets=["(",")"]) {
    if(typeof str === "string") str = str.split("");
    const final = [];
    while(str.length > 0) {
        const out = parseI(str,brackets);
        if(out) final.push(out);
    }
    return final;
}

// Currently written in an simple but slow and unoptimized way will make it efficient later
const Formula = sum("Formula", {
    Var:["name"],
    And:["oprs"],
    Or:["oprs"],
    Imp:["oprs"],
    Bi:["oprs"],
    Not:["v"]
});

const Clause = sum("Clause", {
    Lit:["name","neg"],
    Clause: ["lits"]
});

const ops = ["and", "or", "imp", "bicon"];
const opsmaps = {
    "and":"And",
    "or":"Or",
    "imp": "Imp",
    "bicon": "Bi",
    "not": "Not"
};

Formula.fromSexps = function(sexp) {
    if(typeof sexp === "boolean") return sexp;
    if(typeof sexp === "string") return Formula.Var(sexp);
    if(typeof sexp[0] === "string") {
        if(sexp[0] === "not") 
            return Formula.Not(Formula.fromSexps(sexp[1]));
        if(ops.includes(sexp[0])){
            const oprs = [];
            for(let i = 1;i < sexp.length;i++) oprs.push(Formula.fromSexps(sexp[i]))
            return Formula[opsmaps[sexp[0]]](oprs);
        }
    }
    for(let i = 0;i < sexp.length;i++) 
        sexp[i] = Formula.fromSexps(sexp[i]);
    return sexp;
};

Formula.prototype.convert = function() {
    // WIP
    // Convert to cnf
    return this.cata({
        Var: ({ name }) => Clause.Lit(name,false),
        And: ({ oprs }) => [oprs.map(o => Formula.is(o)?o.convert():o)].flat(),
        Or: ({ oprs }) => {
            const ands = oprs.filter(v => Formula.And.is(v));
            const notands = oprs.filter(v => !ands.includes(v));
            if(ands.length === 0) return Clause.Clause(oprs.map(o => Formula.is(o)?o.convert():o));
            // console.log(ands.toString());
            // console.log(notands.toString());
            const out = [];
            for(let a of ands) {
                for(let e of a.oprs) out.push(Formula.Or([...notands,e]));
            }
            return Formula.And(out).convert();
        },
        Imp: ({ oprs }) => {
            let current = Formula.Not(oprs[0]);
            for(let i = 1; i < oprs.length; i++) {
                if((i % 2) === 0) current = Formula.Not(current);
                else current = Formula.Or([current, oprs[i]]);
            }
            return current.convert();
        },
        Bi: ({ oprs }) => {
            let current = oprs[0];
            for(let i = 1; i < oprs.length; i++) {
                current = Formula.And(
                    Formula.Or([current, Formula.Not(oprs[i])]),
                    Formula.Or([Formula.Not(current), oprs[i]])
                );
            }
            return current.convert();
        },
        Not: ({ v }) => {
            return v.cata({
                Var: ({ name }) => Clause.Lit(name,true),
                Not: ({ v }) => v.convert(),
                And: ({ oprs }) => Formula.Or(oprs.map(e => Formula.Not(e).convert())).convert(),
                Or: ({ oprs }) => Formula.And(oprs.map(e => Formula.Not(e).convert())).convert(),
            });
        }
    });
};

function printFormula(f) {
    if(Array.isArray(f)) return f.map(printFormula).join("\n");
    if(Formula.Var.is(f)) return f.name;
    if(Formula.Not.is(f)) return `¬${printFormula(f.v)}`;
    if(Formula.Or.is(f)) return `(${f.oprs.map(printFormula).join(" ∨ ")})`;
    if(Formula.And.is(f)) return `(${f.oprs.map(printFormula).join(" ∧ ")})`;
    if(Formula.Imp.is(f)) return `(${f.oprs.map(printFormula).join(" → ")})`;
    if(Formula.Bi.is(f)) return `(${f.oprs.map(printFormula).join(" ↔ ")})`;
}

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

function main(args) {
    console.log("Reading...");
    const code = fs.readFileSync(args[0]).toString();
    const formulaes = Formula.fromSexps(parse(code));
    console.log(printFormula(formulaes));
    console.log("Checking SAT...");
    const clauses = formulaes.map(f => f.convert()).flat();
    console.log(printClause(clauses));
    const sat = dpll(clauses);
    if(sat) console.log("SAT");
    else console.log("UNSAT");
}

const args = process.argv.slice(2);
if(args.length > 0) main(args);

module.exports = {
    dpll,
    printClause,
    Clause, 
    Formula,
    printFormula,
    parse
};