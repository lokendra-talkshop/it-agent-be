import { prisma } from '../db/prisma-manager';
import { loggerInstance } from '../node-utils';

class Read {
  static async forUser({userId}) {
     return prisma.readClient.report.findMany({
        where : {
            reporterId : userId
        },
          include : {
            message : {
                include : {
                    conversation : {
                        include : {
                            Bot : true
                        }
                    }
                }
            }
        }
     })
  }

  static async forBot({botId}) {
    return prisma.readClient.report.findMany({
        where : {
            mesage : {
                conversation : {
                    botId : botId
                }
            }
        },
        include : {
            message : {
                include : {
                    conversation : {
                        include : {
                            Bot : true
                        }
                    }
                }
            }
        }
    })
  }

  static async all() {
      return prisma.readClient.findMany({
        include : {
            message : {
                include : {
                    conversation : {
                        include : {
                            Bot : true
                        }
                    }
                }
            }
        }
      })
  }
}

class Create {
  static async forMessage({userId, messageId, reason }) {
    loggerInstance.info(messageId);
    await prisma.writeClient.reportedPosts.create({
        data: {
          messageId,
          reporterId : userId,
          reason,
        },
    })
  }
}

class Update {}

class Delete {
  static async byMessageId({userId, messageId}) {
    return prisma.writeClient.report.deleteMany({
      where: {
        reporterId : userId,
        messageId : messageId,
      },
    });
  }
  
  static async byId({id}){
    return prisma.writeClient.report.delete({
        where : {
            id : id
        }
    })
  }
}

export default { Read, Create, Update, Delete };
