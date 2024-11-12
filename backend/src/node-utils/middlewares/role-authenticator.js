import { TokenManager } from '../services/token-manager';
import { NotAuthorizedError } from '../errors/not-authorized-error';
import authController from '../../controllers/auth-controller';

export class RoleAuthenticators {
  gate;

  constructor(roles) {
    const gate = this.constructORGate(roles);
    this.gate = gate;
  }

  constructORGate(roles) {
    console.log(roles)
    const orGate = roles.map((role) => this.constructANDGate(role));
    return (token) => orGate.some((gate) => gate(token))
  }


  constructANDGate(role) {
    return (token) => {
      for (const key in role) {
        if (!token[key] || token[key] !== role[key]) {
          return false;
        }
      }
      return true;
    };
  }

  verifyRole() {
    return async (req, res, next) => {
      const encryptedToken = req.token;
      console.log(req.token)
      if (!encryptedToken) {
        throw new NotAuthorizedError();
      }
      const {isAllowed, jwtToken} = this.authenticate(encryptedToken, req);
      req.token = encryptedToken;
      // @ts-ignore
      req.tokenPayload = jwtToken;
  
      if (!isAllowed) {
        throw new NotAuthorizedError();
      } else {
        next();
      }
    };
  }

  authenticate(encryptedToken) {
    let jwtToken = null;
    try {
      jwtToken = TokenManager.verifyUserJWTToken(encryptedToken);
      console.log(jwtToken);
    } catch (error) {
      console.log(error);
      throw new NotAuthorizedError();
    }
    if (!jwtToken) {
      throw new NotAuthorizedError();
    }

    const isAllowed = this.gate(jwtToken);
    return {isAllowed, encryptedToken, jwtToken};
  }
}
