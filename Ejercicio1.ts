abstract class Base{
    nombre: string;
    

    getNombre(): string{
        return this.nombre;
    }

    abstract getNAmbulancias(): number;

    abstract getTiempoMedio(): number;
}


class BaseOrdinaria extends Base{
    nAmbulancias: number;
    tiempoMedio: number;

    constructor(nombre: string, nAmbulancias: number, tiempoMedio: number){
        super();
        this.nombre = nombre;
        this.nAmbulancias = nAmbulancias;
        this.tiempoMedio = tiempoMedio;
    }

    getNAmbulancias(): number{
        return this.nAmbulancias;
    }

    getTiempoMedio(): number{
        return this.tiempoMedio;
    }
}

class BaseCompuesta extends Base{
    bases: Base[];

    constructor(nombre: string){
        super();
        this.nombre = nombre;
        this.bases = [];
    }

    agregarBase(base: Base){
        this.bases.push(base);
    }

    getNAmbulancias(): number {
        let nAmbulancias: number = 0;
        for(let base of this.bases){
            nAmbulancias += base.getNAmbulancias();
        }
        return nAmbulancias;
        
    }

    getTiempoMedio(): number{
        let tiempoMedio: number = 0;
        for(let base of this.bases){
            tiempoMedio += base.getTiempoMedio();
        }
        return tiempoMedio;
    }
}

let base1 = new BaseOrdinaria("Base 1", 2, 10);
let base2 = new BaseOrdinaria("Base 2", 3, 15);
