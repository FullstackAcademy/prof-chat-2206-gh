const { db, models: { User} } = require('./db')
const PORT = process.env.PORT || 8080
const app = require('./app')
const seed = require('../script/seed');
const socketMap = require('./socketMap');
const { Server } = require("socket.io");

const init = async () => {
  try {
    if(process.env.SEED === 'true'){
      await seed();
    }
    else {
      await db.sync()
    }
    // start listening (and create a 'server' object representing our server)
    const server = app.listen(PORT, () => console.log(`Mixing it up on port ${PORT}`));
    const socketServer = new Server(server);
    socketServer.on('connection', socket => {
      socket.emit('welcome', 'hi');
      socket.on('token', async(token) => {
        try {
          const user = await User.findByToken(token);
          socket.emit('welcome', user.username);
          socket.user = user;
          socketMap[user.id] = { user, socket };
          socket.broadcast.emit('userEntered', user);
        }
        catch(ex){
          console.log(ex);
        }
      });
      socket.on('disconnect', () => {
        if(socket.user){
          socket.broadcast.emit('userLeft', socket.user);
          delete socketMap[socket.user.id];
        }
      });
    });

  } catch (ex) {
    console.log(ex)
  }
}

init()
