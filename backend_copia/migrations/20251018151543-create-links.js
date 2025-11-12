"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("links", {
      id_link: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nombre: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      link: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      fecha_creacion: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("links");
  },
};
