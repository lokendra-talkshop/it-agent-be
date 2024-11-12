import { prisma } from '../db/prisma-manager';
import { Prisma } from '@prisma/client';

class Read {
   static async byId(planId){
       return prisma.readClient.plan.findFirst({
           where : {
              id : planId
           }
       })
   }
}


class Create {
   static async new({conversationId, rootId}){
      return prisma.writeClient.plan.create({
        data : {
            conversationId : conversationId,
            rootId : rootId
        }
      })
   }
}


export default {
    Read, Create
}