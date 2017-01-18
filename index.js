(function() {

    // init Simple, this is actually a selector
    // returns a Simple object containing selected nodelist
    // $('.selector')
    // $('.selector', '.context')
    // $('.selector', context)
    // TODO: $('<div>') for creating new dom
    var Simple = function(selector, context) {
        // simply pass params to query()
        return this.merge(query(selector, context));
    }

    // add length for Simple object
    Simple.prototype.length = 0;

    // util: get node's unique id
    var UID = 1;

    function get_uid(node) {
        return node.uid || (node.uid = UID++);
    }

    // util: shortcut for querySelectorAll
    // $('.selector')
    // $('.selector', '.context')
    // $('.selector', context)
    function query(selector, context) {
        // $('.selector')
        if (!context) {
            return Array.from(document.querySelectorAll(selector));
        }
        // $('.selector', '.context')
        if (typeof context == 'string') {
            context = document.querySelectorAll(context);
        }
        // at this point context should always be an array-like object
        var nodes = [];
        context.forEach(function(cxt) {
            nodes = nodes.concat(Array.from(cxt.querySelectorAll(selector)));
        });
        return nodes;
    }

    // util: iterate the Simple object
    Simple.prototype.forEach = function(fn) {
        var i = 0;
        while ((i < this.length) && fn(this[i++])) {}
    }

    // util: merge an array or object into current Simple object
    Simple.prototype.merge = function(another) {
        var len = another.length,
            i = Number(this.length) || 0,
            j;
        for (j = 0; j < len; j++) {
            this[i++] = another[j];
        }
        this.length = i;
    }

    // util: remove something from an array
    Array.prototype.remove = function(obj) {
        var index = this.indexOf(obj);
        if (index > -1) {
            this.splice(index, 1);
        }
        return this;
    }

    // event bind
    // .on('click', function() {})
    // .on('click', '.children', function() {})
    Simple.prototype.on = function(event, selector, fn) {
        if (!fn && typeof selector == 'function') {
            fn = selector;
            selector = null;
        }
        this.forEach(function(node) {
            let _fn = function(ev) {
                if (selector) {
                    // Node.on('click', '.children', function() {})
                    var el = ev.target,
                        match = Array.from(node.querySelectorAll(selector));
                    do {
                        if (match.includes(el)) {
                            fn.call(el);
                        }
                    } while ((el != node) && (el = el.parentNode || node));
                } else {
                    // Node.on('click', function() {})
                    fn.call(node);
                }
            }
            node.addEventListener(event, _fn);
            // cache the callbacks
            let uid = get_uid(node);
            if (!DATA_PRIVATE[uid]) {
                DATA_PRIVATE[uid] = {};
            }
            if (!DATA_PRIVATE[uid]['ev_fn_map']) {
                DATA_PRIVATE[uid]['ev_fn_map'] = {};
            }
            if (!DATA_PRIVATE[uid]['ev_fn_map'][event]) {
                DATA_PRIVATE[uid]['ev_fn_map'][event] = new Map();
            }
            DATA_PRIVATE[uid]['ev_fn_map'][event].set(fn, _fn);
        });
        return this;
    }

    // event unbind
    // .off()
    // .off('click')
    // .off('click', fn)
    Simple.prototype.off = function(event, fn) {
        // .off('click', function() {})
        if (typeof fn == 'function') {
            this.forEach(function(node) {
                try {
                    let uid = get_uid(node);
                    node.removeEventListener(event, DATA_PRIVATE[uid]['ev_fn_map'][event][fn]);
                } catch (err) {}
            });
            return this;
        }
        // .off('click')
        if (event) {
            this.forEach(function(node) {
                let uid = get_uid(node),
                    fn_list = DATA_PRIVATE[uid]['ev_fn_map'][event];
                fn_list.forEach(function(_fn) {
                    node.removeEventListener(event, _fn);
                });
                DATA_PRIVATE[uid]['ev_fn_map'][event].clear();
            });
            return this;
        }
        // .off()
        this.forEach(function(node) {
            let uid = get_uid(node),
                fn_map = DATA_PRIVATE[uid]['ev_fn_map'];
            for (event in fn_map) {
                let fn_list = fn_map[event];
                fn_list.forEach(function(_fn) {
                    node.removeEventListener(event, _fn);
                });
            }
            DATA_PRIVATE[uid]['ev_fn_map'] = {};
        });
    }

    // data cache
    var DATA_PUBLIC = {};
    var DATA_PRIVATE = {};

    // .data()
    // .data('key')
    // .data('key', val)
    Simple.prototype.data = function(key, val, /*internal*/ private) {
        var uid = get_uid(this),
            storage = private ? DATA_PRIVATE : DATA_PUBLIC;
        data = storage[uid] || {};
        // .data()
        if (!key) {
            return data;
        }
        // .data('key')
        if (typeof val == 'undefined') {
            return data[key];
        }
        // .data('key', val)
        data[key] = val;
        storage[uid] = data;
        return this;
    }

    window.$ = function(selector, context) {
        return new Simple(selector, context);
    }

})();
