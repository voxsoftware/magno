var Magno=core.org.voxsoftware.Magno
var Fs= core.System.IO.Fs
import Path from 'path'
class Config{
	

	constructor(file){
		this.$={}
		this.$.path= Path.dirname(file)
		this.$.config= require(file)
		this.$.file=file
	}


	get ovaFile(){
		return Path.join(this.$.path, this.box.localpath)
	}

	get box(){
		return this.$.config.box
	}


	get name(){
		return this.$.config.name
	}

	get description(){
		return this.$.config.description
	}

	writeFile(file){
		var def= JSON.parse(core.safeJSON.stringify(this.$.config.default))
		var data= core.safeJSON.stringify(def,null,'\t')
		Fs.sync.writeFile(file, data)
	}

	writeThis(file){
		var data= Fs.sync.readFile(this.$.file)
		Fs.sync.writeFile(file, data)
	}

}
export default Config