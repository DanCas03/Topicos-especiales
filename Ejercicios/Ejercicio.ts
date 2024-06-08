import { Either } from "./Either";

console.log("Hello via Bun!");


class OrdenCompra  {
    itemsOrden: ItemOrden[];
    cliente: Cliente;
    fecha: Date= new Date();
    

    constructor(itemsOrden: ItemOrden[], cliente: Cliente, fecha?: Date) {
        this.itemsOrden = itemsOrden;
        this.cliente = cliente;
        if (fecha) {
            this.fecha = fecha;
        }
    }

}

class ItemOrden  {
    producto: string;
    cantidad: number;
    precioLista: number;
    precioFinal: number;

    constructor(producto: string, cantidad: number, precioL: number, precioF?: number) {
        this.producto = producto;
        this.cantidad = cantidad;
        this.precioLista = precioL;
        if (precioF) {
            this.precioFinal = precioF;
        }else{
            this.precioFinal= precioL;
        }
    }


}

class Cliente  {
    nombre: string;
    direccion: Direccion;
    status: boolean;
    infoCrediticia?: number;
    telefono?: string;

    constructor(nombre: string, direccion: Direccion, status: boolean, infoCrediticia?: number, telefono?: string) {
        this.nombre = nombre;
        this.direccion = direccion;
        this.status = status;
        if (infoCrediticia) {
            this.infoCrediticia = infoCrediticia;
        }
        if (telefono) {
            this.telefono = telefono;
        }
    }

}

class Direccion  {
        pais : string;
        ciudad: string;
        calle: string;
        codPostal: string;

        constructor(pais: string, ciudad: string, calle: string, codPostal: string) {
            this.pais = pais;
            this.ciudad = ciudad;
            this.calle = calle;
            this.codPostal = codPostal;
            
        } 
}

abstract class Validador {
    siguienteValidador?: Validador;

    asignarSiguienteValidador(validador: Validador) {
        this.siguienteValidador = validador;
    }
    
    abstract validar(orden: OrdenCompra): Either<Error[], undefined>;
}

class ValidadorDireccion extends Validador{

    validar(orden: OrdenCompra): Either<Error[], undefined> {
        let errores: Error[] = [];
        if (orden.cliente.direccion.pais.length < 1) {
            errores.push(new Error("Pais no puede estar vacio"));
        }
        if(orden.cliente.direccion.codPostal.length < 1) {
            errores.push(new Error("Codigo postal no puede estar vacio"));
        }
        if(this.siguienteValidador){
            let validacion = this.siguienteValidador.validar(orden);
            if (validacion.isLeft()) {
                errores.push(...validacion.getLeft());
            }
        }
        if (errores.length > 0) {
            return Either.makeLeft(errores);
        } else {
            return Either.makeRight(undefined);
        }
    }

    
}

class ValidadorCliente extends Validador{
    validar(orden:OrdenCompra): Either<Error[], undefined> {
        let errores: Error[] = [];
        if (orden.cliente.nombre.length < 1) {
            errores.push(new Error("Nombre no puede estar vacio"));
        }
        if (!orden.cliente.direccion) {
            errores.push(new Error("La direccion no puede estar vacia"));
        }
        if (!orden.cliente.status) {
            errores.push(new Error("El status del cliente debe estar en activo para comprar"));
        }
        if(this.siguienteValidador){
            let validacion = this.siguienteValidador.validar(orden);
            if (validacion.isLeft()) {
                errores.push(...validacion.getLeft());
            }
        }
        if (errores.length > 0) {
            return Either.makeLeft(errores);
        } else {
            return Either.makeRight(undefined);
        }
    }
}

class ValidadorItems extends Validador{
    validar(orden: OrdenCompra): Either<Error[], undefined> {
        let errores: Error[] = [];
        if (orden.itemsOrden.length < 1) {
            errores.push(new Error("La orden no tiene items"));
        }else{
            for (let item of orden.itemsOrden) {
                let validacion = this.validarItem(item);
                if (validacion.isLeft()) {
                    errores.push(...validacion.getLeft());
                }
            }
        }
        if(this.siguienteValidador){
            let validacion = this.siguienteValidador.validar(orden);
            if (validacion.isLeft()) {
                errores.push(...validacion.getLeft());
            }
        }
        if (errores.length > 0) {
            return Either.makeLeft(errores);
        } else {
            return Either.makeRight(undefined);
        }
    }

    private validarItem(item: ItemOrden): Either<Error[], undefined> {
        
            let errores: Error[] = [];
            if (item.cantidad < 1) {
                errores.push(new Error("Cantidad debe ser mayor a 0"));
            }
            if (item.precioFinal < item.precioLista*0.8) {
                errores.push(new Error("El precio no puede ser 20% menor al precio de lista"));
            }
            if (errores.length > 0) {
                return Either.makeLeft(errores);
            } else {
                return Either.makeRight(undefined);
            }
        
    }
}

let direccion = new Direccion("Mexico", "CDMX", "Calle 123", "12345");
let cliente = new Cliente("Juan", direccion, true);
let item = new ItemOrden("Producto1", 1, 100);
let item2 = new ItemOrden("Producto2", 1, 100, 90);
let date = new Date();
let orden = new OrdenCompra([item,item2], cliente, date);

let validadorDireccion = new ValidadorDireccion();
let validadorCliente = new ValidadorCliente();
let validadorItems = new ValidadorItems();

validadorDireccion.asignarSiguienteValidador(validadorCliente);
validadorCliente.asignarSiguienteValidador(validadorItems);

let validacion = validadorDireccion.validar(orden);
if (validacion.isLeft()) {
    console.log("Errores: ", validacion.getLeft());
} else {
    console.log("Orden valida");
}

