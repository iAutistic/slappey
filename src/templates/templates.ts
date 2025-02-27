import { capitalize } from "../utils";

export function getEnvTemplate(token: string, prefix: string) {
  return `DISCORD_BOT_TOKEN=${token}\nDISCORD_BOT_PREFIX=${prefix}`;
}

export function getMainFile() {
  return `
  const { Client, GatewayIntentBits, Partials } = require('discord.js');
  const { Guilds, GuildMessages, MessageContent, GuildMembers } = GatewayIntentBits;
  const { User, Message, Reaction } = Partials
  const mongoose = require("mongoose")
  const { registerCommands, registerEvents } = require('./utils/registry');
  const config = require('../slappey.json');
  const client = new Client({
    intents: [ Guilds, GuildMessages, MessageContent, GuildMembers ],
    partials: [ User, Message, Reaction ],
    restTimeOffset: 0,
  });

  mongoose.connect(\`mongodb://localhost:27017/\${config.name}\`,
    console.log(
      "MongoDB Connected"
    )
  );

  (async () => {
    client.commands = new Map();
    client.events = new Map();
    client.prefix = config.prefix;
    await registerCommands(client, '../commands');
    await registerEvents(client, '../events');
    await client.login(config.token);
  })();\n
`;
}

export function getMainFileTS() {
  return `
import { registerCommands, registerEvents } from './utils/registry';
import config from '../slappey.json';
import DiscordClient from './client/client';
import { Intents } from "discord.js";
const client = new DiscordClient({ [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ] });

(async () => {
  client.prefix = config.prefix || client.prefix;
  await registerCommands(client, '../commands');
  await registerEvents(client, '../events');
  await client.login(config.token);
})();\n
`;
}

export function getTypescriptBotFile() {
  return `import { Client, ClientOptions, Collection } from 'discord.js';
import BaseEvent from '../utils/structures/BaseEvent';
import BaseCommand from '../utils/structures/BaseCommand';

export default class DiscordClient extends Client {

  private _commands = new Collection<string, BaseCommand>();
  private _events = new Collection<string, BaseEvent>();
  private _prefix: string = '!';

  constructor(options: ClientOptions) {
    super(options);
  }

  get commands(): Collection<string, BaseCommand> { return this._commands; }
  get events(): Collection<string, BaseEvent> { return this._events; }
  get prefix(): string { return this._prefix; }

  set prefix(prefix: string) { this._prefix = prefix; }

}
`;
}

export function getRegistryFileTS() {
  return `
import path from 'path';
import { promises as fs } from 'fs';
import DiscordClient from '../client/client';

export async function registerCommands(client: DiscordClient, dir: string = '') {
  const filePath = path.join(__dirname, dir);
  const files = await fs.readdir(filePath);
  for (const file of files) {
    const stat = await fs.lstat(path.join(filePath, file));
    if (stat.isDirectory()) registerCommands(client, path.join(dir, file));
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const { default: Command } = await import(path.join(dir, file));
      const command = new Command();
      client.commands.set(command.getName(), command);
      command.getAliases().forEach((alias: string) => {
        client.commands.set(alias, command);
      });
    }
  }
}

export async function registerEvents(client: DiscordClient, dir: string = '') {
  const filePath = path.join(__dirname, dir);
  const files = await fs.readdir(filePath);
  for (const file of files) {
    const stat = await fs.lstat(path.join(filePath, file));
    if (stat.isDirectory()) registerEvents(client, path.join(dir, file));
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const { default: Event } = await import(path.join(dir, file));
      const event = new Event();
      client.events.set(event.getName(), event);
      client.on(event.getName(), event.run.bind(event, client));
    }
  }
}
`;
}

export function getRegistryFile() {
  return `
const path = require('path');
const fs = require('fs').promises;
const BaseCommand = require('./structures/BaseCommand');
const BaseEvent = require('./structures/BaseEvent');

async function registerCommands(client, dir = '') {
  const filePath = path.join(__dirname, dir);
  const files = await fs.readdir(filePath);
  for (const file of files) {
    const stat = await fs.lstat(path.join(filePath, file));
    if (stat.isDirectory()) registerCommands(client, path.join(dir, file));
    if (file.endsWith('.js')) {
      const Command = require(path.join(filePath, file));
      if (Command.prototype instanceof BaseCommand) {
        const cmd = new Command();
        client.commands.set(cmd.name, cmd);
        cmd.aliases.forEach((alias) => {
          client.commands.set(alias, cmd);
        });
      }
    }
  }
}

async function registerEvents(client, dir = '') {
  const filePath = path.join(__dirname, dir);
  const files = await fs.readdir(filePath);
  for (const file of files) {
    const stat = await fs.lstat(path.join(filePath, file));
    if (stat.isDirectory()) registerEvents(client, path.join(dir, file));
    if (file.endsWith('.js')) {
      const Event = require(path.join(filePath, file));
      if (Event.prototype instanceof BaseEvent) {
        const event = new Event();
        client.events.set(event.name, event);
        client.on(event.name, event.run.bind(event, client));
      }
    }
  }
}

module.exports = { 
  registerCommands, 
  registerEvents,
};`;
}

export function getBaseCommand() {
  return `module.exports = class BaseCommand {
    constructor({
      name,
      category,
      aliases,
      description,
      usage,
      examples,
      permissions,
      guildOnly,
      devOnly,
      cooldown,
    }) {
      this.name = name;
      this.category = category;
      this.aliases = aliases || [];
      this.description = description || "";
      this.usage = usage || [];
      this.examples = examples || [];
      this.permissions = permissions || [];
      this.guildOnly = guildOnly || true;
      this.devOnly = devOnly || false;
      this.cooldown = cooldown || 0;
    }
  }`;
}

