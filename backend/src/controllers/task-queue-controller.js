import { prisma } from '../db/prisma-manager';

class Read {
   static async peek(conversationId) {

      const topOfQueue = await prisma.readClient.taskQueue.findMany({
         where: {
            conversationId: conversationId
         },
         include: {
            taskExecution: {
               include: {
                  parentNode: true
               }
            }
         },
         orderBy: [
            { priority: 'asc' },
            { createdAt: 'desc' }
         ]
      })
      if (topOfQueue.length > 0) {
         return topOfQueue[0]
      } else {
         return null
      }

   }
   static async dequeue(conversationId) {
      const topOfQueue = await this.peek(conversationId)

      if (topOfQueue != null) {
         await prisma.writeClient.taskQueue.delete({
            where: {
               id: topOfQueue.id
            }
         })
         return topOfQueue
      }
      return null


   }

}

class Create {
   static async enqueue({ conversationId, taskExecution, priority }) {
      return prisma.readClient.taskQueue.create({
         data: {
            conversationId: conversationId,
            taskExecutionId: taskExecution,
            priority: priority
         }
      })
   }

}


export default {
   Read, Create
}