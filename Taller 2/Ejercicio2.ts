

interface iMensaje {  //Clase abstractade la que heredan las demas
    titulo:string;
    texto:string;
    mostrarMensaje():void;
}
class Mensaje implements iMensaje{ //El mensaje base al que se puede decorar
    titulo:string;
    texto:string;

    constructor(titulo:string, texto:string){
        this.titulo = titulo;
        this.texto = texto;
    }

    mostrarMensaje(): void {
        console.log(this.titulo + " \n\t" +this.texto);
    }
}
abstract class DecoradorDeMensaje implements iMensaje{// Clase abstracta base de los decoradores
    titulo:string;
    texto:string;
    mensaje: iMensaje;

    protected constructor(mensaje:iMensaje){
        this.titulo = mensaje.titulo;
        this.texto = mensaje.texto;
        this.mensaje = mensaje as Mensaje;
    }

    abstract mostrarMensaje(): void 
}

class PrefijoTitulo extends DecoradorDeMensaje{ //DecoradorDeMensaje que agrega prefijo al titluo
    prefijo:string;
    
    constructor(mensaje:iMensaje, prefijo:string){
        super(mensaje);
        this.prefijo = prefijo;
    }
    
    mostrarMensaje(): void {
        this.mensaje.titulo= this.prefijo+" "+this.mensaje.titulo;
        this.mensaje.mostrarMensaje();
    }    
}

class SufijoTitulo extends DecoradorDeMensaje{// DecoradorDeMensaje que agrega sufijo al titulo
    sufijo:string;
    
    constructor(mensaje:iMensaje, sufijo:string){
        super(mensaje);
        this.sufijo = sufijo;
    }
    
    mostrarMensaje(): void {
        this.mensaje.titulo = this.mensaje.titulo+" "+this.sufijo;
        this.mensaje.mostrarMensaje();
    }
}

class FirmaTexto extends DecoradorDeMensaje { //DecoradorDeMensaje que le agrega al texto una firma al final (como cuando se escribe un correo y al final se coloca su firma, indicando nombres y otros datos personales)
    firma: string;

    constructor(mensaje:iMensaje, firma: string) {
        super(mensaje);
        this.firma = firma;
    }

    mostrarMensaje(): void {
        this.mensaje.texto = this.mensaje.texto + "\n" + this.firma;
        this.mensaje.mostrarMensaje();
    }
}

class EncabezadoTexto extends DecoradorDeMensaje { // DecoradorDeMensaje que le agrega al texto un encabezado
    encabezado: string;

    constructor(mensaje:iMensaje, encabezado: string) {
        super(mensaje);
        this.encabezado = encabezado;
    }

    mostrarMensaje(): void {
        this.mensaje.texto = this.encabezado + "\n\t" + this.mensaje.texto;
        this.mensaje.mostrarMensaje();
    }
}

{
    const mensajito = new Mensaje("Taller2", "Este es un mensaje de prueba para el ejercicio 2");
    mensajito.mostrarMensaje();
    console.log("\n");
    const mensajitoConPrefijo = new PrefijoTitulo(mensajito, "Re: ");
    mensajitoConPrefijo.mostrarMensaje();
    console.log("\n");
    const mensajitoConSufijo = new SufijoTitulo(mensajito, " - Reenviado");
    mensajitoConSufijo.mostrarMensaje();
    console.log("\n");
    const mensajitoConFirma = new FirmaTexto(mensajito, "David Hidalgo y Daniel Castellanos");
    mensajitoConFirma.mostrarMensaje();
    console.log("\n");
    const mensajitoConEncabezado = new EncabezadoTexto(mensajito, "Buenas noches profesor");
    mensajitoConEncabezado.mostrarMensaje();
}