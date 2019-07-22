/**
 * kenan 游戏登陆/注册模块控制器
 */

var util = require('../util/util');
var logger = require('../util/logFactroy').getInstance();
var enumConfig = require('../model/enumConfig');

//业务服务
var userService = require('../service/UserService');  //用户服务
var index;


//引入socket.io '/index' 空间对象
module.exports = function(indexL){
    index = indexL;
   init();
}


var init = function(){

    //战斗社交场景socket
    index.on("connection", function (socket) {
        logger.info("indexAction socket.io监听connection")

        //第一次建立链接后登陆操作
        socket.on('login', function(data){
            var userName = data.userName;
            var password = data.password;

            //查询用户服务
            userService.loginBack(userName, password, function (flag, msg, results) {
                if(flag){
                    logger.debug('local socket.id ' + socket.id)
                    var token = util.encode(results[0].id);
                    socket.emit('loginResult',{'status':enumConfig.prototype.msgEnum.success,'msg':msg, 'results': token});

                    //登陆token加入token池
                    util.push(token, results[0].id);
                }else{
                    logger.info('local socket.id ' + socket.id)
                    socket.emit('loginResult',{'status':enumConfig.prototype.msgEnum.fail,'msg':msg});
                }
            });
        });


        //广播信息
        // socket.on('broadcastMsg', function(data){
        //     socket.broadcast.emit('msg', {'status': enumConfig.prototype.msgEnum.success, 'msg':'socket.id:'+ socket.id + ' 发送了广播消息:' + data.msg});
        // });


        //私聊信息
        socket.on('msg', function(data){
            logger.debug(data.id);
            socket.to(data.id).emit('msg', {'status': enumConfig.prototype.msgEnum.success, 'from:': socket.id + ' to:' + data.id + ' 发送了消息:' + data.msg});
        });


        //进入房间
        socket.on('join', function(data){
            console.log('join：' + data.room);
            socket.join(data.room);

            //发送反馈消息
            socket.to(socket.id).emit('msg', {status:enumConfig.prototype.msgEnum.success, 'msg':'ok'});
        });



        //room消息广播
        socket.on('roomMsg', function(data){
            if(data.room != null && data.room != ""){
                socket.to(data.room).emit('msg', {'status':200, 'msg':data.msg});
            }else{
                socket.to(socket.id).emit('msg', {'status':enumConfig.prototype.msgEnum.fail, 'msg':'no room'});
            }
        });


        //离开房间
        socket.on('leaveRoom', function(data){
            if(data.room != null && data.room != ""){
                socket.leaveRoom(data.room);
                socket.to(socket.id).emit('msg', {status:enumConfig.prototype.msgEnum.success, 'msg':'ok'});
            }else{
                socket.to(socket.id).emit('msg', {status:enumConfig.prototype.msgEnum.fail, 'msg':'fail'});
            }
        });




        //匹配申请
        socket.on('match', function(data){
            token = data.token;
            //这里处理匹配消息
            room = 1096 + token;

            socket.to(socket.id).emit('msg', {'status':enumConfig.prototype.msgEnum.success, 'msg':room});
        });
    });
}

