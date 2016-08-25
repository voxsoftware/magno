// package: virtual-vox
var Vbox= core.org.voxsoftware.VirtualBox

var Magno=core.org.voxsoftware.Magno
var Fs= core.System.IO.Fs
import Path from 'path'
class Machine{
	

	constructor(magno, config){
		this.magno= magno
		this.config= config
	}

	get name(){
		return this.config.name
	}


	get virtualBox(){
		if(!this.$virtualBox)
			this.$virtualBox= new Vbox.Manager()

		return this.$virtualBox
	}


	async install(){


		// Instalar máquina virtual ...
		var manager= this.virtualBox
		await manager.import({
			"path": this.config.ovaFile,
			"name": this.name
		})
		
		var path= Path.join(this.magno.config.directory, this.name)
		// Crear directorio ...
		if(!Fs.sync.exists(path))
			Fs.sync.mkdir(path)



		
		this.config.writeFile(Path.join(path, "machine.config.json"))
		this.config.writeThis(Path.join(path, "magno.config.json"))

	}


}

export default Machine