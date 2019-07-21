/**
 * @主要功能:   日志工厂
 * @author kenan
 * @Date 2018/3/13 15:48
 */
var log4j = require("log4js");
var logConf = require("../properties/logConfig");
var config;

var logger = {
    init : function(conf){
        config = conf;
    },
    getInstance : function(){
        if(config == "dev"){
            log4j.configure(logConf.dev);
        }else if(config == "release"){
            log4j.configure(logConf.release);
        }
        return log4j.getLogger(config);
    }
}

module.exports = logger;



//test
// var test = function(){
//     log4j.configure(logConf);
//     var logger = log4j.getLogger("dev");
//
//     logger.trace('Entering cheese testing');
//     logger.debug('Got cheese.');
//     logger.info('Cheese is Gouda.');
//     logger.warn('Cheese is quite smelly.');
//     logger.error('Cheese is too ripe!');
//     logger.fatal('Cheese was breeding ground for listeria.');
// }
//
// test();