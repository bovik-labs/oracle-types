type Interpret<Msg extends string> = Lowercase<Msg> extends "number\n" ? number
  : Lowercase<Msg> extends "string\n" ? string
  : Msg;

export type PhoneAFriend<Query extends string> =
  Interpret<Lowercase<Shell<`TWILIO_JSON=/tapeworm/twilio.json node /tapeworm/twilio_client/out/index.js '${Query}'`>>>;
