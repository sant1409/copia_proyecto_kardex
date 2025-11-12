
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('insumos', {
      id_insumo: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      fecha: { type: Sequelize.DATE, allowNull: true },
      temperatura: { type: Sequelize.STRING, allowNull: true },
      cantidad: { type: Sequelize.INTEGER, allowNull: true },
      salida: { type: Sequelize.INTEGER, allowNull: true },
      saldo: { type: Sequelize.INTEGER, allowNull: true },

      id_nombre_del_insumo: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'nombre_del_insumo',
          key: 'id_nombre_del_insumo'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      id_presentacion: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'presentacion',
          key: 'id_presentacion'
        },

          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        
      },

      id_laboratorio: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'laboratorio',
          key: 'id_laboratorio'
        },
        onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        
      },

      id_proveedor:  {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'proveedor',
          key: 'id_proveedor'
        },
        onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        
      },

      lote: { type: Sequelize.STRING, allowNull: true },
      fecha_de_vto: { type: Sequelize.DATE, allowNull: true },
      registro_invima: { type: Sequelize.STRING, allowNull: true },
      expediente_invima: { type: Sequelize.STRING, allowNull: true },



      id_clasificacion: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'clasificacion',
          key: 'id_clasificacion'
        },
        onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
      },

      estado_de_revision: { type: Sequelize.STRING, allowNull: true },
      salida_fecha: { type: Sequelize.DATE, allowNull: true },
      inicio: { type: Sequelize.DATE, allowNull: true },
      termino: { type: Sequelize.DATE, allowNull: true },
      lab_sas: { type: Sequelize.STRING, allowNull: true },
      factura: { type: Sequelize.STRING, allowNull: true },
      costo_global: { type: Sequelize.DECIMAL, allowNull: true },
      costo: { type: Sequelize.DECIMAL, allowNull: true },
      costo_prueba: { type: Sequelize.DECIMAL, allowNull: true },
      costo_unidad: { type: Sequelize.DECIMAL, allowNull: true },
      iva: { type: Sequelize.DECIMAL, allowNull: true },
      consumible: { type: Sequelize.STRING, allowNull: true },
      mes_registro: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: { is: /^\d{4}-(0[1-9]|1[0-2])$/ },
      },
      id_categoria: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'categoria',
          key: 'id_categoria'
        },
        onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
      },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id_usuario'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
        
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
      
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },


  async down(queryInterface) {
    await queryInterface.dropTable('insumos');
  }
};


