const db = require('../db')
const { Sequelize } = db;
const socketMap = require('../../socketMap');


const Message = db.define('message', {
  isPublic: {
    type: Sequelize.VIRTUAL,
    get: function(){
      return !this.toId;
    }
  },
  txt: {
    type: Sequelize.STRING
  },
  fromId: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
})

Message.addHook('afterCreate', async(message)=> {
  message = await Message.findByPk(message.id,
    {
      include: [
        { model: db.models.user, as: 'to'}, 
        { model: db.models.user, as: 'from'}, 
      ]
    });
  Object.values(socketMap).forEach( value => {
    const { socket, user } = value;
    if(!message.toId || message.toId === user.id){
      if(message.fromId !== socket.user.id){
        socket.emit('message', message);
      }
    }
  });

});

Message.addHook('beforeValidate', (message)=> {
  if(!message.toId){
    message.toId = null;
  }
});

module.exports = Message;

