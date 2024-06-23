import { Either } from "../Either"
import { Optional } from "../Optional"

class Box<T> {
    private value: Optional<T>; //Valor de cada Box
    private box: Box<T>; //La Box que puede tener dentro

    constructor(value: Optional<T>, box?: Box<T>) {
        this.value = value;
        if (undefined!=box)
                this.box = box
    }

    getValue(): Optional<T> { // setters y getters
        return this.value;
    }

    setValue(value: Optional<T>): void {
        this.value = value;
    }

    getBox(): Box<T> {
        return this.box;
    }

    setBox(box: Box<T>): void {
        this.box = box;
    }

    public mapLleno<V>(f: (x: T) => V): Either<Error, Box<V>>{ //Devuelve un either con el error o el nuevo Box
        if (!this.value.hasValue()) {
            return Either.makeLeft(new Error("Existen cajas vacías")); //Si una de las cajas está vacía directamente devuelve un error
        }else{
            let tryValue: V;
            try{
                tryValue = f(this.value.getValue());
            }catch(e){
                return Either.makeLeft(new Error("Error en la función de mapeo: \n"+e));//Si hay un error en la función de mapeo devuelve un error
            }
            let newValue : Optional<V>= new Optional(tryValue);
            let newBox = new Box(newValue);
            if(this.box){ //Si todo va bien, se mapea la caja interna (si existe)
                let siguiente: Either<Error, Box<V>>;
                siguiente = this.box.mapLleno(f);
                if(siguiente.isLeft()){ //Verifica si hay un error en una de las cajas internas
                    return Either.makeLeft(siguiente.getLeft());//Si hay un error devuelve el primer error  que encuentre
                }else{
                    newBox.setBox(siguiente.getRight()); //Si no hay errores, se setea la caja interna
                }
            }
            return Either.makeRight(newBox); //Si todo va bien, devuelve el nuevo Box
        }
    }
    public map<V>(f: (x: T) => V): Either<Error, Box<V>>{ //Devuelve un either con el error o el nuevo Box
        let newBox: Box<V>;
        if (!this.value.hasValue()) {
            newBox = new Box(new Optional<V>()); //Si una de las cajas está vacía, se crea un nuevo Box vacío
        }else{
            let tryValue: V;
            try{
                tryValue = f(this.value.getValue());
            }catch(e){
                return Either.makeLeft(new Error("Error en la función de mapeo: \n"+e));//Si hay un error en la función de mapeo devuelve un error
            }
            let newValue : Optional<V>= new Optional(tryValue);
            newBox = new Box(newValue);
        }
        if(undefined!=this.box){ //Si todo va bien, se mapea la caja interna (si existe)
            let siguiente: Either<Error, Box<V>>;
            siguiente = this.box.map(f);
            if(siguiente.isLeft()){ //Verifica si hay un error en una de las cajas internas
                return Either.makeLeft(siguiente.getLeft());//Si hay un error devuelve el primer error  que encuentre
            }else{
                newBox.setBox(siguiente.getRight()); //Si no hay errores, se setea la caja interna
            }
        }
        return Either.makeRight(newBox); //Si todo va bien, devuelve el nuevo Box
    }
}

function logBox<T>(box: Box<T>): void { //Función para recorrer la caja
    let currentBox = box;
    let cont:number=0;
    while (currentBox) { //Se recorre la caja
        cont++;
        if (currentBox.getValue().hasValue()) {
            console.log("Caja",cont,"Valor:",currentBox.getValue().getValue());
        }else {
            console.log("Caja",cont,"Valor vacía" );
        }
        currentBox=currentBox.getBox();
    }
}

{
console.log("Ejercicio 1: \n");
let abox:Box<number>= new Box(new Optional(), new Box(new Optional(3), new Box(new Optional(1), new Box(new Optional(4))))); //Se crea una caja con 4 cajas internas
let cont:number=0;
const f = (x: number) => x.toString(); //Función de mapeo
const result = abox.map(f); //Se mapea la caja
if(result.isLeft()){
    console.log(result.getLeft());
}else{
    logBox(result.getRight()); //Se recorre la caja
}
console.log("\n");
const g = (x: number) => {if (x === 6) throw Error("no puede ser 6"); return x.toString()+9;}; //Función de mapeo
const result2 = abox.map(g); //Se mapea la caja
result2.isLeft() ? console.error(result2.getLeft()) : logBox(result2.getRight()); //Se mapea la caja con una función que devuelve un error
console.log("\nFin \n");
}
