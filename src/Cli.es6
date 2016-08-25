
import Path from 'path'
var Magno= core.org.voxsoftware.Magno

class Cli{


	static prompt(){

		core.VW.Console.foregroundColor= core.System.ConsoleColor.Green
		core.VW.Console.write("Magno ")
		core.VW.Console.resetColors()
		core.VW.Console.write("versión ")
		core.VW.Console.foregroundColor= core.System.ConsoleColor.Yellow
		core.VW.Console.write(core.org.voxsoftware.Magno.version,"")
		core.VW.Console.resetColors()
	}


	static error(e){

		core.VW.Console.backgroundColor= core.System.ConsoleColor.Red
		core.VW.Console.foregroundColor= core.System.ConsoleColor.White
		core.VW.Console.write(" ERROR ")
		core.VW.Console.resetColors()
		core.VW.Console.foregroundColor= core.System.ConsoleColor.Yellow
		core.VW.Console.write("", e.stack||e.toString())
	}
	static cli(){

		var Command=new  core.VW.CommandLine.Parser()
		Command.addParameter("install")
		Command.addParameter("start")
		Command.addParameter("stop")
		Command.addParameter("save-state")
		Command.addParameter("reconfigure")
		try{
			Command.parse()
			var options= Command.getAsOptionsObject()
		}
		catch(e){
			Cli.prompt()
			core.VW.Console.writeLine()
			return Cli.error(e)
		}
		return Cli.execute(options)

	}


	static async execute(options){

        try{
			if(options.install){
    			await Cli.install(options)
    		}
			else if(options.start){
    			await Cli.start(options)
    		}
			else if(options["save-state"]){
    			await Cli.saveState(options)
    		}
    		else if(options.stop){
    			await Cli.stop(options)
    		}
    		else if(options.reconfigure){
    			await Cli.reconfigure(options)
    		}
    		else{
    			Cli.help()
    		}
        }
        catch(e){

			core.VW.Console.writeLine()
			Cli.error(e)
        }

        core.VW.Console.writeLine()
	}



	static async install(options){

        Cli.prompt()
		core.VW.Console.writeLine()
		
        var magno, config, d=new Date()
        config= new Magno.Configuration()
        magno= new Magno.Magno(config)
        core.VW.Console.writeLine("Creando máquina virtual...")
        var result= await magno.install(Path.normalize(options.values[0]))
        core.VW.Console.writeLine("Máquina instalada: ", config.name, " Tiempo: ",
        		new Date()-d,"ms")
        core.VW.Console.write("Por favor edite el siguiente archivo de acuerdo a sus preferencias antes de iniciar la máquina: ")
        core.VW.Console.foregroundColor= core.System.ConsoleColor.Yellow
        core.VW.Console.writeLine(result.configFile).resetColors()
    }



    static async reconfigure(options){

        Cli.prompt()
		core.VW.Console.writeLine()
			
		if(!options.values[0])
			throw new core.System.ArgumentException("Debe especificar el nombre de la máquina")

        var magno, machine,config, d=new Date()
        config= new Magno.Configuration()
        magno= new Magno.Magno(config)
        machine= magno.machine(options.values[0])
        	
        // Reconfigurar ..
        core.VW.Console.writeLine("Reconfigurando máquina")
        await machine.reconfigure()

        Cli.events(machine)
        await machine.applySettings()

        core.VW.Console.writeLine("Máquina reconfigurada: ", config.name, " Tiempo: ",
        		new Date()-d,"ms")
    }

    static events(machine){

        machine.on("reconfiguring", ()=>{
            core.VW.Console.foregroundColor= core.System.ConsoleColor.Yellow
            core.VW.Console.writeLine("Reconfigurando máquina").resetColors()
        })

        machine.on("starting", ()=>{
            core.VW.Console.foregroundColor= core.System.ConsoleColor.Yellow
            core.VW.Console.writeLine("Iniciando máquina").resetColors()
        })


        machine.on("waiting", ()=>{
            core.VW.Console.foregroundColor= core.System.ConsoleColor.Green
            core.VW.Console.writeLine("Esperando mientras la máquina inicia el sistema operativo").resetColors()
        })

        machine.on("settings", ()=>{           
            core.VW.Console.writeLine("Aplicando los ajustes de IP y Sitios web")
        })

        machine.on("sharedfoldersmounting", ()=>{
            core.VW.Console.foregroundColor= core.System.ConsoleColor.Yellow
            core.VW.Console.writeLine("Montando carpetas compartidas").resetColors()
        })

        machine.on("sharedfoldersmounting", ()=>{
            core.VW.Console.foregroundColor= core.System.ConsoleColor.Green
            core.VW.Console.writeLine("Carpetas compartidas montadas satisfactoriamente").resetColors()
        })


        machine.on("sitesconfiguring", ()=>{
            core.VW.Console.foregroundColor= core.System.ConsoleColor.Yellow
            core.VW.Console.writeLine("Configurando sitios web").resetColors()
        })

        machine.on("sitesconfigured", ()=>{
            core.VW.Console.foregroundColor= core.System.ConsoleColor.Green
            core.VW.Console.writeLine("Carpetas compartidas montadas satisfactoriamente").resetColors()
        })


        machine.on("nginxrestarting", ()=>{
            core.VW.Console.foregroundColor= core.System.ConsoleColor.Yellow
            core.VW.Console.writeLine("Reiniciando servicio nginx").resetColors()
        })

        machine.on("nginxrestarted", ()=>{
            core.VW.Console.foregroundColor= core.System.ConsoleColor.Green
            core.VW.Console.writeLine("Servicio nginx iniciado").resetColors()
        })
    }


