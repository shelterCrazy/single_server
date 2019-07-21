/**
 * kenan 游戏登陆/注册模块控制器
 */

var userService = require('../service/UserService');
var util = require('../util/util');
var loggerUtil = require('../util/logFactroy');
var app;
var path = require('path')


//引入express 对象
module.exports = function(appL){
   app = appL;
   init();
}

//初始化  只有在引入app对象后才能开启 app路由
var init = function(){
    var logger = loggerUtil.getInstance();

    //展示socketio demo页面
    app.get('/socketIndex/:fileName', function(req, res){
        var fileName = path.resolve(__dirname, '..') + '/view/' + req.params.fileName;

        if(req.params.fileName == null){
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({"status": '001', "msg": ":fileName没有值"}));
        }
        logger.info("***********process.cwd()" + process.cwd());
        // var fileName = process.cwd() + '/com/shelter/src/view/' + req.params.fileName;

        res.sendFile(fileName, function (err) {
            if (err) {
                logger.error(err);
                res.status(err.status).send("产生错误:" + err).end();
            }
            else {
                logger.info('Sent:', fileName);
            }
        });
    });


    //express web方式自动路由方式
    app.get('/queryAllUser', function (req, res) {

        res.writeHead(200, {'Content-Type': 'application/json'});
        try{
            //方法二  回掉函数方式同步
            userService.userBack(function(flag, msg, results){
                if(flag){
                    res.write(JSON.stringify(results));
                    res.end();
                    return;
                }else{
                    res.end(JSON.stringify({"status": '001', "msg": "查无数据" + msg}));
                    return;
                }
            });
        }catch (e){
            res.end(JSON.stringify({"status": '001', "msg": e.toString()}));
        }
    });


    //登陆
    app.get('/login', function (req, res) {

        res.writeHead(200, {'Content-Type': 'application/json'});
        try{
            var userName = req.param("userName");
            var password = req.param("password");

            //方法二  回掉函数方式同步
            userService.loginBack(userName, password, function(flag, msg, results){
                if(flag){
                    var token = util.encode(results[0].id);
                    req.session.token = token;
                    util.push(token, results[0].id);

                    res.write(JSON.stringify(results));
                    res.end();
                    return;
                }else{
                    res.end(JSON.stringify({"status": '001', "msg": "查无数据" + msg}));
                    return;
                }
            });
        }catch (e){
            res.end(JSON.stringify({"status": '001', "msg": e.toString()}));
        }
    });

    //http的退出登陆
    //需要util.decode(packet[1].token);


    //用户名查重
    app.get('/login/nameReCheck', function(req, res){
        res.writeHead(200, {'Content-Type': 'application/json'});
        logger.info("进入/login/nameReCheck");

        try{
            var userName = req.param("userName");
            userService.userNameReCheck(userName, function(flag, msg){
                res.end(JSON.stringify({"status": '200', "flag": flag, "msg": msg}));
                return;
            });
        }catch(e){
            res.end(JSON.stringify({"status": '001', "msg": e.toString()}));
        }
    });


    //获取验证码
    app.get('/login/captcha', function(req, res){
        res.writeHead(200, {'Content-Type': 'application/json'});

        var x = Math.ceil(Math.random()*10);
        var y = Math.ceil(Math.random()*10);

        req.session.captcha = x + y;

        res.end(JSON.stringify({"status": '200', "x": x, "y": y}));
        return;
    });



    //注册
    app.post('/login/register', function(req, res){
        var cap = req.session.captcha;
        var captcha = req.body.captcha;
        var userName = req.body.userName;
        var password = req.body.password;

        res.writeHead(200, {'Content-Type': 'application/json'});

        try{
            //检验验证码
            if(captcha != cap){
                res.end(JSON.stringify({'status': '001', 'msg': '验证码错误'}));
                return;
            }
            //注册
            userService.register(userName,password, function(flag, msg, rs){
                if(flag){
                    res.end(JSON.stringify({'status': '200', 'msg': '添加成功'}));
                    return;
                }else{
                    res.end(JSON.stringify({'status': '003', 'msg': msg}));
                    return;
                }
            });

        }catch(e){
            res.end(JSON.stringify({'status': '002', 'msg': '添加用户错误'}));
            return;
        }
    });
}


