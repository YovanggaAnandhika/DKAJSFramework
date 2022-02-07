import { Database, Server } from "./../";

const server = new Promise(async (resolve, rejected) => {
    await Server({
        serverPort : 1999,
        app : false
    }).then(async (result) => {
        //console.info(result)
        await resolve(result);
    }).catch(async (error) => {
        //console.error(error)
        await rejected(error);
    })
})

export default server;