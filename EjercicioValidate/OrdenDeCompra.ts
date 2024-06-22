import { Either } from "../Either";

console.log("Hello via Bun!");


export class OrdenCompra  {
    itemsOrden: ItemOrden[];
    cliente: Cliente;
    fecha: Date= new Date();
    id?: string;
    

    constructor(itemsOrden: ItemOrden[], cliente: Cliente, fecha?: Date, id?: string) {
        this.itemsOrden = itemsOrden;
        this.cliente = cliente;
        if (fecha) {
            this.fecha = fecha;
        }
        if (id) {
            this.id = id;
        }else{
            this.id = Math.random().toString(36).substring(2);
        }
    }

}

export class ItemOrden  {
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

export class Cliente  {
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

export class Direccion  {
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

