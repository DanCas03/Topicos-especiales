
// Add the path to the module declaration file if it exists
import { Either } from "../EjercicioValidate/Either.ts";
import "../EjercicioValidate/OrdenDeCompra.ts";
import { Cliente, ItemOrden, OrdenCompra } from "../EjercicioValidate/OrdenDeCompra.ts";
//  interface IServiciosNOSEPUEDE<TServicio, _RService> {

// 	/**
// 	 * Ejecuta interfáz genérica de Servicios
// 	 */
// 	cosa(a: number): number;
// 	Execute(entrada: TServicio): number{
// 	return 1
// }
// }



interface IService<T, R> {

	/**
	 * Ejecuta interfáz genérica de Servicios
	 */
	Execute(entrada:T): Either<Error[],R>;
}

class CreateOrderParams{
	items: ItemOrden[];
    cliente: Cliente;
    fecha: Date;

    constructor(items: ItemOrden[], cliente: Cliente, fecha: Date) {
        this.items = items;
        this.cliente = cliente;
        this.fecha = fecha;
    }
	
}
type DeleateOrderParams={
	

}

class CreateOrderService implements IService<CreateOrderParams,void> {
	constructor() {
		
	}
	public Execute(params: CreateOrderParams): Either<Error[], void> {
		
        let ordenCreada:OrdenCompra = new OrdenCompra(params.items, params.cliente, params.fecha)

        

		return  ;
	}
}
class DeleateOrderService implements IService<DeleateOrderParams,void> {
	constructor() {
		
	}
	public Execute(_entrada: DeleateOrderParams): Either<Error[], void> {
		const a = new Error("arguments");
		return  Either.makeLeft([a]);
	}
}

class Logger {
	constructor() {
	}
	log(a:any){
		console.log(a);
	}
}

class LogginServiceDecorator<TService, RService> implements IService<TService, RService> {
	private readonly service: IService<TService, RService>
	private readonly logger: Logger
	constructor(servicio: IService<TService, RService>, loggeador: Logger) {
		this.service=servicio
		this.logger=loggeador
	}
	public Execute(_entrada: TService): Either<Error[], RService> {
		let r = this.service.Execute(_entrada);
		if (r.isLeft()) {
			this.logger.log(r.getLeft());
			return r;
			}
		return r;
	}
}

let creador = new CreateOrderService();
creador.Execute(new CreateOrderParams([new ItemOrden("Producto1", 1, 100),new ItemOrden("Producto2", 1, 100, 90)], new Cliente("Juan", new Direction("Mexico", "CDMX", "Calle 123", "12345"), true), new Date()));