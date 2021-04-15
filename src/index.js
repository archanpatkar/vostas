// Placeholder
function unitpropgation(l, clauses) {
    // todo
}

function isunit(clause) {
    // todo
}

function ispure(clause) {
    // todo 
}

function pureliteralassign(l, clauses) {
    // todo
}

function chooseliteral(clauses) {
    // todo
}

function replaceVar(l,val,clauses) {
    // todo
}

const empty = new Set(null);

function dpll(clauses) {
    if(clauses.reduce((acc,v) => acc + v, 0)) return true;
    else if(clauses.includes(empty)) return false;
    const uc = clauses.filter(isunit);
    for(let l of uc) clauses = unitpropgation(l,clauses);
    const pl = clauses.filter(ispure);
    for(let l of pl) clauses = pureliteralassign(l,clauses);
    const l = chooseliteral(clauses);
    return dpll(replaceVar(l,true,clauses)) || dpll(replaceVar(l,false,clauses));
}