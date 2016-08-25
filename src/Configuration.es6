
var Fs= core.System.IO.Fs
import Path from 'path'
class Configuration{
		
	constructor(file){
		if(!file)
			file= Configuration.configFile


		this.$= {}
		this.$.config= require(file)
		this.$.configPath= Path.dirname(file)
		this.$.configFile= file

	}

	getConfigFile(name){
		return Path.join(this.directory, name, "machine.config.json")
	}

	get directory(){
		return this.$.configPath
	}

	get path(){
		return this.$.configFile
	}


	haveMachine(name){
		var configDir= Path.join(this.directory, name, "machine.config.json")
		if(!Fs.sync.exists(configDir))
			return false
		return true
	}




	static get configDir(){
		var home= process.env.HOME || process.env.USERPROFILE
		home= Path.join(home, '.magno')
		if(!Fs.sync.exists(home))
			Fs.sync.mkdir(home)
		return home
	}

	static get defaultData(){
		return {
			"firsttime": new Date(), 
			"machines":[]
		}
	}

	static get configFile(){
		
		var configdir= this.configDir
		var config= Path.join(configdir, "config.json")
		if(!Fs.sync.exists(config))
			Fs.sync.writeFile(config, core.safeJSON.stringify(Configuration.defaultData,null,'\t'))
		
		return config
	}
}
export default Configuration