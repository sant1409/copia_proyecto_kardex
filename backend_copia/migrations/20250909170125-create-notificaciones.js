'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notificaciones', {
      id_notificacion: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tipo: {
        type: Sequelize.ENUM(
          'vencimiento_kardex',
          'vencimiento_insumo',
          'salida_kardex',
          'salida_insumo'
        ),
        allowNull: false,
      },
      id_kardex: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      id_insumo: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      mensaje: {
        type: Sequelize.STRING(512),
        allowNull: false,
      },
      fecha_evento: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      creado_por: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id_usuario',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      leido: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      enviado_email: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      fecha_creacion: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      // 🆕 Columnas auxiliares
      id_kardex_nn: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      id_insumo_nn: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      fecha_evento_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
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

    // Índices
    await queryInterface.addIndex('notificaciones', ['id_kardex']);
    await queryInterface.addIndex('notificaciones', ['id_insumo']);
    await queryInterface.addIndex('notificaciones', ['leido']);

      // 🆕 Índice único mejorado (incluye mensaje)
    await queryInterface.addConstraint('notificaciones', {
      fields: ['tipo', 'id_kardex_nn', 'id_insumo_nn', 'fecha_evento_date', 'mensaje'],
      type: 'unique',
      name: 'uniq_notif_tipo_entidad_fecha_mensaje',
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notificaciones');
  },
};
