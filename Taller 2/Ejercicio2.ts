

abstract class AMensaje {  //Clase abstractade la que heredan las demas
     abstract mostrarMensaje():void;
}
class Mensaje extends AMensaje{ //El mensaje base al que se puede decorar
    titulo:string;
    texto:string;

    mostrarMensaje(): void {
        console.log(this.titulo + " \n" +this.texto);
    }
}
abstract class Decorador extends AMensaje{// Clase abstracta base de los decoradores
     mensaje:Mensaje;

    constructor(mensaje:Mensaje){
        super();
        this.mensaje = mensaje;
    }

    mostrarMensaje(): void {
        this.mensaje.mostrarMensaje();
    }
    
}


class PrefijoTitulo extends Decorador{ //Decorador que agrega prefijo al titluo
    prefijo:string;
    
    constructor(mensaje:Mensaje, prefijo:string){
        super(mensaje);
        this.prefijo = prefijo;
    }
    
    mostrarMensaje(): void {
        this.mensaje.titulo= this.prefijo+this.mensaje.titulo;
        this.mensaje.mostrarMensaje();
    }
    
}


class SufijoTitulo extends Decorador{// Decorador que agrega sufijo al titulo
    sufijo:string;
    
    constructor(mensaje:Mensaje, sufijo:string){
        super(mensaje);
        this.sufijo = sufijo;
    }
    
    mostrarMensaje(): void {
        this.mensaje.titulo = this.mensaje.titulo + this.sufijo;
        this.mensaje.mostrarMensaje();
    }
}

class FirmaTexto extends Decorador { //Decorador que le agrega al texto una firma al final (como cuando se escribe un correo y al final se coloca su firma, indicando nombres y otros datos personales)
    firma: string;

    constructor(mensaje: Mensaje, firma: string) {
        super(mensaje);
        this.firma = firma;
    }

    mostrarMensaje(): void {
        this.mensaje.texto = this.mensaje.texto + "\n" + this.firma;
        this.mensaje.mostrarMensaje();
    }
}

class EncabezadoTexto extends Decorador { // Decorador que le agrega al texto un encabezado
    encabezado: string;

    constructor(mensaje: Mensaje, encabezado: string) {
        super(mensaje);
        this.encabezado = encabezado;
    }

    mostrarMensaje(): void {
        this.mensaje.texto = this.encabezado + "\n" + this.mensaje.texto;
        this.mensaje.mostrarMensaje();
    }
}

