var Fs= core.System.IO.Fs
var MagnoNamespace= core.org.voxsoftware.Magno
import Path from 'path'
import {EventEmitter} from 'events'

class Magno extends EventEmitter{
	
	constructor(config){
		super()
		this.config=config
	}



	// Instala una nueva máquina virtual ...
	async install(dir){
		var configFile, stat= Fs.sync.stat(dir)
		if(stat.isFile()){
			configFile= dir
		}
		else{
			configFile= Path.join(dir, "magno.config.es6")
			if(!Fs.sync.exists(configFile))
				configFile= Path.join(dir, "magno.config.json")
		}

		
		var config= new MagnoNamespace.BoxInstallation.Configuration(configFile)
		if(this.config.haveMachine(config.name))
			throw new core.System.Exception("Ya hay una máquina de magno instalada con el nombre " + config.name)


		var box= new MagnoNamespace.BoxInstallation.Machine(this, config)
		await box.install()	

		return {
			"configDir": Path.join(this.config.directory, config.name),
			"configFile": Path.join(this.config.directory, config.name, "machine.config.json")
		}
	}


	machine(name){
		var configDir= Path.join(this.config.directory, name)
		if(!this.config.haveMachine(name))
			throw new core.System.Exception("La máquina " + name + " no se encuentra instalada")

		var configFile= this.config.getConfigFile(name)
		var config= new MagnoNamespace.Box.Configuration(configFile)
		var box= new MagnoNamespace.Box.Machine(this,config)
		return box
	}

	
}
export default Magno