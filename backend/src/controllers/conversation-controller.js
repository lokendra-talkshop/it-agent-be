import { prisma } from '../db/prisma-manager';
import { Prisma } from '@prisma/client';

class Read {

    static async countForBot({botId}){
        return prisma.readClient.conversation.count({
            where : {
                botId : botId
            }
        })
    }

    static async getMostRecentMessage({convoId}){
        return prisma.readClient.message.findMany({
            where : {
                converationId : convoId
            },
            skip : 0,
            take : 1,
            orderBy : {
                createdAt : 'desc'
            }
        })
    }

    static async getMessages({id}){
    
        return prisma.readClient.message.findMany({
            where : {
                conversationId : id
            },
            
            include : {
                sender : true,
                
                conversation : {
                    include : {
                        Bot: true
                    }
                }
            },
            orderBy : {
                createdAt : 'asc'
            }
        })
    }

    static async byId({id}){
        
        return prisma.readClient.conversation.findFirst({
            where : {
                id : id
            },
            
            include : {
                Bot : true
            }
        })
    }

    static async forUser({userId , botId}){
        return prisma.readClient.conversation.findMany({
            where : {
                userId : userId, 
                botId : botId
            },
            include : {
                User : true,
                Bot : true
            }
        })
   }

   static async getMostRecentUniqueConvos({userId}){
      console.log('loading model')
      const query = Prisma.sql`SELECT c.id ,b.id as bot_id, b.image as image, c.thread_id as thread_id,  b.name as name, c.user_id as user_id, c.created_at as created_at
                                FROM  bots b , conversations c, (
                                       SELECT c.bot_id , MAX(c.created_at) 
                                       FROM conversations c 
                                       WHERE c.user_id = ${userId} 
                                       GROUP BY c.bot_id 
                                      ) t
                               WHERE t.bot_id = c.bot_id AND c.created_at = t.max AND c.user_id = ${userId} AND  b.id = c.bot_id 
                               ORDER BY c.created_at DESC`
      console.log(query)
      return  await prisma.readClient.$queryRaw(query)
   }

}





class Create {
   static async new({userId, botId}){
      return prisma.writeClient.conversation.create({
        data : {
            userId : userId,
            botId : botId
        }
      })
   }
}

class Update {
   static async addMessage({id , userId, conversationId, text, content }){
       return prisma.writeClient.message.create({
         data :{
              id : id ? id : undefined,
              senderId : userId ? userId : undefined,
              conversationId : conversationId,
              text : text,
              content : content
         }
       })
   }

   static async setThreadId({conversationId, threadId}){
      return prisma.writeClient.conversation.update({
        where :{
            id: conversationId
        },
        data : {
            threadId : threadId
        }
      })
   }
}


class Delete {

   static async byId({conversationId}){
        return prisma.writeClient.$transaction([
            
            prisma.writeClient.message.deleteMany({
                where : {
                    conversationId : conversationId,
                    clipBoardEntry: {
                        is : null
                    }
                }
            }),
            prisma.writeClient.conversation.delete({
               where :{
                  id : conversationId
               }
            })
        ])

   }
}

export default { Read, Create, Update, Delete };
