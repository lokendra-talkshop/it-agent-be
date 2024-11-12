import { OAuth2Client } from "google-auth-library";

class Authenticator{

  static async authenticateUser(token){
    const googleClient = new OAuth2Client({
      clientId: `${process.env.GOOGLE_CLIENT_ID}`,
    });
    
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audient: `${process.env.GOOGLE_CLIENT_ID}`,
    });
    console.log(ticket)
    const payload = ticket.getPayload();
     
    return payload  
  };

}

export default {
  Authenticator
}