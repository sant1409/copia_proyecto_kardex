'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('nombre_del_insumo', {
      id_nombre_del_insumo: {
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
    await queryInterface.dropTable('nombre_del_insumo');
  }
};


