import { prisma } from '../db/prisma-manager';

class Read
{

  static async likeCount(id){
      return await prisma.readClient.likes.count({
        where : {
            botId : id
        }
      })
   }

  static async isLiked({botId, userId}){
     const likes = await prisma.readClient.likes.findMany({
        where : {
            userId : userId,
            botId : botId
        }
     })
     return likes && likes.length > 0
  }
  

   static async byId(id){
      return await prisma.readClient.bot.findFirst({
        where : {
            id : id
        },
        include : {
            samplePrompts : true
         }
 

      })
   }

   static async countAll({ active }){
      console.log(active)
      return prisma.readClient.bot.count({
         where: active != undefined ? { isActive : active} : undefined
    });
  }
   static async all({skip , take, active}){
      console.log(active)
      console.log(skip)
      console.log(take)
      return await prisma.readClient.bot.findMany({
         where : active != undefined ? {
            isActive : active
         } : undefined,
         skip : skip ? skip : undefined,
         take : take ? take : undefined,
         include : {
            samplePrompts : true
         }
      })
   }

}
class Create{
  static async new({name, description, imageUrl , coverImage,  configUrl, isActive}){
    return await prisma.writeClient.bot.create({
        data : {
            name : name,
            description : description,
            image : imageUrl,
            coverImage : coverImage,
            isActive : isActive

        }
    })
  }

  static async addSamplePrompts({botId , prompts}){
     if(prompts.length < 1){
        return null
     }
     return await prisma.writeClient.samplePrompts.createMany(
        {
            data : prompts.map((prompt) => {
                return {
                    botId : botId,
                    text : prompt
                }
            })
        }
     )
  }

  static async like({botId, userId}){
      return await prisma.writeClient.likes.create({
         data : {
            userId : userId,
            botId : botId,
         }
      })
  }
  static async dislike({botId, userId}){
    return await prisma.writeClient.dislikes.create({
       data : {
          userId : userId,
          botId : botId,
       }
    })
}

}
class Update{

    static async setConfigLocation({id, url}){
        return await prisma.writeClient.bot.update({
            where : {
                id : id
            },
            data : {
                configLocation : url
            }

        })
    }


    static async updateStatus(id, active){
        return await prisma.writeClient.bot.update({
            where : {
                id : id
            },
            data : {
               isActive : active
     
            }
        })
      }

    static async replaceSamplePrompts({botId, samplePrompts}){
       return await prisma.writeClient.$transaction([
          prisma.writeClient.samplePrompts.deleteMany({where : { botId : botId }}),
          prisma.writeClient.samplePrompts.createMany({ data : samplePrompts.map(
              (item) => {
                  return {
                    botId: botId,
                    text : item 
                  }
          } )})
       ])        
    }

    static async update({id, name, description, imageUrl , configUrl, isActive, coverImage}){
        return await prisma.writeClient.bot.update({
            where : {
                id : id
            },
            data : {
                isActive : isActive,
                name :  name,
                description : description,
                image : imageUrl ?  imageUrl : undefined,
                coverImage : coverImage ? coverImage : undefined
            }
        })
      }

}
class Delete{

    static async unLike({botId, userId}){
        return await prisma.readClient.likes.deleteMany({
            where : {
                userId : userId,
                botId : botId
            }
        })
    }

    static async byId(id){
        return await prisma.writeClient.bot.deleteFirst({
            where: {
                id : id
            }
        }
        )
      }

}

export default { Read, Create, Update, Delete}