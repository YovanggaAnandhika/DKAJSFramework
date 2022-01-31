'use strict';
'use warning';
import _ from 'lodash';
import Mac from "macaddress";
import path from "path";
import os from "os";
import delay from "delay";
import cliProgress from "cli-progress";
import ansiColors from "ansi-colors";
import DKA, {Database} from "./../index.module.d.js";
import {existsSync} from "fs";
import Options from "./../Options";
import php from "php";

import HTTPEngine from "./HTTP";
import ReactEngine from "./REACT"
import FastifyEngine from "./FASTIFY";
import ExpressEngine from "./EXPRESS";

import mNgrok from "ngrok";
import localtunnel from "localtunnel";
import autoload from "./Autoloads";
import {App} from "react-bootstrap-icons";

let mResponseCallback = null;
let mApp = null;
let db = null;
let configuration = {};

global.mProgressBar = new cliProgress.Bar({
    format: 'DKA [{state}] {descriptions}' + ansiColors.blue('{bar}') + ' | {percentage}% || {value} Chunks',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
});

/**
 * @constant
 * @type {Function}
 * @default
 */
const Server = async (config) => {

    
    return await new Promise(async (resolve) => {
        //------------------------------------------------------------------------------------------------------
        await mProgressBar.start(43, 0, { state : Options.READY_STATE, descriptions : "Running Program" });
        //------------------------------------------------------------------------------------------------------
        await resolve();
    }).then(async () => {
        //------------------------------------------------------------------------------------------------------
        await mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "get configuration"});
        await delay(Options.DELAY_TIME);
        //------------------------------------------------------------------------------------------------------
        //######################################################################################################
        configuration = await _.merge(DKA.config.Server, config);
        DKA.config.Server = configuration;
        Server.CONFIG = configuration;
        //######################################################################################################
        //------------------------------------------------------------------------------------------------------
        await mProgressBar.increment( { state : Options.LOADED_STATE, descriptions : "get configuration"});
        await delay(Options.DELAY_TIME);
        //------------------------------------------------------------------------------------------------------
        return true;
    }).then(async () => {
        //------------------------------------------------------------------------------------------------------
        await mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "core server engine"});
        await delay(Options.DELAY_TIME);
        //------------------------------------------------------------------------------------------------------
        switch (configuration.serverEngine) {
            case Options.HTTP2_CORE_ENGINE :
                //**************************************************/
                mApp = null;
                await HTTPEngine(configuration).then((AppEngine) => {
                    mApp = AppEngine;
                });
                /***************************************************/
                return mApp;
            case Options.EXPRESS_CORE_ENGINE :
                //**************************************************/
                mApp = null;
                await ExpressEngine(configuration).then(async (AppEngine) => {
                    mApp = AppEngine;
                });
                /***************************************************/
                return mApp;
            case Options.FASTIFY_CORE_ENGINE :
                //**************************************************/
                if (configuration.serverEnabled){
                    await mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "selected [Fastify] core engine"});
                    await delay(Options.DELAY_TIME);
                    const AppEngine = await FastifyEngine(configuration)
                    await mProgressBar.increment( { state : Options.LOADED_STATE, descriptions : "selected [Fastify] core engine"});
                    await delay(Options.DELAY_TIME);

                    await AppEngine.register(async (app, opts, next) => {
                        await mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "Pointing Entry System"});
                        await delay(Options.DELAY_TIME);
                        const mAppPointing = (configuration.app) ? configuration.app : (existsSync(configuration.options.appDir) ? configuration.options.appDir :
                            async (app, opts, next) => {
                                await next();
                            });
                        await mProgressBar.increment( { state : Options.LOADED_STATE, descriptions : "Pointing Entry System"});
                        await delay(Options.DELAY_TIME);

                        await mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "Globally Handling"});
                        await delay(Options.DELAY_TIME);
                        let mAppHandler = await require("./FASTIFY/GlobHandler").default(app, configuration);
                        await mProgressBar.increment( { state : Options.LOADED_STATE, descriptions : "Globally Handling"});
                        await delay(Options.DELAY_TIME);

                        await mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "Middleware Decorators"});
                        await delay(Options.DELAY_TIME);
                        let mApp = await require('./FASTIFY/Decorator').default(mAppHandler, configuration);
                        await mProgressBar.increment( { state : Options.LOADED_STATE, descriptions : "Globally Handling"});
                        await delay(Options.DELAY_TIME);

                        await mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "Finally Pointing"});
                        await delay(Options.DELAY_TIME);
                        await mApp.register(mAppPointing);
                        await mProgressBar.increment( { state : Options.LOADED_STATE, descriptions : "Finally Pointing"});
                        await delay(Options.DELAY_TIME);

                        await next();
                    });
                    return AppEngine;

                }else{
                     throw `Project "${configuration.serverName}" Dinonaktifkan. Set "serverEnabled" ke "true" Untuk Mengaktifkan`;
                }
                /***************************************************/
            case Options.RESTIFY_CORE_ENGINE :
                throw 'not available core engine';
            case Options.REACTJS_CORE_ENGINE :
                mApp = null;
                await ReactEngine(configuration).then(async (AppEngine) => {
                    mApp = AppEngine;
                })
                return mApp;
            default :
                throw ' Server Engine Unknown';
        }
    }).then(async (AppEngine) => {

        switch (configuration.serverEngine) {
            /** Aksi Yang Akan Terjadi Jika Jenis Core Engine Adalah Fastify **/
            case Options.FASTIFY_CORE_ENGINE :
                /** Melakukan Pengecekan Apakah State Server Adalah Development Atau Produksi **/
                await mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "Listening Service"});
                await delay(Options.DELAY_TIME);
                return await new Promise (async (resolve, rejected) => {
                    await AppEngine.listen(configuration.serverPort, configuration.serverHost, async (err, address) => {
                        if (!err) {
                            if (configuration.settings.ngrok.enabled === true) {
                                await mNgrok.connect({
                                    addr : configuration.serverPort,
                                    authtoken : configuration.settings.ngrok.authToken,
                                    onStatusChange : _ => {

                                    }, onLogEvent : _ => {

                                    }
                                }).catch((e) => {
                                    rejected(e.toString())
                                });

                                const api = await mNgrok.getApi();
                                const tunnels = await api.listTunnels();

                                await tunnels.then(async (result) => {
                                    const response = JSON.stringify({ status : true, msg : "Berhasil", text : `Aplikasi "${configuration.serverName}" Server Dengan Alamat ${address}`, Ngrok : [ result.tunnels[1].public_url, result.tunnels[0].public_url]});
                                    await Mac.all(async (err, mac) => {
                                        if (!err){
                                            await Object.keys(mac).forEach((key) => {
                                                db
                                                    .doc(mac[key].mac)
                                                    .set({
                                                        server : {
                                                            localAddress : configuration.serverHost,
                                                            localPort : configuration.serverPort,
                                                            ngrok : {
                                                                http : result.tunnels[1].public_url,
                                                                https : result.tunnels[0].public_url
                                                            }
                                                        },
                                                        device : {
                                                            adapter : key,
                                                            ipv4 : mac[key].ipv4,
                                                            ipv6 : mac[key].ipv6,
                                                            hostname : os.hostname(),
                                                            arch : os.arch(),
                                                            cpu : os.cpus(),
                                                        }
                                                    }, { merge : true });
                                            })


                                        }
                                    })
                                    await resolve(response);
                                }).catch(async (error) => {
                                    const response = JSON.stringify({ status : true, msg : "Berhasil", text : `Aplikasi "${configuration.serverName}" Server Dengan Alamat ${address}`, Ngrok : { error : error }});
                                    await resolve(response);
                                });
                            } else if (configuration.settings.localtunnel === true) {
                                const tunnel = await localtunnel({port: configuration.serverPort});
                                const response = JSON.stringify({ status : true, msg : "Berhasil", text : `Aplikasi "${configuration.serverName}" Server Dengan Alamat ${address}`, Localtunnel : tunnel.url})
                                await mProgressBar.increment( { state : Options.COMPLETE_STATE, descriptions : "Listening Service"});
                                await delay(Options.DELAY_TIME);
                                await resolve(response);
                                await mProgressBar.stop()
                            } else {
                                const response = JSON.stringify({ status : true, msg : "Berhasil", text : `Aplikasi "${configuration.serverName}" Server Dengan Alamat ${address}`});
                                await mProgressBar.increment( { state : Options.COMPLETE_STATE, descriptions : "Listening Service"});
                                await delay(Options.DELAY_TIME);
                                await resolve(response);
                                await mProgressBar.stop();
                            }
                        } else {
                            await rejected(JSON.stringify(err));
                            await mProgressBar.stop();
                        }
                    })
                });
            default :
                throw "Server Engine Not Found"
        }
    });

};

Server.Autoload = autoload;


export default Server;
