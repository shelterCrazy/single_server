/**
 * kenan shelter项目主流程 入口
 * 1.加载http拦截器
 * 2.加载各种http 功能模块
 * 3.加载各种socket功能模块
 * 4.创建全局参数
 */
//基本js
var http = require('http');
var express = require('express');
var app = express();
var socket = require('socket.io', {rememberTransport:false, transports:['WebSocket','Flash Socket','AJAX long-polling']});


//公共服务
var util = require('./util/util');
var connectUtil = require('./util/ConnectUtil');
var loggerUtil = require('./util/logFactroy');
var config = require('./properties/shelterConfig');
var enumConfig = require('./model/enumConfig');


//功能模块
var indexControllor = require('./controller/indexControllor');  //登陆注册
var interceptor = require('./Interceptor/LoginInterceptor');   //拦截器中间件
var index_io = require('./action/indexAction');     //socket.io登录拦截等操作
var battle_io = require('./action/fight');     //socket.io登录拦截等操作

//var test = require('./action/client');     //socket.io登录拦截等操作



/** 启动参数*/
//process是一个全局对象，argv返回的是一组包含命令行参数的数组。
//第一项为”node”，第二项为执行的js的完整路径，后面是附加在命令行后的参数
var args = process.argv.splice(2)
if(args.length == 0){
    args[0] = "dev";
    args[1] = config.dev.ip;
}
console.log(args);



/** util初始化*/
//初始化数据库链接
connectUtil.init(args[0]);
//初始化日志配置
loggerUtil.init(args[0]);
var logger = loggerUtil.getInstance();

var port = 3000;
if(args[0] == "dev"){
    port = config.dev.applicationPort;
}else{
    port = config.release.applicationPort;
}



/**  http服务初始化 */
var server = http.Server(app);
server.listen(port);    //必须是 http设置端口   app.listen(port) 并不会将端口给server
//静态资源
app.use(express.static('public'));


/** websocket 初始化 */
var io =  socket(server,{
    pingTimeout: 6000,
    pingInterval: 10000
});
var index = io.of("/index"); //index 空间



/** controller Action访问入口初始化*/
//拦截器
//interceptor(app);
//注册登陆功能信息
indexControllor(app);
//socket.io 登录 房间room等操作
index_io(index);

/** 初始化结束 */




//探测服务
app.get("/detect", function (req, res) {
    res.end(JSON.stringify({"host":req.header("host"), "ip":req.ip, "method":req.method}));
})




//战斗社交场景socket
index.on("connection", function (socket) {
    logger.info("socket.io监听connection")

    //登陆拦截器  socket中间件   需要主动携带token参数
    /*
    socket.use(function(packet, next){
        logger.debug("packet:" + packet[0] + "packet.length:" + packet.length);
        if(packet[0] == 'login' || packet[0] == 'close' || packet[0] == 'disconnect'){
            return next();
        }else if(packet.length > 1){
            try{
                var id = util.decode(packet[1].token);
                logger.debug("id:" + id + " util.get(id):" + util.get(id));
                if(util.get(id) != null){
                    return next();
                }else{
                    next(new Error("请登陆"));
                }
            }catch (e){
                next(new Error("请登陆"));
            }
        }
        next(new Error("请登陆"));
    });
    */

    //error事件处理器
    socket.on('error', function(error){
        logger.warn("socket.error");
        socket.emit('error',{'status': enumConfig.prototype.msgEnum.error, 'msg':'error:' + error});
    });



});