export function getBaseCommandTS() {
  return `
import { Message } from 'discord.js';
import DiscordClient from '../../client/client';

export default abstract class BaseCommand {
  constructor(private name: string, private category: string, private aliases: Array<string>) {}

  getName(): string { return this.name; }
  getCategory(): string { return this.category; }
  getAliases(): Array<string> { return this.aliases; }

  abstract run(client: DiscordClient, message: Message, args: Array<string> | null): Promise<void>;
}`;
}

export function getBaseEvent() {
  return `module.exports = class BaseEvent {
  constructor(name) {
    this.name = name;
  }
}`;
}

export function getBaseEventTS() {
  return `
import DiscordClient from '../../client/client';

export default abstract class BaseEvent {
  constructor(private name: string) { }

  getName(): string { return this.name; }
  abstract run(client: DiscordClient, ...args: any): void;
}
`;
}

export function getReadyEvent() {
  return `const BaseEvent = require('../../utils/structures/BaseEvent');

  module.exports = class ReadyEvent extends BaseEvent {
    constructor() {
      super('ready');
    }
    async run (client) {
      await client.user.setPresence({
        activity: { name: "Loading...", type: "PLAYING" },
        status: "dnd",
      });
      return console.log(client.user.tag + " has logged in.");
    }
}`;
}

export function getReadyEventTS() {
  return `import BaseEvent from '../../utils/structures/BaseEvent';
import DiscordClient from '../../client/client';

export default class ReadyEvent extends BaseEvent {
  constructor() {
    super('ready');
  }
  async run (client: DiscordClient) {
    console.log('Bot has logged in.');
  }
}`;
}

export function getMessageEvent() {
  return `const BaseEvent = require("../../utils/structures/BaseEvent");
  const cooldowns = new Map();
  const { Collection } = require("discord.js");
  
  module.exports = class MessageEvent extends BaseEvent {
    constructor() {
      super("messageCreate");
    }
  
    async run(client, message) {
      if (message.author.bot) return;
      if (message.content.startsWith(client.prefix)) {
        const [cmdName, ...cmdArgs] = message.content
          .slice(client.prefix.length)
          .trim()
          .split(/\\s+/);
        const command = client.commands.get(cmdName);
  
        if (command) {
          
            
          if (command.guildOnly && message.channel.type === "DM") {
            return;
          }
  
          if (!message.member.permissions.has(command.permissions)) {
            return;
          }
  
          if (
            !message.guild.members.cache
              .get(client.user.id)
              .permissions.has(command.permissions || "SEND_MESSAGES")
          ) {
            return;
          }
  
          if (
            !message.guild.members.cache
              .get(client.user.id)
              .permissions.has(command.permissions)
          ) {
            return message.channel.send(\`I couldn't. Please check my permissions.\`);
          }
  
          const current_time = Date.now();
          const time_stamps = cooldowns.get(command.name);
          const cooldown_amount = command.cooldown * 1000;
  
          if (time_stamps.has(message.author.id)) {
            const expiration_time =
              time_stamps.get(message.author.id) + cooldown_amount;
  
            if (current_time < expiration_time) {
              const time_left = (expiration_time - current_time) / 1000;
  
              return message.channel.send(
                \`Cooldown (\${time_left.toFixed(0)}) Seconds\`
              );
            }
          }
  
          time_stamps.set(message.author.id, current_time);
          setTimeout(() => {
            time_stamps.delete(message.author.id);
          }, cooldown_amount);
  
          command.run(client, message, cmdArgs);
        }
      }
    }
}`;
}

export function getMessageEventTS() {
  return `import BaseEvent from '../../utils/structures/BaseEvent';
import { Message } from 'discord.js';
import DiscordClient from '../../client/client';

export default class MessageEvent extends BaseEvent {
  constructor() {
    super('message');
  }

  async run(client: DiscordClient, message: Message) {
    if (message.author.bot) return;
    if (message.content.startsWith(client.prefix)) {
      const [cmdName, ...cmdArgs] = message.content
        .slice(client.prefix.length)
        .trim()
        .split(/\\s+/);
      const command = client.commands.get(cmdName);
      if (command) {
        command.run(client, message, cmdArgs);
      }
    }
  }
}`;
}

export function getTestCommand() {
  return `const BaseCommand = require('../../utils/structures/BaseCommand');

  module.exports = class TestCommand extends BaseCommand {
    constructor() {
      super({
        name: 'test',
        category: 'testing', 
        aliases: [], 
        description: "",
        usage: [],
        examples: [],
        permissions: [],
        guildOnly: true,
        cooldown: 0,
      });
    }
  
    async run(client, message, args) {
      message.channel.send('Test command works');
    }
}`;
}

export function getTestCommandTS() {
  return `import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class TestCommand extends BaseCommand {
  constructor() {
    super('test', 'testing', []);
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    message.channel.send('Test command works');
  }
}`;
}

export function getCommandTemplate(name: string, category: string) {
  return `const BaseCommand = require('../../utils/structures/BaseCommand');

  module.exports = class ${capitalize(name)}Command extends BaseCommand {
    constructor() {
      super({
        name: '${name}',
        category: '${category}', 
        aliases: [], 
        description: "",
        usage: [],
        examples: [],
        permissions: [],
        guildOnly: true,
        cooldown: 15,  
    });
    }
  
   async run(client, message, args) {
      message.channel.send('${name} command works');
    }
}`;
}

export function getCommandTemplateTS(name: string, category: string) {
  return `import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class ${capitalize(name)}Command extends BaseCommand {
  constructor() {
    super('${name}', '${category}', []);
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    message.channel.send('${name} command works');
  }
}`;
}

export const TSCONFIG = `
{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "outDir": "./build",
    "esModuleInterop": true,
  }
}
`;
