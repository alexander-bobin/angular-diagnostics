# Angular diagnostics

JS apps can be difficult to understand. This small library attempts to help you make some sense of your AngularJS 1.x app.

You get two things:

1. **Component mapper** - Visualise the modules and components of your AngularJS app in a D3 node link tree
2. **Event logger** - A logger to help you find and understand the events which fly around your AngularJS app via `$emit` and `$broadcast`

Using each tool is a pretty manual process but worth it.


## 1. Component mapper
### Getting the data
* Include `ComponentMapperModule` (inside `angular-component-mapper.js`) in your app at the root level
* Replace 'name_of_root_module' with the name of your app module inside `angular-component-mapper.js`
* Uncomment `outputModules()` or `outputModulesAndComponents()` depending on what you want to see. 
* Run your app
* You'll see a JSON representation of your app output in the console. Copy that

If your browser times out it's quite possible that you have circular dependencies. Maybe a sub module has a dependency on your root app module. Try and fix that first.

### Using the data
* Drop the module JSON (generated from `outputModules()`) into data-modules.json and module / component JSON (generated from `outputModulesAndComponents()`) into data-components.json
* Then visit `components.html` and `modules.html` as needed
* Enjoy the D3 magic

If some of the module names are too long, search for a function in `components.html` or `modules.html` called `shortenName()` and make changes as you need.


## 2. Event logger
* Include `EventListenerModule` (inside `angular-event-listener.js`) in your app at the root level
* Start your app and slowly (every 2s) click/tap around some regular user journeys. Watch the console output for events being logged per click

In a dirty attempt to group events that result from a user action, any events that are fired more than 2 seconds after a previous event are considered part of a different chain.
