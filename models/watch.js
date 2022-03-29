'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Watch extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Watch.init({
    chat_id: DataTypes.STRING,
    address: DataTypes.STRING,
    network: DataTypes.STRING,
    topic: DataTypes.STRING,
    event: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Watch',
  });
  return Watch;
};