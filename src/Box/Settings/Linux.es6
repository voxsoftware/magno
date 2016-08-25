
var Vbox= core.org.voxsoftware.VirtualBox
var Magno= core.org.voxsoftware.Magno
var Settings= Magno.Box.Settings
import Path from 'path'
// Esta clase 
class Linux extends Settings.Manager{
	
	constructor(machine){
		super(machine)
	}

	async configure(){
		
		await this.writeCommands()
		await this.configureIp()
		await this.mountSharedFolders()
		await this.configureSites()


	}

	async probe(){
		await this.writeCommands()
	}

	get virtualBox(){
		return this.machine.virtualBox
	}

	get virtualBoxMachine(){
		return this.machine.machine
	}

	async configureIp(){
		var content= await this.contentForIp()
		var f= "/home/" + this.machine.config.user + "/interfaces"
		var dest= "/etc/network/interfaces"
		await this.virtualBoxMachine.writeFile({
			"content": content,
			"dest": f,
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})


		// Ahora ejecutar comando 
		await this.virtualBoxMachine.exec({
			"path": "/usr/bin/sudo",
			"arguments": ["cp", f, dest],
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})

	}

	async writeCommands(){
		var f= "/home/" + this.machine.config.user
		/*await this.virtualBoxMachine.exec({
			"path": "/usr/bin/env",
			"arguments": ["mkdir", f],
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})
		*/

		var fel= Path.join(f, "rm.js")
		var content= `

		var fs= require('fs')
		var Path= require('path')
		var dir= process.argv[2]
		var file, files= fs.readdirSync(dir)
		for(var i=0;i<files.length;i++){
			file= files[i]
			if(file!="." && file!=".."){
				fs.unlinkSync(Path.join(dir, file))
			}
		}

		`
		await this.virtualBoxMachine.writeFile({
			"dest": fel,
			"content": content, 
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})



		fel= Path.join(f, "mkdir-if.js")
		content= `

		var fs= require('fs')
		var dir= process.argv[2]
		if(!fs.existsSync(dir))
			fs.mkdirSync(dir)

		`
		await this.virtualBoxMachine.writeFile({
			"dest": fel,
			"content": content, 
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})


		fel= Path.join(f, "start-site.js")
		content= `
		var pid,fs = require('fs');
		var Path= require('path')
		var spawn = require('child_process').spawn;		
		var domain= process.argv[2]
		var program= process.argv[3]
		var arguments= process.argv.slice(4, process.argv.length)

		var home= process.env.HOME + "/Magno_Sites/"
		if(!fs.existsSync(home))
			fs.mkdirSync(home)

		var pidFile= Path.join(home, domain)
		var logfile= Path.join(home, domain + ".log")
		var out = fs.openSync(logfile, 'a');
		var err = fs.openSync(logfile, 'a');

		if(fs.existsSync(pidFile)){
			pid=fs.readFileSync(pidFile)
			if(pid!=""){
				pid=pid|0
				if(pid>0){
					try{
						process.kill(pid,'SIGHUP')
					}
					catch(e){
						// 
					}
				}
			}
		}

		const child = spawn(program, arguments, {
		 detached: true,
		 stdio: [ 'ignore', out, err ]
		});
		fs.writeFileSync(pidFile, child.pid.toString())
		child.unref();
		`

		await this.virtualBoxMachine.writeFile({
			"dest": fel,
			"content": content, 
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})



	}


	async configureSites(){
		this.machine.emit("sitesconfiguring")
		var f= "/home/" + this.machine.config.user + "/rm"
		await this.virtualBoxMachine.exec({
			"path": "/usr/bin/sudo",
			"arguments": ["node", f, "/etc/nginx/sites-enabled"],
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})

		await this.virtualBoxMachine.exec({
			"path": "/usr/bin/sudo",
			"arguments": ["node", f, "/etc/nginx/sites-available"],
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})


		var sites= this.machine.config.sites
		for(var i=0;i<sites.length;i++){
			if(sites[i].type=="PHP")
				await this.configurePhpSite(sites[i])

			else if(sites[i].type=="Proxy")
				await this.configureProxySite(sites[i])
		}

		this.machine.emit("sitesconfigured")

		// Restart nginx server
		
		await this.restartNginx()
		
	}


	async restartNginx(){
		// Estos es específico de Ubuntu que por ahora es 
		// el único SO soportado

		this.machine.emit("nginxrestarting")
		await this.virtualBoxMachine.exec({
			"path": "/usr/bin/sudo",
			"arguments": ["service", "nginx", "restart"],
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})
		this.machine.emit("nginxrestarted")
	}


