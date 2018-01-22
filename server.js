const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// Connect to mongo
mongo.connect('mongodb://localhost:27017/mongochat', ( err, db )=>{
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    // Connect to Socket.io
    client.on('connection', socket => {
        const chat = db.collection('chats');

        //Create function to set status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id: 1}).toArray((err, res)=>{
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);

        });

        // handle input events
        socket.on('input', data => {
            let username = data.username;
            let message = data.message;

            // check for name and message
            if(username == '' || message == ''){
                // Send error status
                sendStatus('Please enter a username and message');
            }else{
                // Insert message
                chat.insert({username, message}, () => {
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        'message': 'Message sent',
                        'clear': true
                    });

                });
            }
        });

        socket.on('clear', data => {
            // Remove all chats from collection
            chat.remove({}, () =>{
                // Emit cleared
                socket.emit('cleared');
            });
        });

    });

});