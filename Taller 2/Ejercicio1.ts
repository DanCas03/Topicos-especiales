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

    getvalue(): Optional<T> {
        return this.value;
    }

    setvalue(value: Optional<T>): void {
        this.value = value;
    }

    getbox(): Box<T> {
        return this.box;
    }

    setbox(box: Box<T>): void {
        this.box = box;
    }

    map<V>(f: (x: T) => V): Either<Error, Box<V>>{
        if (!this.value.hasValue()) {
            return Either.makeLeft(new Error("Existen cajas vacias"));
        }else{
            let tryValue: V;
            try{
                tryValue = f(this.value.getValue());
            }catch(e){
                return Either.makeLeft(new Error("Error en la funcion de mapeo"));
            }
            let newValue : Optional<V>= new Optional(tryValue);
            let newBox = new Box(newValue);

            if(this.box){
                let siguiente: Either<Error, Box<V>>;
                siguiente = this.box.map(f);
                if(siguiente.isLeft()){
                    return Either.makeLeft(siguiente.getLeft());
                }else{
                    newBox.setbox(siguiente.getRight());
                }
            }

            return Either.makeRight(newBox);
        }
    }
}   