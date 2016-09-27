#!/usr/bin/env vox
require("./main")
var init= ()=>{
	var sites= new core.org.voxsoftware.Magno.Guest.Sites()
	sites.configure()
}

init()