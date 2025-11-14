<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Ziggy Generation
    |--------------------------------------------------------------------------
    |
    | The 'only' and 'except' configuration arrays allow you to limit which
    | routes are shared with the frontend. By default, all routes are
    | shared. You can use wildcards, like 'admin.*' or 'posts.show'.
    |
    */

    'only' => [
        'events.*',
        // Add other route patterns you want to include here
    ],

    'except' => [
        // 'debugbar.*',
    ],

    /*
    |--------------------------------------------------------------------------
    | Ziggy File Generation
    |--------------------------------------------------------------------------
    |
    | The 'path' option is the output path for the generated 'ziggy.js'
    | file. The 'skip-route-function' option allows you to generate
    | a file containing only your routes object.
    |
    */

    'path' => 'resources/js/ziggy.js',

    'skip-route-function' => false,

    /*
    |--------------------------------------------------------------------------
    | Route Groups
    |--------------------------------------------------------------------------
    |
    | This option allows you to define groups of routes that can be loaded
    | on-demand. See the docs for more info.
    |
    */

    'groups' => [],
];
