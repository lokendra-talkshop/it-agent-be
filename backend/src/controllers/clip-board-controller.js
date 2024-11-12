import { prisma } from '../db/prisma-manager';
class Read {

   static async entry({entryId}){
      return prisma.readClient.findFirst({
         where : {
            id : entryId
         }
      })
   }

   static async entries({userId, botId}){
      return prisma.readClient.clipBoard.findMany({
         where : {
            saverId : userId,
            message: botId ?  {
               conversation: {
                  botId : botId
               }
            } : undefined

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
}

class Update {
}

class Create {
   static async save({messageId, userId}){
      return prisma.writeClient.clipBoard.create({
        data : {
            userId : userId,
            messageId : messageId
        }
      })
   }

}


class Delete {
  static async byId({id}){
     return prisma.writeClient.$transaction([
        prisma.writeClient.message.deleteMany({
           where : {
               clipBoardEntryId : id,
               conversationId : {
                  is : null
               }
           }
        }),
        prisma.writeClient.clipBoard.delete({
            where : {
                id : id
            }
        })
     ])
  }
}

export default { Read, Create, Update, Delete };