/**
 * @主要功能: 数据库连接池util
 * @author kenan
 * @Date 2018/3/2 11:44
 *
 */
var mysql = require('mysql');
var mysqlconf = require("../properties/mysqlConfig");
var poolCluster;
var logger = require('./logFactroy').getInstance();

//json用法
// var fs = require('fs');
// var json = JSON.parse(fs.readFileSync(__dirname + "/../properties/mysql.json"));


module.exports = {
    init : function(config){
        init(config);
    },
    getMaster : function(fn){

        /**
         * poolCluter.getconnect()
         * 从指定的域namespace(比如master)   的连接池pool    提取一个poolConnection对象
         * poolConnection.release() 归还连接池    poolConnection继承Connection
         */
        // Target Group : MASTER, Selector : round-robin
        poolCluster.getConnection('master', function (err, connection) {
            if(err){
                logger.info(typeof Error("获取失败"))
                fn(null);
            }else{
                logger.debug("getConnection:" + connection._clusterId);
                fn(connection);
            }
        });
    },
}


var init = function(conf){

    var conf;
    // multiple hosts connection
    if(conf == "dev"){
        conf = mysqlconf.dev;
    }else if(conf == "release"){
        conf = mysqlconf.release;
    }
    if(conf == undefined || conf == null){
        conf =  mysqlconf.dev;
    }
    poolCluster = mysql.createPoolCluster(conf.cluster);
        /**
         * canRetry: If true, PoolCluster will attempt to reconnect when connection fails. (Default: true)
         * removeNodeErrorCount: If connection fails, node's errorCount increases. When errorCount is greater than removeNodeErrorCount, remove a node in the PoolCluster. (Default: 5)
         * restoreNodeTimeout: If connection fails, specifies the number of milliseconds before another connection attempt will be made. If set to 0, then node will be removed instead and never re-used. (Default: 0)
         * defaultSelector: The default selector. (Default: RR)
         *    RR: Select one alternately. (Round-Robin)
         *    RANDOM: Select the node by random function.
         *    ORDER: Select the first node available unconditionally.
         */

    //     canRetry : json.cluster.canRetry,  //链接失败自动重新链  default true
    //     removeNodeErrorCount : json.cluster.removeNodeErrorCount,  //链接失败一定次数会放弃这个链接  失败次数  default 5   失败5次认为节点失效
    //     restoreNodeTimeout : json.cluster.restoreNodeTimeout,  //如果认定节点失效   间隔多长时间再次链接这个节点  default 0  设置为0  节点一旦失效永不再使用
    //     defaultSelector : json.cluster.defaultSelector    //选择器  默认RR轮询使用   还有随机 和指定优先使用第一个链接
    // });


    //master配置
    poolCluster.add('master', conf.master);
    // poolCluster.add('master', {
    //     host     : json.master.host,
    //     user     : json.master.user,
    //     password : json.master.password,
    //     database : json.master.database,
    //
    //     /**
    //      * acquireTimeout: The milliseconds before a timeout occurs during the connection acquisition. This is slightly different from connectTimeout, because acquiring a pool connection does not always involve making a connection. (Default: 10000)
    //      * waitForConnections: Determines the pool's action when no connections are available and the limit has been reached. If true, the pool will queue the connection request and call it when one becomes available. If false, the pool will immediately call back with an error. (Default: true)
    //      * connectionLimit: The maximum number of connections to create at once. (Default: 10)
    //      * queueLimit: The maximum number of connection requests the pool will queue before returning an error from getConnection. If set to 0, there is no limit to the number of queued connection requests. (Default: 0)
    //      */
    //     acquireTimeout      : json.master.acquireTimeout, //获取链接超时 default 10000
    //     waitForConnections  : json.master.waitForConnections, //连接池已满 是否排队等待(false就是立刻回调返回error)  default true
    //     connectionLimit     : json.master.connectionLimit,   //连接池一次创建多少链接  default 10
    //     queueLimit          : json.master.queueLimit  //最大等待队列  waitForConnections设置为 true 时额外链接将进入等待队列 设置为0无限制   default 0
    // });


    //给每个cluster的 pool 加上监听
    poolCluster._nodes["master"].pool.on('acquire', function (connection) {
        logger.debug('Connection %d acquired', connection.threadId);
    });
    poolCluster._nodes["master"].pool.on('release', function (connection) {
        logger.debug('Connection %d released', connection.threadId);
    });


    poolCluster.on('remove', function (nodeId) {
        logger.warn('REMOVED NODE : ' + nodeId); // nodeId = SLAVE1
    });

}
