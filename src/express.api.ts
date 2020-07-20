import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { json, urlencoded } from "body-parser";
import * as compression from "compression";
import * as express from "express";
import * as http from "http";

import { AppLogger } from "./helpers/app-logger";
import { Api } from "./helpers/api";

const port = 50511;
export class ExpressApi {
  public app: express.Express;
  private router: express.Router;

  constructor() {
    this.app = express();
    this.router = express.Router();
    this.configure();
  }

  private configure() {
    this.configureMiddleware();
    this.configureBaseRoute();
    this.configureRoutes();
    this.errorHandler();
  }

  private configureMiddleware() {
    this.app.use(json({ limit: "50mb" }));
    this.app.use(compression());
    this.app.use(urlencoded({ limit: "50mb", extended: true }));
    AppLogger.configureLogger();
  }

  private configureBaseRoute() {
    this.app.use((request, res, next) => {
      if (request.url === "/") {
        return res.json({ version: "1.0.0.0", name: "express-api" });
      } else {
        next();
      }
    });
    this.app.use("/", this.router);
  }

  private configureRoutes() {
    this.app.use((request: Request, res: Response, next: NextFunction) => {
      for (const key in request.query) {
        if (key) {
          // eslint-disable-next-line security/detect-object-injection
          request.query[key.toLowerCase()] = request.query[key];
        }
      }
      next();
    });

  }

  private errorHandler() {
    this.app.use(
      (
        error: ErrorRequestHandler,
        request: Request,
        res: Response,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        next: NextFunction
      ) => {
        if (request.body) {
          AppLogger.error("Payload", JSON.stringify(request.body));
        }
        AppLogger.error("Error", error);
        Api.serverError(request, res, error);
      }
    );

    // catch 404 and forward to error handler
    this.app.use((request, res) => {
      Api.notFound(request, res);
    });
  }

  public run() {
    const server = http.createServer(this.app);
    server.listen(port);
    AppLogger.info("Starting", port);
    server.on("error", this.onError);
  }

  private onError(error) {
    if (error.syscall !== "listen") {
      throw error;
    }

    const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case "EACCES":
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  }
}
