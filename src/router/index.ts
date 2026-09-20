import { createBrowserRouter, createHashRouter } from "react-router";

import * as config from "@/config";

import { routes } from "./routes";



export const router = config.env.IS_WEB
    ? createBrowserRouter(routes) 
    : createHashRouter(routes);
