const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");
const { toMoment } = require("../utils/timerApi");
const { set } = require("../utils/correioCached");
require("dotenv").config();

const DIADEUSO = 12; //Dia que isso funcionará
const DIALIMITE = 12; //Dia que parará de funcionar
const MESDEUSO = 6; //Mês que isso funcionará

module.exports = {
  data: new SlashCommandBuilder()
    .setName("correio")
    .setDescription("Envie uma mensagem anônima")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("O destinatário da sua mensagem.")
        .setRequired(true)
    ),

  dev: false,

  async execute(interaction) {
    const currentDate = toMoment(Date.now());
    const { options, client, user } = interaction;
    const userId = user.id;

    //Verificando se ainda tá tendo evento.
    if (currentDate.date() >= DIALIMITE) {
      return await interaction
        .reply({
          content:
            currentDate.date() < DIADEUSO
              ? "O evento ainda não foi iniciado."
              : "O evento já passou.",
          ephemeral: true,
        })
        .catch(console.error);
    }

    //Pegando o ID do cabaré pra pegar os chats
    //1046080828716896297 - Cabaré
    const guild = client.guilds.cache.find(
      (guild) => guild.id == "1046080828716896297"
    );
    if (guild == undefined) {
      return await interaction.reply({
        content: "Ocorreu um erro inesperado! ID: SCmK9",
        ephemeral: true,
      });
    }

    //Pegando o destinatário
    const targetUser = await options.getUser("user");
    if (userId == targetUser.id) {
      //Checando se o cara não tá usando em si
      return await interaction
        .reply({
          content: "Você não pode enviar uma carta para si!",
          ephemeral: true,
        })
        .catch(console.error);
    }
    if (targetUser.bot) {
      //Checando se o cara não é um bot
      return await interaction
        .reply({
          content:
            "Ainda não temos sentimentos para receber esse tipo de carta.",
          ephemeral: true,
        })
        .catch(console.error);
    }

    //Criando o modal
    const modal = new ModalBuilder()
      .setCustomId("modal-correio")
      .setTitle("Correio do Amor")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("message")
            .setStyle(TextInputStyle.Paragraph)
            .setLabel("Mensagem:")
            .setPlaceholder("Coloque aqui a mensagem bonitinha")
            .setMaxLength(2000)
            .setRequired(true)
        )
      );
    set(userId, targetUser.id)
    await interaction.showModal(modal).catch(console.log); //Mostrando o modal
  },
};
