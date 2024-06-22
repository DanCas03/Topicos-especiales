import { Either } from "../Either"
import { Optional } from "../Optional"

class Box<T> {
    private value: Optional<T>; //Valor de cada Box
    private box: Box<T>; //La Box que puede tener dentro

    constructor(value: Optional<T>, box?: Box<T>) {
        this.value = value;
        if (box)
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

    map<V>(f: (x: T) => V): Either<Error, Box<V>>{ //Devuelve un either con el error o el nuevo Box
        if (!this.value.hasValue()) {
            return Either.makeLeft(new Error("Existen cajas vacias")); //Si una de las cajas esta vacia direcatmente devuelve un error
        }else{
            let tryValue: V;
            try{
                tryValue = f(this.value.getValue());
            }catch(e){
                return Either.makeLeft(new Error("Error en la funcion de mapeo"));//Si hay un error en la funcion de mapeo devuelve un error
            }
            let newValue : Optional<V>= new Optional(tryValue);
            let newBox = new Box(newValue);

            if(this.box){ //Si todo va bien, se mapea la caja interna (si existe)
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
}   