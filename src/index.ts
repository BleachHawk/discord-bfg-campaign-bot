import { Client, Events, GatewayIntentBits, User } from 'discord.js';
import * as db from './db/db';
import * as dbQueries from './db/queries';
import type { battles } from './db/schema';

interface IEmbeds {
  created: any;
  closed: any;
}

interface IField {
  name: string;
  value: string;
}

const KEY_CREATED = 'Ticket Created';
const KEY_CLOSED = 'Ticket Closed';
const KEY_PLAYER_1 = 'Player 1';
const KEY_PLAYER_2 = 'Player 2';
const KEY_SYSTEM = 'Target System';
const KEY_POINT_LIMIT = 'Point Limit';
const KEY_P1_VP = 'Player 1 Victory Points';
const KEY_P2_VP = 'Player 2 Victory Points';
const KEY_BATTLE_REPORT = 'Narrative Battle Report';

async function main() {
  // init the database
  await db.initializeDatabase();

  /**
   * The Discord client.
   */
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ],
  });

  /**
   * Discord event handler for successful login.
   */
  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user?.tag}`);
  });
  /**
   * Discord event handler for message posts.
   */
  client.on(Events.MessageCreate, async (message) => {
    parseMessage(message);
  });

  /**
   * Get the embeds of messages in the given channel.
   * @param channel the channel
   * @returns the IEmbeds containing created / closed embeds.
   */
  async function getEmbeds(channel: any): Promise<IEmbeds> {
    let embeddedMsgs: IEmbeds = {
      created: '',
      closed: '',
    };

    // get all the messages from channel
    await channel.messages.fetch({ limit: 100 }).then(messagePage => {
      messagePage.forEach(msg => {
        // check for 1 embed
        if (msg.embeds && msg.embeds.length === 1) {
          const embed = msg.embeds[0];
          if (embed.data) {
            const data = embed.data;

            // check if the embed is either ticket created or ticket closed
            if (data.title === KEY_CREATED) {
              embeddedMsgs.created = data;
            }
            else if (data.title === KEY_CLOSED) {
              embeddedMsgs.closed = data;
            }
          }
        }
      });
    });

    return embeddedMsgs;
  }

  /**
   * Check if the user is allowed to submit.
   * @param user the user
   * @returns true / false
   */
  async function userCanSubmit(user: string): Promise<boolean> {
    // // get submissions from DB
    // const submissions = new Map<string, number[]>()
    // const now = Date.now();
    // const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // const recent = (submissions.get(user) ?? [])
    //   .filter(timestamp => timestamp > weekAgo);

    // if (recent.length >= 2) {
    //   // 'WARN: the user <user> has submitted 2 results in the last 7 days'
    //   return false;
    // }

    // recent.push(now);
    // // TODO: update submissions in DB
    // // submissions.set(user, recent);

    return true;
  }

  /**
   * Parse the given message
   * @param message 
   * @returns 
   */
  async function parseMessage(message: any) {
    const msgContent = message.content;
    const author = message.author;

    // ignore our own messages
    if (author.username.indexOf('BFG_Campaign_Bot') > -1) {
      return;
    }

    console.log(`${message.guild} / ${author.tag} said: ${message.content}`);

    // get the embeds from messages in this channel
    const channelId = message.channelId;
    const channel = client.channels.cache.get(channelId);
    const embeds = await getEmbeds(channel);

    if (embeds.closed) {
      // -> store the battle result
      message.channel.send('=== Closed Battle Result found, processing ===');
      processBattle(message, embeds.created.fields, author);
    } else if (embeds.created) {
      message.channel.send('=== Open Battle Result found, valid input, not processing yet ===');

      // check if the fields are valid
      const validBattle = await validateFields(message, embeds.created.fields)
      if (validBattle) {
        // check if the user can submit
        const user = embeds.created.fields.find((field: IField) => field.name === 'Created By').value;
        const canSubmit = await userCanSubmit(user);
        if (!canSubmit) {
          message.channel.send('=== **WARN:** User ' + user + ' has submitted 2 Battle Results in the past 7 days ===');
        }
      }
    } else {
      console.log('Message was determined to not be intended for the bot');
    }
  }

  /**
   * Validate the given fields and build a battle report object.
   * @param message the message
   * @param fields the message embed fields
   * @returns a battle report object or undefined if there is something wrong
   */
  async function validateFields(message: any, fields: IField[]): Promise<typeof battles.$inferInsert | undefined> {
    const campaign = await dbQueries.getCampaignByDiscord(message.guild);

    let battle: typeof battles.$inferInsert = {
      campaign_ID: campaign.campaign_ID
    };

    let error = '';

    for (const field of fields) {
      switch (field.name) {
        case KEY_PLAYER_1:
          const faction1 = await dbQueries.getFactionByName(field.value);
          battle.battle_faction1 = faction1.faction_ID;
          break;
        case KEY_PLAYER_2:
          const faction2 = await dbQueries.getFactionByName(field.value);
          battle.battle_faction2 = faction2.faction_ID;
          break;
        case KEY_SYSTEM:
          const system = await dbQueries.getSystemByName(field.value);
          battle.battle_system = system.system_ID;
          break;
        case KEY_POINT_LIMIT:
          const points = parseInt(field.value);
          if (points < 250 || points > 5000) {
            error += 'Point Limit outside of range: 750 - 5000\n';
            battle.battle_points = 0;
          } else {
            battle.battle_points = points;
          }
          break;
        case KEY_P1_VP:
          const vp1 = parseInt(field.value);
          if (vp1 < 0 || vp1 > 5000) {
            error += 'Player 1 Victory Points outside of range: 0 - 5000\n';
            battle.battle_points = 0;
          } else {
            battle.battle_victoryPoints1 = vp1;
          }
          break;
        case KEY_P2_VP:
          const vp2 = parseInt(field.value);
          if (vp2 < 0 || vp2 > 5000) {
            error += 'Player 2 Victory Points outside of range: 0 - 5000\n';
            battle.battle_points = 0;
          } else {
            battle.battle_victoryPoints2 = vp2;
          }
          break;
        case KEY_BATTLE_REPORT:
          const report = sanitize(field.value);
          battle.battle_report = report ? report : '';
          break;
      }
    };

    if (error) {
      console.log('Error: ' + error);
      await message.channel.send('=== **ERROR:** ===\n' + error);
      return undefined;
    }
    return battle;
  }

  /**
   * Process and store a battle report.
   * @param message the message
   * @param fields the fields
   * @param author the author
   */
  async function processBattle(message: any, fields: IField[], author: User) {
    const battle = await validateFields(message, fields);
    if (battle) {
      console.log('Adding battle: ' + JSON.stringify(battle));
      battle.battle_author = author.tag;
      await dbQueries.addBattle(battle);

      // TODO: calculate control points
      // 1. get all battles, filter for target system
      // 2. calculate for each faction
      // 3. update faction ID if a new faction has the most control points

      await message.channel.send('=== Battle Result has been logged ===');
    } else {
      console.log('Error: no battle to process');
    }
  }

  /**
   * Sanitize given string.
   * @param string the string
   * @returns the sanitized string
   */
  function sanitize(string: string) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      "/": '&#x2F;',
      '`': '&grave'
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match: string | number) => (map[match]));
  }

  // login to Discord
  await client.login(process.env.DISCORD_BOT_TOKEN);
}
main().catch(console.error);