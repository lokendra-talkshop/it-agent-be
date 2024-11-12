import twilio from 'twilio';

class TwilioService {
  client;

  phoneNumberValidationRegex = /^\+/;

  constructor() {
    this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  async sendMessage(to, body, countryCode) {
    let twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    if (countryCode === '+44' || countryCode === '44') {
      twilioPhoneNumber = '+447893941405';
    }
    return this.client.messages.create({
      body,
      from: twilioPhoneNumber,
      to: this.phoneNumberValidationRegex.test(to) ? to : `+${to}`,
    });
  }
}

const twilioService = new TwilioService();

export { twilioService };
