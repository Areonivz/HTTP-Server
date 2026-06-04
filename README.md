# C++ HTTP Server for Data Analysis

A lightweight, high-performance C++ HTTP server designed specifically to host and serve a dynamic data analysis web application. The server efficiently handles incoming client requests, routing them to deliver the core user interface and supporting static assets.

## Core Architecture

* **Frontend Delivery**: Serves the primary HTML interface upon the initial client connection.
* **Dynamic Assets**: Automatically detects and streams corresponding CSS and JS files when requested by the browser.
