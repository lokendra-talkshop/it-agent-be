import { prisma } from '../db/prisma-manager';
import { adminRolesToActions, TokenManager } from '../node-utils';

class Read {

  static async byId(id) {
    return prisma.readClient.adminUsers.findUnique({
      where: {
        id,
      },
    });
  }
  static async getRole({ id }) {
    const user = await prisma.readClient.adminUsers.findUnique({
      where: {
        id,
      },
    });

    return user?.role;
  }

  static async hasRole({ id, role }) {
    const user = await prisma.readClient.adminUsers.findUnique({
      where: {
        id,
      },
    });

    return user?.role === role;
  }

  static async canPerformAction({ id, action }) {
    const user = await prisma.readClient.adminUsers.findUnique({
      where: { id },
    });

    return adminRolesToActions[user?.role]?.includes(action);
  }

  static async byEmail(email) {
    return prisma.readClient.adminUsers.findUnique({
      where: {
         email : email,
      },
    });
  }
}

class Create {}

class Update {

   static async newId({oldId , newId}){
      return await prisma.writeClient.adminUsers.update({
        where : {
          id : oldId
        },
        data : {
          id : newId
        }
      })
   }

}

class Delete {}



class Tokens {
  static async createJWTTokens(adminUser) {
    const { jwtToken, expireAt } = TokenManager.generateAdminJWTToken(
      { minutes: 0, hours: 0, days: 7 },
      adminUser.id,
      adminUser.name,
      adminUser.email,
    );
    return { jwtToken, expireAt };
  }

  // TODO Plugin refresh token with shorter JWT expiry
}

export default {
  Read,
  Create,
  Update,
  Delete,
  Tokens,
};
