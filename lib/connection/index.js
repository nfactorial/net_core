'use strict';

const CONNECTION_TIMEOUT = 1000 * 5;

/**
 * Represents a connection between the client and server.
 *
 * By default any incoming data from the client is discarded, the title must register a message
 * handler with the connection in-order to process the incoming messages. To do this, provide
 * a callback to the onMessage function.
 * ```
 * Connection connection = new Connection(server, socket);
 *
 * connection.onMessage((data) => {
 *     // Process data here.
 * });
 *
 */
class Connection {

    /**
     * Prepares the Connection object for use by the server.
     * @param {SessionServer} sessionServer - The session server we belong to.
     * @param {Socket} socket - The socket we are to communicate with.
     */
    constructor(sessionServer, socket) {
        if (!sessionServer) {
            throw new Error('Cannot create connection without a valid session server object.');
        }

        if (!socket) {
            throw new Error('Cannot create connection without a valid socket.');
        }

        this.sessionServer = sessionServer;
        this.messageHandler = null;
        this.credentials = null;
        this.socket = socket;
        this.player = null;
        this.keepAlive = Date.now();

        socket.on('close', this._onSocketClosed.bind(this));
        socket.on('data', this._onReceiveData.bind(this));
    }

    /**
     * Disconnects from the client machine.
     * @param {Number} err - Error number specifying why the disconnect is happening.
     * @param {String} reason - Reason why the disconnect occurred.
     */
    disconnect(err) {
        // TODO: What if disconnect call comes from somewhere other than the session server, can we handle that?
        if (this.socket) {
            this.socket.close(err.id, err.msg);

            this.sessionServer = null;
            this.socket = null;
        }
    }

    /**
     * Registers a message handler with the connection, the callback will be invoked when any data is received
     * from the client machine.
     * The message handler callback will receive a reference to the client object along with the data received.
     * Only one message handler may be registered at a time for a single Connection object.
     * @param {function} cb - The callback to be invoked when any message data is received.
     */
    onMessage(cb) {
        this.messageHandler = cb;
    }

    /**
     * Sends a data packet to the client using this connection object.
     * @param {Object} data - The data representing the message to be sent.
     */
    send(data) {
        if (this.socket) {
            this.socket.write(data);
        }
    }

    /**
     * Determines whether or not the connection should be considered alive.
     * @returns {boolean} True if the connection should be considered alive, otherwise false.
     */
    isAlive() {
        return (this.socket && (Date.now() - this.keepAlive) < CONNECTION_TIMEOUT );
    }

    /**
     * Internal method invoked when we receive data from the client connection.
     * @param {Object} msg - The data that was received from the client.
     * @private
     */
    _onReceiveData(msg) {
        if (this.messageHandler) {
            const parsedData = JSON.parse(msg);
            this.messageHandler(this, parsedData);
        }
    }

    /**
     * Internal method invoked when our socket connection has been closed.
     * @private
     */
    _onSocketClosed() {
        this.socket = null;

        if (this.sessionServer) {
            this.sessionServer.removeConnection(this);
        }
    }
}

Connection.Errors = {
    SERVER_FULL: { id: 100, msg: 'Server Full' },
    SESSION_TERMINATED: {id: 101, msg: 'Session Terminated'}
};


module.exports = Connection;
