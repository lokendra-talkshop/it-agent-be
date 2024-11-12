import { prisma } from '../db/prisma-manager';
import { Prisma } from '@prisma/client';


class Read {

    static async get({planId, key}){
        return prisma.readClient.agentMemory.findFirst({
            where : {
                planId : planId,
                key : key
            }
        })
        
        
    }
    static async items({planId}){
       return prisma.readClient.agentMemory.findMany({
          where : {
             planId : planId
          }
       })
    }

}

class Create {
   static async put({planId, key, value}){
      await prisma.$transaction([
          prisma.writeClient.agentMemory.deleteMany({
            where : {
                planId : planId,
                key : key
            }
          }),
          prisma.writeClient.agentMemory.create({
             data : {
                key : key,
                value : value,
                planId : planId
             }
          })
      ])
   }
}


export default {
    Create,Read
}