	async configureProxySite(site){

		var domain= site.url
		var port= site.port
		var content=`
server {
    listen 80;

    server_name ${domain};

    location / {
        proxy_pass http://localhost:${port};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`
		
		var file= "/etc/nginx/sites-enabled/"+domain
		var file2= "/etc/nginx/sites-available/"+domain
		var f= "/home/" + this.machine.config.user + "/" + domain

		await this.virtualBoxMachine.writeFile({
			"content": content,
			"dest": f,
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})


		// Ahora ejecutar comando 
		await this.virtualBoxMachine.exec({
			"path": "/usr/bin/sudo",
			"arguments": ["cp", f, file],
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})

		await this.virtualBoxMachine.exec({
			"path": "/usr/bin/sudo",
			"arguments": ["chmod", "664", file],
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})

		await this.virtualBoxMachine.exec({
			"path": "/usr/bin/sudo",
			"arguments": ["cp", f, file2],
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})

		await this.virtualBoxMachine.exec({
			"path": "/usr/bin/sudo",
			"arguments": ["chmod", "664", file2],
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})


		// Verificar si el sitio necesita que se ejecute algún comando ...
		if(site.execute){
			var f= "/home/" + this.machine.config.user + "/start-site"
			vw.info(site.execute)
			await this.virtualBoxMachine.exec({
				"path": "/usr/bin/env",
				"arguments": ["node", f, site.url,site.execute.path].concat(site.execute.arguments||[]),
				"user": this.machine.config.user,
				"password": this.machine.config.password
			})
		}
		



	}


	async configurePhpSite(site){

		var domain= site.url
		var root= site.to


		var content= 
`server {
    listen 80;
    server_name ${domain};
    root "${root}";

    index index.html index.htm index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    access_log off;
    error_log  /var/log/nginx/${domain}-error.log error;

    sendfile off;

    client_max_body_size 100m;

    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/var/run/php/php7.0-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;

        fastcgi_intercept_errors off;
        fastcgi_buffer_size 16k;
        fastcgi_buffers 4 16k;
        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_read_timeout 300;
    }

    location ~ /\.ht {
        deny all;
    }
}`
	


		


		var file= "/etc/nginx/sites-enabled/"+domain
		var file2= "/etc/nginx/sites-available/"+domain
		var f= "/home/" + this.machine.config.user + "/" + domain

		await this.virtualBoxMachine.writeFile({
			"content": content,
			"dest": f,
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})


		// Ahora ejecutar comando 
		await this.virtualBoxMachine.exec({
			"path": "/usr/bin/sudo",
			"arguments": ["cp", f, file],
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})

		await this.virtualBoxMachine.exec({
			"path": "/usr/bin/sudo",
			"arguments": ["chmod", "664", file],
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})

		await this.virtualBoxMachine.exec({
			"path": "/usr/bin/sudo",
			"arguments": ["cp", f, file2],
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})

		await this.virtualBoxMachine.exec({
			"path": "/usr/bin/sudo",
			"arguments": ["chmod", "664", file2],
			"user": this.machine.config.user,
			"password": this.machine.config.password
		})
		


	}


	async mountSharedFolders(){
		// Este comando se debe ejecutar ...
		// sudo mount -o uid=1000,gid=1000 -t vboxsf FOLDER0 /home/ubuntu/Code


		// Obtener los directorios donde irán los puntos de montado ...
		this.machine.emit("sharedfoldersmounting")
		var folders= this.machine.config.folders, folder
		folders= [].concat(folders)
		folders.push({
			"from": this.machine.config.publicConfigDirectory, 
			"to": "/home/" +this.machine.config.user + "/MachineConfig"
		})
		for(var i=0;i<folders.length;i++){
			folder= folders[i]

			var f= "/home/" + this.machine.config.user + "/mkdir-if"
			await this.virtualBoxMachine.exec({
				"path": "/usr/bin/env",
				"arguments": ["node", f, folder.to],
				"user": this.machine.config.user,
				"password": this.machine.config.password
			})

			// MONTAR ...
			await this.virtualBoxMachine.exec({
				"path": "/usr/bin/sudo",
				"arguments": ["mount", "-o", "rw,dmode=777,fmode=777,uid=1000,gid=1000", "-t", "vboxsf", "FOLDER"+i, folder.to],
				"user": this.machine.config.user,
				"password": this.machine.config.password
			})
		}

		this.machine.emit("sharedfoldersmounted")

	}

	async contentForIp(){

		var name1, name2, ip, adaptors

		adaptors= await this.virtualBoxMachine.adaptors()
		name1= adaptors[0].name
		name2= adaptors[1].name
		ip= this.machine.config.ip

		var contenido=
`
# This file describes the network interfaces available on your system
# and how to activate them. For more information, see interfaces(5).

source /etc/network/interfaces.d/*

# The loopback network interface
auto lo
iface lo inet loopback

# The primary network interface
auto ${name1}
iface ${name1} inet dhcp

auto ${name2}
iface ${name2} inet static
        address ${ip}
        netmask 255.255.255.0`	
         
        return contenido
	}



}

export default Linux