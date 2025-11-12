
'use strict';

const { all } = require("../routes/auditoria");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('auditoria', {
      id_auditoria: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      entidad_afectada: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      id_entidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      accion:{
        type:Sequelize.STRING,
        allowNull: false,
      },

      fecha_hora: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      detalle_adicional: {
      type: Sequelize.TEXT,
      allowNull: true
      },

      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id_usuario'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      nombre_responsable: {
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
    await queryInterface.dropTable('auditoria');
  }
};
