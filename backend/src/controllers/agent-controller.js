import { TrustedAdvisor } from 'aws-sdk';
import { prisma } from '../db/prisma-manager';
import { child } from 'winston';

class Read
{

    static async byServiceName({service , botId}){
       const agents =  await prisma.readClient.agent.findMany({
          where : {
              botId : botId,
              service : service
          }
       })
       if(agents.length > 0){
        return agents[0]
       }
       return null
    }
    static async byId({id}){
        return await prisma.readClient.agent.findFirst({
            where : {
                id : id
            }
        })
    }
    static async byTask({botId, task}){
        return await prisma.readClient.agent.findFirst({
            where : {
                botId : botId,
                role : task
            }
        })
    }

    static async taskById({id}){
        return await prisma.readClient.agentTaskExecution.findFirst({
            where : {
            id : id
            }
        })
    }

    static async byBot({id}){
        return await prisma.readClient.agent.findMany({
            where : {
                botId : id
            }
        })
    }

    static async taskTree({root , idsOnly}){
        const treeNode = await prisma.readClient.agentTaskNode.findMany({
            where : {
                parentId : root
            }, 
            include : {
                parent : true,
                child : true
            }
        }) 
        if(treeNode.length > 0){
            const rootNode = treeNode[0].parent 
            const children = await Promise.all(treeNode.map( (node) => {
               const child  = this.taskTree({root : node.childId})
               if(child == null){
                   return node.child
               }else{
                   return child
               }
            }
            ))
            if(idsOnly){
                return {'id' : rootNode.id ,  
                         'children' : children.map((child) => {return child.id })}              
            }
        }
        return null
    }

    
}

class Update {

    static async updateTaskContent({taskId , newContent}){
         return await prisma.writeClient.agentTaskExecution.update({
            where : {
                id : taskId
            },
            data : {
                taskContent : newContent
            }
         })
    }

    static async updateTaskType({taskId, newType }){
         return await prisma.writeClient.agentTaskExecution({
              where : {
                   id : taskId
              },
              data : {
                  taskType : newType
              }
         })
    }


    static async executeTask({taskId}){
        return await prisma.writeClient.agentTaskExecution.update({
            where : {
                id : taskId
            },
            data : {
                isExecuted : true
            }
        })
    }

    static async updateState({taskId,  newState}){
        return await prisma.writeClient.agentTaskExecution.update({
            where : {
                id : taskId,
            },
            data : {
                planState : newState
            }
        })
    }

}


class Create { 
    static async newTask({agentId, taskData, taskType , parentId , systemType , depth}){
     console.log("New Task Info")
     console.log(agentId)
     console.log(taskData)
     console.log(taskType)
     console.log(parentId)
     const newTask =  await prisma.writeClient.agentTaskExecution.create({
        data : {
             agentId : agentId,
             taskContent : taskData,
             taskType : taskType,
             systemStepType : systemType,
             depth : depth
        } 
    })
    if(parentId && parentId!=null){
        console.log("Writing parent Node")
        await prisma.writeClient.agentTaskNode.create({
          data : {
            parentId : parentId,
            childId : newTask.id 
          }
       })
    }

    return newTask
}
}

class Delete {
   static async deleteTask({taskId}){
       await prisma.$transaction([
           prisma.writeClient.agentTaskExecution.delete({
              where : {
                id : taskId
              }
           }),
           prisma.writeClient.taskQueue.delete({
              where : {
                taskExecutionId : taskId
              }
           })
       ])
   } 


}


export default {Read, Create , Update , Delete }