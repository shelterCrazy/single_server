/**
 * util
 * 1.用户登陆token池
 * 2.加密/解密机
 * @type {Array}
 */
var session = require('express-session');

//token 池    tokenPool[id]=token
var tokenPool = [];


module.exports = {

    //token池操作
    push(token, id){
        console.log("util.push  token:" + token + "id:" + id);
        if(tokenPool[id] == undefined){
            tokenPool[id] = token;
        }
    },

    get(id){
        console.log("util.get id:" + id);
        if(tokenPool[id] == undefined){
            return null;
        }else{
            return tokenPool[id];
        }
    },

    //加密
    encode : function(str){
        var r = (Math.random()*10).toFixed(0);
        return String(r) + (((parseInt(str) + parseInt(r)) << 1) * 2)
    },

    //解密
    decode : function(str){
        var r = str.substring(0,1);
        var num = str.substring(1);
        return ((num/2) >> 1) - r
    },


    /**
     * 获取http请求的token
     */
    getToken : function(req){
        var token;

        //优先寻找参数中携带的token
        if(req.method == "GET"){
            token = req.param("token");
        }else if(req.method == "POST"){
            token = req.body.token;
        }

        if(token == null || token == undefined || token == ""){
            token = req.session.token;
        }

        logt
        return token;
    }
}
