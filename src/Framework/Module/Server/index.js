'use strict';
'use warning';
import _ from 'lodash';
import Mac from "macaddress";
import os from "os";
import delay from "delay";
import cliProgress from "cli-progress";
import ansiColors from "ansi-colors";
import DKA from "./../index.module.d.js";
import isElectron from "is-electron";
import electronLog from "electron-log";
import {existsSync} from "fs";
import Options from "./../Options";

/** Third Component Server Data Controller**/
import HTTPEngine from "./HTTP";
import ReactEngine from "./REACT"
import FastifyEngine from "./FASTIFY";
import ExpressEngine from "./EXPRESS";
/** End Third Component Server Data Controller **/
/** Tunneling Data Controlling Tunel **/
import mNgrok from "ngrok";
import localtunnel from "localtunnel";
/** End Tunneling Data Controlling Tunel **/
import autoload from "./Autoloads";

let mApp = null;
let db = null;
let electronInstance = null;
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
        await (isElectron()) ? electronLog.info({ state : Options.READY_STATE, descriptions : "Running Program" }) :
            mProgressBar.start(43, 0, { state : Options.READY_STATE, descriptions : "Running Program" });
        //------------------------------------------------------------------------------------------------------
        await resolve();
    }).then(async () => {
        //------------------------------------------------------------------------------------------------------
        await (isElectron()) ? electronLog.info({ state : Options.LOADING_STATE, descriptions : "get configuration"}) :
            mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "get configuration"});
        await delay(Options.DELAY_TIME);
        //------------------------------------------------------------------------------------------------------
        //######################################################################################################
        configuration = await _.merge(DKA.config.Server, config);
        DKA.config.Server = configuration;
        Server.CONFIG = configuration;
        //######################################################################################################
        //------------------------------------------------------------------------------------------------------
        await (isElectron()) ? electronLog.info({ state : Options.LOADED_STATE, descriptions : "get configuration"}) :
            mProgressBar.increment( { state : Options.LOADED_STATE, descriptions : "get configuration"});
        await delay(Options.DELAY_TIME);
        //------------------------------------------------------------------------------------------------------
        return true;
    }).then(async () => {
        //------------------------------------------------------------------------------------------------------
        await (isElectron()) ? electronLog.info({ state : Options.LOADING_STATE, descriptions : "core server engine"}) :
            mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "core server engine"});
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
                    await (isElectron()) ? electronLog.info({ state : Options.LOADING_STATE, descriptions : "selected [Fastify] core engine"}) :
                        mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "selected [Fastify] core engine"});
                    await delay(Options.DELAY_TIME);
                    const AppEngine = await FastifyEngine(configuration)
                    await (isElectron()) ? electronLog.info({ state : Options.LOADED_STATE, descriptions : "selected [Fastify] core engine"}) :
                        mProgressBar.increment( { state : Options.LOADED_STATE, descriptions : "selected [Fastify] core engine"});
                    await delay(Options.DELAY_TIME);

                    await AppEngine.register(async (app, opts, next) => {
                        let mAppPointing = false;
                        await (isElectron()) ? electronLog.info({ state : Options.LOADING_STATE, descriptions : "Pointing Entry System"}) :
                            mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "Pointing Entry System"});
                        await delay(Options.DELAY_TIME);
                        /** get Configuration.app type variable **/
                        const appType = configuration.app;
                        /** Checking Variable **/
                        switch (typeof appType){
                            case "boolean" :
                                switch (appType){
                                    case true :
                                        if (existsSync(configuration.options.appDir)){
                                            if (require(configuration.options.appDir).default !== undefined){
                                                let fromDirController = require(configuration.options.appDir).default;
                                                if (typeof fromDirController === "function"){
                                                    mAppPointing = require(configuration.options.appDir).default;
                                                }else{
                                                    setTimeout(async () => {
                                                        await process.exit()
                                                    }, 2000);
                                                    throw { status : false, code : 500, msg : `index.js in ${configuration.options.appDir} folder Illegal Format`}
                                                }
                                            }else{
                                                setTimeout(async () => {
                                                    await process.exit()
                                                }, 2000);
                                                throw { status : false, code : 500, msg : `index.js in ${configuration.options.appDir} folder don't have default export`}
                                            }
                                        }else{
                                            setTimeout(async () => {
                                                await process.exit()
                                            }, 2000);
                                            throw { status : false, code : 500, msg : `File ${configuration.options.appDir} don't exist`}
                                        }
                                        break;
                                    case false :
                                        mAppPointing = async (app, opts, next) => {
                                            //Default Page
                                            await next();
                                        };
                                        break;
                                }
                                break;
                            case "function" :
                                mAppPointing = configuration.app;
                                break;
                            default :
                                setTimeout(async () => {
                                    await process.exit()
                                }, 2000);
                                throw { status : false, code : 500, msg : `Illegal app pointing. app must boolean or function`};
                        }

                        await (isElectron()) ? electronLog.info({ state : Options.LOADED_STATE, descriptions : "Pointing Entry System"}) :
                            mProgressBar.increment( { state : Options.LOADED_STATE, descriptions : "Pointing Entry System"});
                        await delay(Options.DELAY_TIME);

                        await (isElectron()) ? electronLog.info({ state : Options.LOADING_STATE, descriptions : "Globally Handling"}) :
                            mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "Globally Handling"});
                        await delay(Options.DELAY_TIME);
                        //##################################################################################################################
                        let mAppHandler = await require("./FASTIFY/GlobHandler").default(app, configuration);
                        //##################################################################################################################
                        await (isElectron()) ? electronLog.info({ state : Options.LOADED_STATE, descriptions : "Globally Handling"}) :
                            mProgressBar.increment( { state : Options.LOADED_STATE, descriptions : "Globally Handling"});
                        await delay(Options.DELAY_TIME);

                        await (isElectron()) ? electronLog.info({ state : Options.LOADING_STATE, descriptions : "Middleware Decorators"}) :
                            mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "Middleware Decorators"});
                        await delay(Options.DELAY_TIME);
                        //##################################################################################################################
                        let mApp = await require('./FASTIFY/Decorator').default(mAppHandler, configuration);
                        //##################################################################################################################
                        await (isElectron()) ? electronLog.info({ state : Options.LOADED_STATE, descriptions : "Globally Handling"}) :
                            mProgressBar.increment( { state : Options.LOADED_STATE, descriptions : "Globally Handling"});
                        await delay(Options.DELAY_TIME);

                        await (isElectron()) ? electronLog.info({ state : Options.LOADING_STATE, descriptions : "Finally Pointing"}) :
                            mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "Finally Pointing"});
                        await delay(Options.DELAY_TIME);
                        //##################################################################################################################
                        await mApp.register(mAppPointing);
                        //##################################################################################################################
                        await (isElectron()) ? electronLog.info({ state : Options.LOADED_STATE, descriptions : "Finally Pointing"}) :
                            mProgressBar.increment( { state : Options.LOADED_STATE, descriptions : "Finally Pointing"});
                        await delay(Options.DELAY_TIME);

                        await next();
                    });
                    return AppEngine;

                }else{
                     throw `Project '${configuration.serverName}' Dinonaktifkan. Set "serverEnabled" ke "true" Untuk Mengaktifkan`;
                }
                /***************************************************/
            case Options.RESTIFY_CORE_ENGINE :
                throw 'not available core engine';
            case Options.REACTJS_CORE_ENGINE :
                mApp = null;
                await (isElectron()) ? electronLog.info({ state : Options.LOADING_STATE, descriptions : "preparing react core engine"}) :
                    mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "preparing react core engine"});
                await delay(Options.DELAY_TIME);
                await ReactEngine(configuration)
                    .then(async (AppEngine) => {
                        mApp = AppEngine;
                        await (isElectron()) ? electronLog.info({ state : Options.LOADED_STATE, descriptions : "finish react core engine"}) :
                            mProgressBar.increment( { state : Options.LOADED_STATE, descriptions : "finish react core engine"});
                        await delay(Options.DELAY_TIME);
                    }).catch(async (error) => {
                        throw error;
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
                await (isElectron()) ? electronLog.info({ state : Options.LOADING_STATE, descriptions : "Listening Service"}) :
                    mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "Listening Service"});
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

                                await api.listTunnels().then(async (result) => {
                                    const response = JSON.stringify({ status : true, msg : "Berhasil", text : `Aplikasi '${configuration.serverName}' Server Dengan Alamat ${address}`, Ngrok : [ result.tunnels[1].public_url, result.tunnels[0].public_url]});
                                    await resolve(response);
                                }).catch(async (error) => {
                                    const response = JSON.stringify({ status : true, msg : "Berhasil", text : `Aplikasi '${configuration.serverName}' Server Dengan Alamat ${address}`, Ngrok : { error : error }});
                                    await resolve(response);
                                });
                            } else if (configuration.settings.localtunnel) {
                                const tunnel = await localtunnel({port: configuration.serverPort});
                                const response = JSON.stringify({ status : true, msg : "Berhasil", text : `Aplikasi '${configuration.serverName}' Server Dengan Alamat ${address}`, Localtunnel : tunnel.url})
                                await mProgressBar.increment( { state : Options.COMPLETE_STATE, descriptions : "Listening Service"});
                                await delay(Options.DELAY_TIME);
                                await resolve(response);
                                await mProgressBar.stop()
                            } else {
                                const response = JSON.stringify({ status : true, msg : "Berhasil", text : `Aplikasi '${configuration.serverName}' Server Dengan Alamat ${address}`});
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
            case Options.REACTJS_CORE_ENGINE :
                await (isElectron()) ? electronLog.info({ state : Options.LOADING_STATE, descriptions : "start engine webpackDev"}) :
                    mProgressBar.increment( { state : Options.LOADING_STATE, descriptions : "start engine webpackDev"});
                await delay(Options.DELAY_TIME);
                await AppEngine.start()
                    .then(async (res) => {
                        console.log(res)
                    }).catch(async (error) => {
                        console.log(error)
                    })
                break;
            default :
                throw "Server Engine Not Found"
        }
    });

};

Server.Autoload = autoload;


export default Server;
