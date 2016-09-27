// package: virtual-vox
var Vbox= core.org.voxsoftware.VirtualBox
var Magno=core.org.voxsoftware.Magno
var Fs= core.System.IO.Fs

import {EventEmitter} from 'events'
import Path from 'path'
class Machine extends EventEmitter{
	

	constructor(magno, config){
		super()
		this.magno= magno
		this.config= config
	}

	get name(){
		return this.config.name
	}

	get boxConfig(){
		return this.config.boxConfig
	}

	get virtualBox(){
		if(!this.$virtualBox)
			this.$virtualBox= new Vbox.Manager()

		return this.$virtualBox
	}

	get machine(){
		if(!this.$machine)
			this.$machine= this.virtualBox.machine(this.name)

		return this.$machine
	}


	get settingManager(){

		if(!this.$settings)
			this.$settings=Magno.Box.Settings.Manager.fromMachine(this)

		return this.$settings

	}

	async reconfigure(){

		this.emit("reconfiguring")

		// Acá debería ajustar los parámetros 
		var machines= await this.virtualBox.runningMachines(), running=false
		for(var i=0;i<machines.length;i++){
			
			if(machines[i].name===this.name){
				running=true
				break
			}

		}


		var sharedFolders, sharedFolder, folders, folder, adaptors, adap,
			ip, ip2, dhcpServer, network, change, create
		if(!running){
			// Adjust all
			await this.machine.setMemoryMB(this.config.memory||512)
			await this.machine.setCpus(this.config.cpus||1)

			// Ajustar red ...
			adaptors= await this.machine.adaptors()
			if(!adaptors[0])
				adaptors.push(new Vbox.Adaptor(this.machine))
			


			await adaptors[0].setNat()
			adap= adaptors[1]
			if(!adaptors[1]){
				adaptors.push(new Vbox.Adaptor(this.machine))
			}
			if(adap){
				if(adap.networkType|0 != Vbox.NetworkType.HostOnly|0){
					create= true
				}			
			}
			else{
				adap= adaptors[1]
				create= true
			}

			if(create){

				network= await this.manager.networks.create(Vbox.NetworkType.HostOnly)
				await adap.setNetwork(network)
			}
			else{
			
				//vw.info("HERE")
				network= await adap.network()
			}

			//vw.info(network)


			ip= this.config.ip.split(".")
			ip[ip.length-1]= "1"
			network.IP= ip.join(".")
			network.networkMask= "255.255.255.0"
			await network.change()

			dhcpServer= await network.dhcpServer()
			create= false

			if(!dhcpServer){
				create=true
				dhcpServer= await network.createDhcpServer()
			}

			ip[ip.length-1]="100"
			dhcpServer.IP= ip.join(".")
			ip[ip.length-1]="101"
			dhcpServer.lowerIp= ip.join(".")
			ip[ip.length-1]="254"
			dhcpServer.upperIp= ip.join(".")
			dhcpServer.networkMask="255.255.255.0"
			
			//vw.info(create)

			if(create)
				await (await this.virtualBox.dhcpServers()).add(dhcpServer)
			else
				await dhcpServer.change()


			if(!dhcpServer.enabled)
				await dhcpServer.enable()

		

			sharedFolders= await this.machine.sharedFolders()
			for(var i=0;i<sharedFolders.length;i++){
				await sharedFolders[i].remove()
			}

			folders= [].concat(this.config.folders)
			folders.push({
				"from": this.config.publicConfigDirectory, 
				"to": "/home/" +this.config.user + "/MachineConfig"
			})

			//folders= this.config.folders
			for(var i=0;i<folders.length;i++){
				sharedFolder= new Vbox.SharedFolder()
				sharedFolder.name= "FOLDER" +i
				sharedFolder.path= folders[i].from
				sharedFolder.isMachine= true
				sharedFolder.automount= false
				await sharedFolders.add(sharedFolder)
			}
		}
	}

	async start(){
		this.emit("starting")
		await this.machine.start()
		this.emit("start")
	}

	async saveState(){
		this.emit("saving")
		await this.machine.saveState()
		this.emit("save")
	}

	async stop(){
		this.emit("stoping")
		await this.machine.stop()
		this.emit("stop")
	}

	async applySettings(){
		this.emit("settings")
		await this.settingManager.configure()
	}	

	async wait(){
		var er=true, retry=0
		this.emit("waiting")
		while(er){
			er= false
			await core.VW.Task.sleep(10000)
			try{
				await this.settingManager.probe()
			}
			catch(e){
				er=e
				retry++
			}
			if(retry==5)
				break
		}

		if(er)
			throw new core.System.Exception("Parece ser que la máquina no inició correctamente. " + er.toString())
	}



}

export default Machine