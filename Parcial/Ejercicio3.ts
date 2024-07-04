class Nodo<T>{
    valor:T;
    siguientes:Nodo<T>[];

    constructor(valor:T){
        this.valor = valor;
        this.siguientes = [];
    }

    agregarSiguiente(nodo:Nodo<T>){
        this.siguientes.push(nodo);
    }

    map<Tmap>(f:(x:T)=>Tmap):Nodo<Tmap>{
        let nuevo = new Nodo(f(this.valor));
        for(let x of this.siguientes){
            nuevo.agregarSiguiente(x.map(f));
        }
        return nuevo;
    }

    //para testeo
    print(){
        console.log(this.valor);
        for(let x of this.siguientes){
            x.print();
        }
    }


}

let n1 = new Nodo(1);
let n2 = new Nodo(2);
let n3 = new Nodo(3);
let n4 = new Nodo(4);
let n5 = new Nodo(5);
let n6 = new Nodo(6);
let n7 = new Nodo(7);
let n8 = new Nodo(8);

n1.agregarSiguiente(n2);
n1.agregarSiguiente(n3);
n2.agregarSiguiente(n4);
n2.agregarSiguiente(n6);
n3.agregarSiguiente(n5);
n4.agregarSiguiente(n7);
n5.agregarSiguiente(n8);
n5.agregarSiguiente(new Nodo(9))

n1.print();
console.log("Multiplica por 2: \n");
n1.map(x => x*2).print();
console.log("Pasa a string: \n");
n1.map(x => x+" ahora es string").print();

