/**
 * kenan 游戏登陆/注册模块控制器
 */

var util = require('../util/util');
var logger = require('../util/logFactroy').getInstance();
var enumConfig = require('../model/enumConfig');

//业务服务
var userService = require('../service/UserService');  //用户服务
var index;

var num = 0;
var socketPool = [];
//匹配池：按照人数放置玩家的信息
var matchPool = [];
//房间池：
var roomPool = [];


//引入socket.io '/index' 空间对象
module.exports = function (indexL) {
    index = indexL;
    for (var i = 0; i < 10; i++) {
        matchPool[i] = [];
    }
    init();
}


var endTimer = function (timer) {
    clearInterval(timer);
}

var init = function () {

    //战斗社交场景socket
    index.on("connection", function (socket) {
        logger.info("indexAction socket.io监听connection")

        //第一次建立链接后登陆操作
        // socket.on('login', function (data) {
        //     var userName = data.userName;
        //     var password = data.password;

        //     //查询用户服务
        //     userService.loginBack(userName, password, function (flag, msg, results) {
        //         if (flag) {
        //             logger.debug('local socket.id ' + socket.id)
        //             var token = util.encode(results[0].id);
        //             socket.emit('loginResult', { 'status': enumConfig.prototype.msgEnum.success, 'msg': msg, 'results': token });

        //             //登陆token加入token池
        //             util.push(token, results[0].id);
        //         } else {
        //             logger.info('local socket.id ' + socket.id)
        //             socket.emit('loginResult', { 'status': enumConfig.prototype.msgEnum.fail, 'msg': msg });
        //         }
        //     });
        // });


        //广播信息
        // socket.on('broadcastMsg', function(data){
        //     socket.broadcast.emit('msg', {'status': enumConfig.prototype.msgEnum.success, 'msg':'socket.id:'+ socket.id + ' 发送了广播消息:' + data.msg});
        // });


        //私聊信息
        socket.on('msg', function (data) {
            logger.debug(data.id);
            socket.to(data.id).emit('msg', { 'status': enumConfig.prototype.msgEnum.success, 'from:': socket.id + ' to:' + data.id + ' 发送了消息:' + data.msg });
        });


        //进入房间
        socket.on('join', function (data) {
            logger.debug('join：' + data.room);
            socket.join(data.room);

            //发送反馈消息
            socket.to(socket.id).emit('msg', { status: enumConfig.prototype.msgEnum.success, 'msg': 'ok' });
        });



        //room消息广播
        socket.on('roomMsg', function (data) {
            if (data.room != null && data.room != "") {
                for (var i = 0; i < roomPool.length; i++) {
                    if (data.room == roomPool[i].room){
                        break;
                    }
                }
                if (data.msg.type == "down") {
                    roomPool[i].keyData[roomPool[i].frame].push(data.msg);
                } else if (data.msg.type == "up") {
                    for (var j = 0; j < roomPool[i].keyData[roomPool[i].frame].length; j++) {
                        if (roomPool[i].keyData[roomPool[i].frame][j].value == data.msg.value &&
                            roomPool[i].keyData[roomPool[i].frame][j].playerId == data.msg.playerId) {
                            roomPool[i].keyData[roomPool[i].frame].splice(j, 1);
                            break;
                        }
                    }
                }
            }
        });

        //开始游戏的信号发送
        //只有获得了matchResult成功的玩家才会发送startMsg
        //这里有两种情况，一个是重连的，一个是正常情况
        //data需要提供房间号
        socket.on('startMsg', function (data) {
            logger.debug(data.playerId);
            //房间号一致的话，break
            for (var i = 0; i < roomPool.length; i++) {
                if (data.room == roomPool[i].room){
                    roomPool[i].readyPlayerNum ++;
                    break;
                }
            }
            if (data.reconnect == true) {
                //将其连接到房间中
                socket.join(data.room);
                socket.emit('gameStart', { 'status': 200 });
                //发送全部的帧操作
                for(var j = 0; j < roomPool[i].frame; j++){
                    socket.emit('frameStep', { 'status': 200, "msg": roomPool[i].keyData[j], "frame": j});
                }
            } else {
                //到达最大人数就打开定时器，开始战斗轮，否则直接退出
                if (roomPool[i].readyPlayerNum != roomPool[i].maxPlayerNum) {
                    return;
                }
                for (var j = 0; j < roomPool[i].socketPool.length; j++) {
                    roomPool[i].socketPool[j].emit('gameStart', { 'status': 200 });
                }
                roomPool[i].startFlag = true;
                roomPool[i].keyData[roomPool[i].frame] = [];
                
                var room = roomPool[i];
                roomPool[i].timer = setInterval(function () {gameStep(room)}, 33);
            }
        });

        var gameStep = function (room) {
            //room = roomPool[0];
            for (var i = 0; i < room.socketPool.length; i++) {
                if (room.socketPool[i] != null)
                    room.socketPool[i].emit('frameStep', { 'status': 200, "msg": JSON.stringify(room.keyData[room.frame]),"frame":room.frame});
            }
            room.frame ++;
            room.keyData[room.frame] = room.keyData[room.frame - 1].slice(0);
        }

        //离开房间
        socket.on('leaveRoom', function (data) {
            if (data.room != null && data.room != "") {
                socket.leaveRoom(data.room);
                socket.to(socket.id).emit('msg', { status: enumConfig.prototype.msgEnum.success, 'msg': 'ok' });
            } else {
                socket.to(socket.id).emit('msg', { status: enumConfig.prototype.msgEnum.fail, 'msg': 'fail' });
            }
        });


        //匹配申请
        socket.on('match', function (data) {
            //匹配首先收集匹配数据
            //数据包括
            //即选用的人物，需要的房间总人数，token
            //上述信息以及将会被加入匹配队列，此外还有socket
            //playerNum指的是，玩家参与的匹配房间的总人数
            matchPool[data.playerNum].push({
                "token": data.token,
                "socket": socket,
                //"playerId": data.playerId,
                "playerRole": data.playerRole,
                //玩家匹配的人数
                "playerNum": data.playerNum
            });
            //加入了房间以后，如果大于了人数的话，将其取出，创建一个房间，并且加入到同一个房间中
            while (matchPool[data.playerNum].length >= data.playerNum) {
                //构造房间数据
                var roomData = {
                    "room": "room",
                    "keyData": [],
                    "socketPool": [],
                    "playerData": [],
                    //当前玩家人数
                    "playerNum": 0,
                    //预计玩家最大人数
                    "maxPlayerNum": 0,
                    //准备好的玩家的人数
                    "readyPlayerNum": 0,
                    "startFlag": false,
                    "frame": 0,
                    "timer": null
                };

                //playerData = {"playerRole","playerId","playerName","socket","connection"}
                var num = data.playerNum;
                roomData.maxPlayerNum = data.playerNum;
                //使用for循环注入socket以及房间号
                for (var i = 0; i < num; i++) {
                    roomData.socketPool.push(matchPool[num][i].socket),
                        roomData.playerData.push({
                            "playerId": i,
                            "playerName": "",
                            "playerRole": matchPool[num][i].playerRole,
                            "connection": true
                        });
                    roomData.room += '#' + matchPool[num][i].socket.id.slice(8, 15);
                    roomData.playerNum++;
                }

                //将全部的socket加入房间中
                for (var i = 0; i < roomData.socketPool.length; i++) {
                    //将其加入到房间中
                    roomData.socketPool[i].join(roomData.room);
                    //对其发送匹配完成的消息，包括房间号，所有玩家的数据，当前玩家分配到的玩家ID
                    //这里发送了关于各种信息的消息，这样就可以通过这些信息建立各玩家的角色
                    roomData.socketPool[i].emit('matchResult', {
                        status: enumConfig.prototype.msgEnum.success,
                        'room': roomData.room,
                        'playerId': roomData.playerData[i].playerId,
                        'playerData': roomData.playerData,
                        'msg': 'ok'
                    });
                }
                // socket.to(roomData.room).emit('matchResult', {
                //     status:enumConfig.prototype.msgEnum.success, 
                //     'room': roomData.room,
                //     'playerId': roomData.playerData[i].playerId,
                //     'playerData':roomData.playerData,
                //     'msg':'ok'
                // });
                //将data加入到房间组中
                roomPool[roomPool.length] = roomData;
                //将匹配池中的玩家移除，从0开始，删除data.playerNum个
                matchPool[roomData.playerNum].splice(0, data.playerNum);
            }
        });
        //取消匹配的事件
        //将会查找匹配池的此玩家
        //点击匹配的玩家如果点击了取消的话，将会触发
        //但是已经完成匹配的玩家。会因为上面的match返回值而无法匹配
        socket.on('cancelMatch', function (data) {
            for (var player = 0; player < matchPool[data.playerNum].length; player++) {
                if (matchPool[data.playerNum][player].socket.id == socket.id) {
                    matchPool[data.playerNum].splice(player, 1);
                    break;
                }
            }
        });
        //重新加入游戏
        //需要在data中提供
        //房间号，玩家ID
        //将会重新加入房间，配置玩家信息
        //如果战斗已经开始的话，那么会在玩家准备完成后发送全部的操作信息
        socket.on('rejoin', function (data) {
            //接下来从房间中开始查找
            for (var i = 0; i < roomPool.length; i++) {
                if (roomPool[i].room != data.room) continue;
                var roomData = roomPool[i];
                for (var j = 0; j < roomData.playerData.length; j++) {
                    if (roomData.playerData[j].playerId != data.playerId) continue;
                    //重新链接为true
                    roomData.playerData[j].connection = true;
                    //替换socket
                    roomData.socketPool[j] = socket;

                    roomData.playerNum--;

                    //发送其他玩家信息，让客户端初始化
                    socket.emit('matchResult', {
                        status: enumConfig.prototype.msgEnum.success,
                        'room': roomData.room,
                        'playerId': roomData.playerData[j].playerId,
                        'playerData': roomData.playerData,
                        'msg': 'ok'
                    });
                    return;
                }
            }
        });
        //链接断开
        socket.on('disconnect', function (data) {
            console.log(socket);
            logger.info('socket.disconnect');
            //断开后首先获取socket
            //首先从匹配池开始查找
            for (var i = 1; i < 10; i++) {
                for (var j = 0; j < matchPool[i].length; j++) {
                    //找到的话，将其移除
                    if (matchPool[i][j].socket.id == socket.id) {
                        matchPool[i].splice(j, 1);
                        break;
                    }
                }
            }
            //接下来从房间中的开始查找
            for (var j = 0; j < roomPool.length; j++) {
                for (var i = 0; i < roomPool[j].socketPool.length; i++) {
                    if (roomPool[j].socketPool[i] != null && roomPool[j].socketPool[i].id == socket.id) {
                        roomPool[j].socketPool[i] = null;
                        //将玩家的链接信息转为false
                        roomPool[j].playerData[i].connection = false;
                        roomPool[j].playerNum--;
                        if (roomPool[j].playerNum == 0) {
                            //如果房间里面完全没人的话，关闭定时器
                            clearInterval(roomPool[j].timer);
                            roomPool.splice(j, 1);
                        }
                        return;
                    }
                }
            }
            //endTimer();
        });
    });
}

