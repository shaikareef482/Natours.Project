
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException',err =>{

    console.log('UNHANDLE REJECTION! 💥 Shuttig down....')
    console.log(err.name,err.message);
    process.exit(1);
    

})

dotenv.config({path:'./config.env'});
const app = require('./app')

const DB = process.env.DATABASE;
mongoose
.connect(DB,{
    useNewUrlParser:true,

}).then(() =>{

    console.log('DB connection successfully');
});






const port = process.env.PORT;
const server=app.listen(port,()=>{
    console.log(`App running on port ${port}....`);

});


process.on('unhandledRejection',err=>{
    
    console.log('UNHANDLE REJECTION! 💥 Shuttig down....')
    console.log(err.name,err.message);
    server.close(()=>{
        process.exit(1);
    });
    
});


