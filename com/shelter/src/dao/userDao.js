/**
 * 用户信息查询
 */


// var mysql = require('mysql');
// var fs = require('fs');
// var json = JSON.parse(fs.readFileSync(__dirname + "/../properties/mysql.json"));
//
// var connection = mysql.createConnection({
//     host     : json.host,
//     user     : json.user,
//     password : json.password,
//     database : json.database
// });
// connection.connect();
var logger = require('../util/logFactroy').getInstance();

//登陆查询  回掉函数方式
exports.loginBack = function(connection, userName, password, fn){
    try {
        connection.query('select * from user where user_name=? and password=?', [userName,password],
            function (error, results, fields) {
                if (error) throw error;

                if (results != null && results.length > 0) {
                    logger.debug(JSON.stringify(results))
                    fn(true, '登陆成功', results);
                } else {
                    logger.debug("查询无结果");
                    fn(false, '登陆失败，请检查用户名密码', results);
                }
            });
    } catch (e) {
        logger.info("查询错误" + e.stack);
        fn(false, '查询异常'+e.stack);
    }
}


//检查用户名是否重复
exports.userNameReCheck = function(connection, userName, fn){
    try {
        connection.query('select id from user where user_name=?', [userName],
            function (error, results, fields) {
                if (error) throw error;

                if (results != null && results.length > 0) {
                    logger.debug(JSON.stringify(results))
                    fn(false, '用户名存在');
                } else {
                    logger.debug("查询无结果");
                    fn(true, '用户名不存在,可以使用');
                }
            });
    } catch (e) {
        logger.info("查询错误" + e.stack);
        fn(false, '查询异常'+e.stack);
    }
}


//获取所有用户信息  回掉函数方式
exports.userBack = function(connection, fn){
    try {
        connection.query('select * from user',
            function (error, results, fields) {
                if (error) throw error;

                if (results != null && results.length > 0) {
                    logger.debug(JSON.stringify(results))
                    fn(true, "ok", results);
                }
            });
    } catch (e) {
        logger.info("查询错误" + e.stack);
        fn(false, '查询异常'+e.stack);
    }
}


//注册用户
exports.register = function(connection, userName, password, fn){
    try {
        connection.query('insert into user(user_name,password)values(?,?)', [userName, password],
            function (error, results) {
                if (error) throw error;

                if (results != null && results.insertId != 0) {
                    logger.debug(JSON.stringify(results))
                    fn(true,"ok",results);
                }else{
                    fn(false, "插入条数0");
                }
            });
    } catch (e) {
        logger.info("新增错误" + e.stack);
        fn(false, '新增异常'+e.stack);
    }
}


/**
 * 查询用户信息(游戏信息)
 */
exports.getUserInfo = function(connection, userId, fn){
    try {
        connection.query('select * from user_info where user_id=?', [userId],
            function (error, results) {
                if (error) throw error;

                if (results != null && results.length > 0) {
                    logger.debug(JSON.stringify(results))
                    fn(true, "ok", results);
                }else{
                    fn(false, "没查到", results);
                }
            });
    } catch (e) {
        logger.info("查询错误" + e.stack);
        fn(false, '查询异常'+e.stack);
    }
}

/**
 * @主要功能:   修改用户金币数量
 * @author kenan
 * @Date 2018/9/1 21:03
 * @param num      修改金币数量  +增加   -减少
 * @param userId
 * @param fn
 */
exports.updateUserMoney = function(connection, num, userId, fn){

    try {
        connection.query('update user_info set money = money + ? where user_id = ? and (money + ?) >= 0', [num,userId,num],
            function (error, results) {
                if (error) throw error;

                if (results != null && results.affectedRows != 0) {
                    logger.debug(JSON.stringify(results))
                    fn(true, "ok", results);
                }else{
                    fn(false, "修改失败/金币不足", results);
                }
            });
    } catch (e) {
        logger.info("修改错误" + e.stack);
        fn(false, '修改错误'+e.stack);
    }
}
/**
 * @主要功能:   修改用户晶尘数量
 * @author kenan
 * @Date 2018/3/11 23:43
 * @param num      修改晶尘数量  +增加   -减少
 * @param userId
 * @param fn
 */
exports.updateUserAsh = function(connection, num, userId, fn){

    try {
        connection.query('update user_info set ash_number = ash_number + ? where user_id = ? and (ash_number + ?) >= 0', [num,userId,num],
            function (error, results) {
                if (error) throw error;

                if (results != null && results.affectedRows != 0) {
                    logger.debug(JSON.stringify(results))
                    fn(true, "ok", results);
                }else{
                    fn(false, "修改失败/晶尘不足", results);
                }
            });
    } catch (e) {
        logger.info("修改错误" + e.stack);
        fn(false, '修改错误'+e.stack);
    }
}