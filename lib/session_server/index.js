'use strict';

const EventGameSystem = require('@nfactorial/game_state_js').EventGameSystem;

const ConnectionRequestEventArgs = require('../connection_request_event_args');

const Http = require('http');
const SockJs = require('sockjs');
const Connection = require('../connection');

const DEFAULT_PORT = 2000;
const DEFAULT_PREFIX = '/socket';


/**
 * Represents the core session server that allows clients to communicate with a running game.
 *
 * The session server is implements the GameSystem object from @nfactorial/game_state_js and begins
 * listening when it is activated within the state hierarchy.
 *
 * Support for customising the listen port and prefix address will be added once system parameter support
 * is added in the future.
 *
 * The SessionServer object provides events that may be listened to via the addListener/removeListener methods.
 *
 * Available events are listed in the SessionServer.Events property:
 *  SessionServer.Events.CONNECTION_REQUEST
 *  Raised when an external connection attempts to connect to the server. The event arguments provided are an
 *  instance of the ConnectionRequestEventArgs object which allows the title to determine whether to allow or
 *  deny the connection attempt.
 *
 *  SessionServer.Events.CONNECT
 *  Raised when an external connection attempt has been allowed to connect to the title. The event argument
 *  is the Connection instance used for communication with the connected client.
 *
 *  SessionServer.Events.DISCONNECT
 *  Raised when communication with a connection object has been lost, the event argument is the Connection
 *  instance that has been lost.
 */
class SessionServer extends EventGameSystem {

    /**
     *
     */
    constructor() {
        super();

        this.app = null;
        this.port = DEFAULT_PORT;
        this.prefix = DEFAULT_PREFIX;
        this.httpServer = null;

        this.connectionList = [];

        this.connectionRequestArgs = new ConnectionRequestEventArgs();

        this._onConnectionAttempt = this._onConnectionAttempt.bind(this);
    }

    /**
     * Called by the framework when this game system becomes active within the current state tree.
     */
    onActivate() {
        super.onActivate();

        console.log('session_server/onActivate');

        // eslint-disable-next-line camelcase
        const sockOpts = {sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js'};

        this.app = SockJs.createServer(sockOpts);

        this.app.on('connection', this._onConnectionAttempt);

        this.httpServer = Http.createServer();

        this.httpServer.addListener('upgrade', function (req, res) {
            res.end();
        });

        this.app.installHandlers(this.httpServer, {prefix: this.prefix});
        this.httpServer.listen(this.port, '0.0.0.0');

        console.log('Listening on 0.0.0.0:' + this.port);
    }

    /**
     * Called by the framework when we are no longer active within the current state tree.
     */
    onDeactivate() {
        super.onDeactivate();

        this.httpServer.close();
        this.app.close();

        this.httpServer = null;
        this.app = null;
    }

    /**
     * Removes a connection from the game server.
     * @param {Connection} connection - The connection to be removed from the SessionServer object.
     */
    removeConnection(connection) {
        if (!connection) {
            throw new Error('SessionServer.removeConnection - No connection was specified.');
        }

        const index = this.connectionList.indexOf(connection);
        if (index === -1) {
            console.log('SessionServer.removeConnection - Specified connection could not be found.');
        } else {
            this.connectionList.splice(index, 1);
            this.fire(SessionServer.Events.DISCONNECT, connection);
        }
    }

    /**
     * Called when a connection attempt has been made to the server.
     * @param {Socket} socket - The socket the represents the incoming connection attempt.
     * @private
     */
    _onConnectionAttempt(socket) {
        console.log('detected connection attempt');

        const connection = new Connection(this, socket);

        this.connectionRequestArgs.initialize(connection);
        this.fire(SessionServer.Events.CONNECTION_REQUEST, this.connectionRequestArgs);

        // Forcibly remove the connection reference to avoid dangling reference
        this.connectionRequestArgs.connection = null;

        if (this.connectionRequestArgs.isDenied) {
            console.log('connection attempt denied: ' + this.connectionRequestArgs.error.msg);
            socket.close(this.connectionRequestArgs.error.id, this.connectionRequestArgs.error.msg);
        } else {
            console.log('connection attempt approved');
            this.connectionList.push(connection);
            this.fire(SessionServer.Events.CONNECT, connection);
        }
    }
}

/**
 * List of events the game server may raise.
 * Interested code may subscribe or unsubscribe to these events
 * via the addListener and removeListener methods.
 */
SessionServer.Events = {
    CONNECTION_REQUEST: 'CONNECTION_REQUEST',
    CONNECT: 'CONNECT',
    DISCONNECT: 'DISCONNECT'
};


module.exports = SessionServer;
