Net Core
========
This module implements the low-level network management for a real-time
game server.

To install:
```
npm install --save @nfactorial/net_core
```
This module is intended for use with the state management library
provided by @nfactorial/game_state_js.

The NetCore.SessionServer object implements the GameSystem class from
game_state_js so that it may be used within the state tree. To ensure
the SessionServer is available, you must register the class with the
factory supplied to the state tree during initialisation.
```
const NetCore = require('@nfactorial/net_core');
const Factory = require('@nfactorial/factory_node');

const systemFactory = new Factory();

systemFactory.register('SessionServer', NetCore.SessionServer);
```
