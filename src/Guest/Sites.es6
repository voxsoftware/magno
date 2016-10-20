import Path from 'path'
import fs from 'fs'
var Fs= core.System.IO.Fs
import Cp from 'child_process'
class Sites{
	

	constructor(){
		var dir= Path.join(process.env.HOME, "MachineConfig")
		// Lo primero es intentar montar el sitio donde va MachineConfig
		this.configureVirtioMount({
			src: "MachineConfig",
			dest: dir
		})

		var file= Path.join(dir, "machine.config.json")
		this.$= require(file)

	}

	get config(){
		return this.$
	}


	static startSite(domain, program, args){
		var pid
		var spawn = require('child_process').spawn
		
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

		const child = spawn(program, args, {
		 detached: true,
		 stdio: [ 'ignore', out, err ]
		})
		fs.writeFileSync(pidFile, child.pid.toString())
		child.unref()
	}

	static rmDir(dir){
		var file, files= fs.readdirSync(dir)
		for(var i=0;i<files.length;i++){
			file= files[i]
			if(file!="." && file!=".."){
				fs.unlinkSync(Path.join(dir, file))
			}
		}
	}

	configure(){
		Sites.rmDir("/etc/nginx/sites-enabled")
		Sites.rmDir("/etc/nginx/sites-available")


		var mountPoints= this.config.virtio

		for(var i=0;i<mountPoints.length;i++){
			this.configureVirtioMount(sites[i])			
		}


		var sites= this.config.sites
		for(var i=0;i<sites.length;i++){
			if(sites[i].type=="PHP")
				this.configurePhpSite(sites[i])

			else if(sites[i].type=="Proxy")
				this.configureProxySite(sites[i])
		}

		// Restart service ...
		Cp.execSync("service nginx restart")




	}


	configureVirtioMount(mount){
		if(!Fs.sync.exists(mount.dest))
			Fs.sync.mkdir(mount.dest)

		Fs.sync.chmod(mount.dest, '666')
		Cp.execSync(`mount -t 9p -o trans=virtio,version=9p2000.L ${mount.src} "${mount.dest}"`)
	}


	configureProxySite(site){

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
		//var f= "/home/" + this.machine.config.user + "/" + domain

		Fs.sync.writeFile(file, content)
		Fs.sync.chmod(file, '664')

		Fs.sync.writeFile(file2, content)
		Fs.sync.chmod(file2, '664')


		// Verificar si el sitio necesita que se ejecute algún comando ...
		if(site.execute){
			f= Path.join(process.env.HOME, "start-site")
			Sites.startSite(site.url, site.execute.path, site.execute.arguments||[])
			
		}
		



	}


	configurePhpSite(site){
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
		//var f= "/home/" + this.machine.config.user + "/" + domain

	

		Fs.sync.writeFile(file, content)
		Fs.sync.chmod(file, '664')

		Fs.sync.writeFile(file2, content)
		Fs.sync.chmod(file2, '664')

	}

}
export default Sites