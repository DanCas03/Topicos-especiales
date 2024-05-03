function all <T>(l:T[], pred :(x:T)=>boolean):boolean{
    for (let item of l){
        if(!(pred(item))){
            return false;
        }
    }
    return true;
}

function first<T>(l:T[], pred :(x:T)=>boolean):T|undefined{
    for (let item of l){
        if(!(pred(item))){
            return item;
        }
    }
}