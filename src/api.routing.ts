import * as express from "express";

import { CustomerController } from "./controller/customer.controller";

export class ApiRouting {
  public static ConfigureRouters(app: express.Router): any {
    app.use(CustomerController.route, new CustomerController().router);
  }
}
