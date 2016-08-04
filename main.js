require("virtual-box")
var Module= new core.VW.Module(__dirname)
Module.loadConfigFile("./core-modules.json")
Module.import()
core.org.voxsoftware.Magno.version= require("./package.json").version
module.exports= core.org.voxsoftware.Magno