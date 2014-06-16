var clc = require('cli-color');

var Log = function(sender) {
  this.sender = sender;
};

Log.prototype.debug = function(message) {
  console.log(clc.green('DEBUG') +' '+ clc.whiteBright(this.sender) +' '+ message);
};

Log.prototype.info = function(message) {
  console.log(clc.cyan(' INFO') +' '+ clc.whiteBright(this.sender) +' '+ message);
};

Log.prototype.warning = function(message) {
  console.log(clc.yellow(' WARN') +' '+ clc.whiteBright(this.sender) +' '+ message);
};

Log.prototype.error = function(message) {
  console.log(clc.red('ERROR') +' '+ clc.whiteBright(this.sender) +' '+ message);
};

module.exports = function(sender) {
  return new Log(sender);
};