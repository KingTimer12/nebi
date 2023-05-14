import {
  ApplicationCommandDataResolvable,
  BitFieldResolvable,
  Client,
  ClientEvents,
  Collection,
  GatewayIntentsString,
  IntentsBitField,
  Partials,
} from "discord.js";
import dotenv from "dotenv";
import {
  CommandType,
  ComponentsButton,
  ComponentsModal,
  ComponentsSelect,
} from "./types/Command";
import fs from "fs";
import path from "path";
import { EventType } from "./types/Event";

dotenv.config();

const fileCondition = (fileName: string) =>
  fileName.endsWith(".ts") || fileName.endsWith(".js");
export class NebiClient extends Client {
  public commands: Collection<string, CommandType> = new Collection();
  public buttons: ComponentsButton = new Collection();
  public selects: ComponentsSelect = new Collection();
  public modals: ComponentsModal = new Collection();

  constructor() {
    super({
      intents: Object.keys(IntentsBitField.Flags) as BitFieldResolvable<
        GatewayIntentsString,
        number
      >,
      partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.GuildScheduledEvent,
        Partials.Message,
        Partials.Reaction,
        Partials.ThreadMember,
        Partials.User,
      ],
    });
  }

  public start() {
    this.registerModules();
    this.registerEvents();
    this.login(process.env.BOT_TOKEN);
  }

  private registerCommands(commands: Array<ApplicationCommandDataResolvable>) {
    this.application?.commands
      .set(commands)
      .then(() => {
        console.log("✅ Slash Commands (/) adicionados/modificados.".green);
      })
      .catch((error) => {
        console.log(`❌ Erro ao colocar os Slash Commands (/): \n${error}`.red);
      });
  }

  private registerModules() {
    const slashCommands: Array<ApplicationCommandDataResolvable> = new Array();

    const commandsPath = path.join(__dirname, "..", "commands");

    fs.readdirSync(commandsPath)
      .filter(fileCondition)
      .forEach(async (fileName) => {
        const command: CommandType = (await import(`../commands/${fileName}`))
          ?.default;
        const { name, buttons, selects, modals } = command;

        if (name) {
          this.commands.set(name, command);
          slashCommands.push(command);

          if (buttons)
            buttons.forEach((run, key) => this.buttons.set(key, run));
          if (selects)
            selects.forEach((run, key) => this.selects.set(key, run));
          if (modals) modals.forEach((run, key) => this.modals.set(key, run));
        }
      });

    this.on("ready", () => this.registerCommands(slashCommands));
  }

  private registerEvents() {
    const eventsPath = path.join(__dirname, "..", "events");

    fs.readdirSync(eventsPath)
      .filter(fileCondition)
      .forEach(async (fileName) => {
        const { name, once, run }: EventType<keyof ClientEvents> = (
          await import(`../events/${fileName}`)
        )?.default;

        try {
          if (name) once ? this.once(name, run) : this.on(name, run);
        } catch (error) {
          console.log(`An error occurred on event: ${name} \n${error}`.red);
        }
      });
  }
}
