/**
 * 拦截器/中间件   express中间件
 * session
 * bodyparser  解析post提交  body携带数据
 * http登陆拦截器 /areadly
 * error处理器
 * @type {session}
 */

var session = require('express-session');
var bodyparser = require('body-parser');
var util = require('../util/util.js');
var logger = require('../util/logFactroy').getInstance();
var app;

module.exports = function(appL){
    app = appL;
    init();
}


var init = function(){

    //session中间件
    app.use(session({
        secret: 'kenanCrazy', //secret的值建议使用随机字符串
        cookie: {maxAge: 60 * 1000 * 30}, // 过期时间（毫秒）
        resave:'',
        saveUninitialized:''
    }));

    // parse application/x-www-form-urlencoded
    app.use(bodyparser.urlencoded({ extended: false }));
    // parse application/json
    app.use(bodyparser.json());



    //登陆拦截中间件
    app.use('/areadly', function (req, res, next) {
        var token;
        logger.debug('Request Type:', req.method);

        //get post session获取token
        token = util.getToken(req);

        //校验token有效性
        if(token == null || token == undefined){
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({"status":"001", "msg":"未登录或者登陆超时"}));
            return;
        }else{
            var id = util.decode(token);
            logger.debug("id:" + id + " util.get(id):" + util.get(id));
            if(util.get(id) != null){
                next();
            }else{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({"status":"001", "msg":"未登录或者登陆超时"}));
                return;
            }
        }
    });


    //错误处理中间件
    app.use(function(err, req, res, next) {
        logger.error(err.stack);
        res.status(500).send(JSON.stringify({"status":"001", "msg":"发生错误:" + err.stack}));
    });
}