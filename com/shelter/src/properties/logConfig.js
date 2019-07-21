
module.exports = {
  dev : {
      appenders:{
          AllLog:{
              type:"console"
              // filename:"shelterInfo.log",
              // maxLogSize: 1024*1024*5
          }
      },
      categories:{
          default:{
              appenders:[
                  "AllLog"
              ],
              level:"warn"
          },
          dev:{
              appenders:[
                  "AllLog"
              ],
              level:"debug"
          },
      }
  },
  release : {
      appenders:{
          InfoLog:{
              type:"file",
              filename:"/var/log/shelter_log.d/shelterInfo.log",
              maxLogSize: 1024*1024*10
          },
      },
      categories:{
          default:{
              appenders:[
                  "InfoLog"
              ],
              level:"warn"
          },
          release:{
              appenders:[
                  "InfoLog",
              ],
              level:"info"
          }
      }
  }
}