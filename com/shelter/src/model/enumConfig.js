module.exports = EnumConfig;

function EnumConfig(){

};


/** 消息枚举 */
EnumConfig.prototype.msgEnum = {
    success:200,   //普通消息
    fail:1,     //操作失败消息反馈
    error:2,    //错误消息
};

//房间信息记录
EnumConfig.prototype.roomsInfo = [];