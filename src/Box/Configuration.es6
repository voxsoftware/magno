var Magno=core.org.voxsoftware.Magno
var Fs= core.System.IO.Fs
import Path from 'path'
class Config{
	

	constructor(file){
		this.$={}
		this.$.path= Path.dirname(file)
		this.$.config= require(file)
		this.$.file= file

		this.$.boxfile= Path.join(this.$.path, "magno.config.json")
		this.$.public= Path.join(this.$.path, "public")
		if(!Fs.sync.exists(this.$.public))	
			Fs.sync.mkdir(this.$.public)


		this.$.publicFile= Path.join(this.$.public, "machine.config.json")
		if(!Fs.sync.exists(this.$.publicFile)){
			Fs.sync.writeFile(this.$.publicFile, JSON.stringify({
				sites:[
				]
			}, null, '\t'))
		}


		if(this.publicConfig.sites){
			// Esta parte es para permitir colocar sitios desde la máquina
			// virtual y no solo desde afuera ...
			this.$.config.sites= this.$.config.sites||[]
			this.$.config.sites= this.$.config.sites.concat(this.publicConfig.sites)
		}


	}

	get boxConfig(){
		if(!this.$.boxconfig)
			this.$.boxconfig= require(this.$.boxfile)
		return this.$.boxconfig
	}

	get publicConfig(){
		if(!this.$.publicconfig)
			this.$.publicconfig=require(this.$.publicFile)

		return this.$.publicconfig
	}



	get publicConfigDirectory(){
		return this.$.public
	}
	
	get name(){
		return this.$.config.name
	}

	get description(){
		return this.$.config.description
	}


	get user(){
		return this.$.config.user
	}

	get password(){
		return this.$.config.password
	}

	get ip(){
		return this.$.config.ip
	}

	get memory(){
		return this.$.config.memory

	}

	get cpus(){
		return this.$.config.cpus
	}

	get folders(){
		return this.$.config.folders
	}


	get sites(){
		return this.$.config.sites
	}

}
export default Config