    static async start(options){

        Cli.prompt()
		core.VW.Console.writeLine()
			
		if(!options.values[0])
			throw new core.System.ArgumentException("Debe especificar el nombre de la máquina")

        var magno, config, machine, d=new Date()
        config= new Magno.Configuration()
        magno= new Magno.Magno(config)
        machine= magno.machine(options.values[0])
       
        // Enlazar eventos ...


        Cli.events(machine)


        await machine.reconfigure()
        await machine.start()
        await machine.wait()
        await machine.applySettings()

        core.VW.Console.writeLine("Máquina iniciada: ", config.name, " Tiempo: ",
        		new Date()-d,"ms")
    }

    static async stop(options){

        Cli.prompt()
		core.VW.Console.writeLine()
			
		if(!options.values[0])
			throw new core.System.ArgumentException("Debe especificar el nombre de la máquina")

        var magno, machine,config, d=new Date()
        config= new Magno.Configuration()
        magno= new Magno.Magno(config)
        machine= magno.machine(options.values[0])
        	
        // Reconfigurar ..
        core.VW.Console.writeLine("Deteniendo máquina")
        await machine.stop(options.values[0])


        core.VW.Console.writeLine("Máquina detenida: ", config.name, " Tiempo: ",
        		new Date()-d,"ms")
    }


    static async saveState(options){

        Cli.prompt()
		core.VW.Console.writeLine()
			
		if(!options.values[0])
			throw new core.System.ArgumentException("Debe especificar el nombre de la máquina")

        var magno, machine,config, d=new Date()
        config= new Magno.Configuration()
        magno= new Magno.Magno(config)
        machine= magno.machine(options.values[0])
        	
        // Reconfigurar ..
        core.VW.Console.writeLine("Guardando máquina")
        await machine.save(options.values[0])


        core.VW.Console.writeLine("Máquina guardada: ", config.name, " Tiempo: ",
        		new Date()-d,"ms")
    }


	static get options(){
		return {
			/*
			"--name": "Nombre de la máquina virtual",
            "--path": "Ruta de la máquina virtual a instalar"
            */
		}
	}

	static get commands(){
		return {
			"-install": "Instalar una nueva máquina Magno (args: path)",
			"-start": "Iniciar una máquina (args: name)",
			"-stop": "Apagar una máquina (args: name)",
			"-save-state": "Guardar el estado de una máquina (args: name)" ,
			"-reconfigure": "Volver a ajustar los sitios (args: name)"
		}
	}



	static help(){
		var help=Cli.options
		var cmds=Cli.commands

		Cli.prompt()
		core.VW.Console.writeLine()
		core.VW.Console.writeLine()

		vw.warning("Modo de uso:")
		core.VW.Console.writeLine("  comando [opcion [argumento], opcion [argumento] ...] [argumentos]")


		core.VW.Console.writeLine()
		vw.warning("Comandos:")
		var maxl=0
		for(var id in help){
			maxl= Math.max(maxl, id.length)
		}
		for(var id in cmds){
			maxl= Math.max(maxl, id.length)
		}
		maxl+= 5

		for(var id in cmds){
			core.VW.Console.setColorLog().write(("  " + id).padRight(maxl,' ')).resetColors()
			core.VW.Console.writeLine(cmds[id])
		}


		core.VW.Console.writeLine()
		vw.warning("Opciones:")
		for(var id in help){
			core.VW.Console.setColorLog().write(("  " + id).padRight(maxl,' ')).resetColors()
			core.VW.Console.writeLine(help[id])
		}

	}


}

export default Cli
