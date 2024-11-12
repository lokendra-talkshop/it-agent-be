import { prisma } from '../db/prisma-manager';

class Read {
  static async byId({messageId}) {
      return prisma.readClient.message.findFirst({
        where : {
            id : messageId
        }
      })
   }

   static async getTasksForMessage({messageId , reverseOrder}) {
       return prisma.readClient.agentTaskExecution.findMany({
          where : {
            messageId : messageId
          },

          orderBy: [
            { createdAt: reverseOrder ? 'desc' : 'asc' }
         ]
       })
   }
}


class Delete {
    static byId({messageId}){
        
        return prisma.writeClient.message.delete({
          where : {
             id : messageId
          }
        })
    }
}
export default { Read };
