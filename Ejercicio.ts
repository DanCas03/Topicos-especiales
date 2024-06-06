import { Either } from "./Either";

console.log("Hello via Bun!");

interface ValidarOrden{
    
validar(): Either<Error[], undefined>;

}
class OrdenCompra implements ValidarOrden{
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

    validar(): Either<Error[], undefined> {
    let errores: Error[] = [];
    if (this.itemsOrden.length < 1) {
        errores.push(new Error("La orden no tiene items"));
    }else{
        for (let item of this.itemsOrden) {
            let validacion = item.validar();
            if (validacion.isLeft()) {
                errores.push(...validacion.getLeft());
            }
        }
    }
    if(this.cliente.validar().isLeft()){
        errores.push(...this.cliente.validar().getLeft());
    }
    if (errores.length > 0) {
        return Either.makeLeft(errores);
    } else {
        return Either.makeRight(undefined);
    }

}
    }

class ItemOrden implements ValidarOrden{
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

    validar(): Either<Error[], undefined> {
        let errores: Error[] = [];
        if (this.cantidad < 1) {
            errores.push(new Error("Cantidad debe ser mayor a 0"));
        }
        if (this.precioFinal < this.precioLista*0.8) {
            errores.push(new Error("El precio no puede ser 20% menor al precio de lista"));
        }
        if (errores.length > 0) {
            return Either.makeLeft(errores);
        } else {
            return Either.makeRight(undefined);
        }
    }

}

class Cliente implements ValidarOrden{
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
    validar(): Either<Error[], undefined> {
        let errores: Error[] = [];
        if (this.nombre.length < 1) {
            errores.push(new Error("Nombre no puede estar vacio"));
        }
        if (!this.direccion) {
            errores.push(new Error("La direccion no puede estar vacia"));
        }else{
            let validacion = this.direccion.validar();
            if (validacion.isLeft()) {
                errores.push(...validacion.getLeft());
            }
        }
        if (!this.status) {
            errores.push(new Error("El status del cliente debe estar en activo para comprar"));
        }
        if (errores.length > 0) {
            return Either.makeLeft(errores);
        } else {
            return Either.makeRight(undefined);
        }
    }
}

class Direccion implements ValidarOrden{
    pais : string;
    ciudad: string;
    calle: string;
    codPostal: string;
    validador: ValidadorDireccion;

    constructor(pais: string, ciudad: string, calle: string, codPostal: string, validador: ValidadorDireccion) {
        this.pais = pais;
        this.ciudad = ciudad;
        this.calle = calle;
        this.codPostal = codPostal;
        this.validador= validador;
    }
    validar(): Either<Error[], undefined> {
        let errores: Error[] = [];
        if (this.pais.length < 1) {
            errores.push(new Error("Pais no puede estar vacio"));
        }
        if(this.codPostal.length < 1) {
            errores.push(new Error("Codigo postal no puede estar vacio"));
        }
        if (errores.length > 0) {
            return Either.makeLeft(errores);
        } else {
            return Either.makeRight(undefined);
        }
    }

    
    
    }
    abstract class Validador {
        
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
            if (errores.length > 0) {
                return Either.makeLeft(errores);
            } else {
                return Either.makeRight(undefined);
            }
        }
    }

    class ValidadorCliente{
        validar(orden:OrdenCompra): Either<Error[], undefined> {
            let errores: Error[] = [];
            if (orden.cliente.nombre.length < 1) {
                errores.push(new Error("Nombre no puede estar vacio"));
            }
            if (!orden.cliente.direccion) {
                errores.push(new Error("La direccion no puede estar vacia"));
            }else{
                let validacion = orden.cliente.direccion.validador.validar(orden);
                if (validacion.isLeft()) {
                    errores.push(...validacion.getLeft());
                }
            }
            if (!orden.cliente.status) {
                errores.push(new Error("El status del cliente debe estar en activo para comprar"));
            }
            if (errores.length > 0) {
                return Either.makeLeft(errores);
            } else {
                return Either.makeRight(undefined);
            }
        }
    }