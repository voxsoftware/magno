var Vbox= core.org.voxsoftware.VirtualBox
var Magno= core.org.voxsoftware.Magno
// Esta clase 
class Manager{

	constructor(machine){
		this.machine=machine
	}
	
	static fromMachine(machine){
		var config= machine.boxConfig
		// Puede venir en el archivo de configuración si es .es6
		if(config.settingManager)
			return new config.settingManager(machine)

		else if(config.os.indexOf("linux")>-1)
			return new Magno.Box.Settings.Linux(machine)
		/*
		else
			throw new core.System.NotImplementedException()
		*/
		return Manager.default
	}

	static default(){
		if(!Manager.$default)
			Manager.$default=new Manager()
		return Manager.$default
	}


	configure(){
		// Configurar parámetros como la IP y los sitios ...
		
	}

}
export default Manager