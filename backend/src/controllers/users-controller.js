import { prisma } from '../db/prisma-manager';
import { BadRequestError, TokenManager, loggerInstance } from '../node-utils';
import appConfig from '../configs';
import { userErrorCodes } from '../configs/errors';

class Read {
  static async byName(name) {
    return prisma.readClient.users.findMany({
      where: {
        name: {
          startsWith: name,
        },
      },
    });
  }

  static async byEmail({email}){
    return prisma.readClient.users.findUnique({
      where : {
        email : email
      }
    })
  }

  static async byId(id) {
    return prisma.readClient.users.findUnique({
      where: {
        id,
      }
    });
  }

  static async allUsers() {
    return prisma.readClient.users.findMany({});
  }

  static async exists(id) {
    const user = await prisma.readClient.users.findUnique({
      where: {
        id,
      },
      select: { id: true },
    });

    return !!user;
  }
}

class Create {
  static async new(email) {
    const user = await prisma.writeClient.users.create({
      data: {
        email
      },
    });
    return user;
  }
}

class Update {
  static async updateIsOfLegalAge({ userId, isOfLegalAge }) {
    return prisma.writeClient.users.update({
      where: {
        id: userId,
      },
      data: {
        isOfLegalAge: isOfLegalAge === true || isOfLegalAge === 'true',
      },
    });
  }

  static async addName(userId, name) {
    return prisma.writeClient.users.update({
      where: {
        id: userId,
      },
      data: {
        name,
      },
    });
  }

  static async addProfilePic(userId, profilePicUrl) {
    return prisma.writeClient.users.update({
      where: {
        id: userId,
      },
      data: {
        profilePicUrl,
      },
    });
  }

  static async unsetProfilePicture(userId) {
    return prisma.writeClient.users.update({
      where: {
        id: userId,
      },
      data: {
        profilePicUrl: null,
      },
    });
  }
}

class Delete {
  static async byId(id) {
    const user = await Read.byId(id);
    if (!user) {
      throw new BadRequestError(userErrorCodes.userNotFound);
    }

    // ! Be very careful with this method
    return prisma.writeClient.$transaction([
      prisma.writeClient.userTokens.deleteMany({ where: { userId: id } }),
      prisma.writeClient.users.delete({ where: { id } }),
    ]);
  }
}

class Tokens {
  static createJWTToken(user) {
    const { jwtToken, expireAt } = TokenManager.generateUserJWTToken(
      appConfig.env === 'dev' ? { minutes: 0, hours: 0, days: 7 } : { minutes: 10, hours: 0, days: 0 },
      user.id,
      user.name,
      user.email,
    );
    return { token: jwtToken, expireAt };
  }

  static createRefreshToken(user) {
    const { refreshToken, expireAt } = TokenManager.generateUserRefreshToken(
      { minutes: 0, hours: 0, days: 90 },
      user.id,
      user.name,
      user.email,
    );
    return { token: refreshToken, expireAt };
  }

  static async verifyUserRefreshToken(refreshToken) {
    return TokenManager.verifyUserRefreshToken(refreshToken);
  }
}
export default { Read, Create, Tokens, Update, Delete };
