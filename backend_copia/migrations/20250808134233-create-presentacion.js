'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('presentacion', {
      id_presentacion: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: true
      },
            id_sede: {
        type:Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'sede',
          key: 'id_sede'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('presentacion');
  }
};


